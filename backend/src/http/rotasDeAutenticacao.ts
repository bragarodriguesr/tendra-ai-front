import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { apagarSessao, criarSessao, perfilAtivo, pessoaDaSessao } from "../autenticacao/sessoes.ts";
import { JANELA_EM_MINUTOS, registrarTentativa, tentativasEsgotadas } from "../autenticacao/tentativas.ts";
import { ErroDoProvedorDeLogin, type VerificadorDeSenha } from "../autenticacao/verificadorSupabase.ts";
import type { Pessoa } from "../config/pessoas.ts";
import type { Banco } from "../persistencia/banco.ts";
import { ErroDaRota } from "./erros.ts";

/**
 * Login, sessão e logout do modo compartilhado (etapa D4, cenários D1 a D6). Com a autenticação
 * ligada, toda rota do Workspace exige sessão, e a pessoa que age vem dela (cenário D4).
 */

export interface OpcoesDaAutenticacao {
  verificador: VerificadorDeSenha;
  /** Horas sem uso até a sessão expirar (cenário D6). */
  horasSemUso: number;
  /** Cookie só por HTTPS (modo compartilhado). Nos testes locais, sem HTTPS, fica falso. */
  cookieSeguro: boolean;
}

declare module "fastify" {
  interface FastifyRequest {
    /** Pessoa da sessão; null sem a autenticação ligada (modo local). */
    pessoaDaSessao: Pessoa | null;
  }
}

export const COOKIE_DA_SESSAO = "tendra_sessao";
export const MENSAGEM_DE_LOGIN_RECUSADO = "E-mail ou senha incorretos.";
export const MENSAGEM_DE_TENTATIVAS_ESGOTADAS = `Muitas tentativas de login. Aguarde ${JANELA_EM_MINUTOS} minutos e tente novamente.`;
const MENSAGEM_DE_SESSAO_INVALIDA = "Sessão inválida ou expirada. Entre novamente.";
const ROTAS_SEM_SESSAO = new Set(["/api/auth/login", "/api/saude"]);
const IDENTIFICADOR = /^[A-Za-z0-9_-]{43}$/;

/**
 * Papéis (etapa D7, cenários D8 e D9): com login, só o Aprovador aprova e exporta. No modo local,
 * sem sessão, o papel não restringe nada (cenário 41).
 */
export function exigirAprovador(pedido: FastifyRequest, mensagem: string): void {
  if (pedido.pessoaDaSessao !== null && pedido.pessoaDaSessao.papel !== "Aprovador") throw new ErroDaRota(403, mensagem);
}

function lerCookie(cabecalho: string | undefined, nome: string): string | null {
  for (const parte of (cabecalho ?? "").split(";")) {
    const [chave, ...valor] = parte.trim().split("=");
    if (chave === nome) return valor.join("=");
  }
  return null;
}

export function registrarAutenticacao(servidor: FastifyInstance, opcoes: { banco: Banco; autenticacao: OpcoesDaAutenticacao }): void {
  const { banco, autenticacao } = opcoes;
  const atributos = `Path=/; HttpOnly; SameSite=Lax${autenticacao.cookieSeguro ? "; Secure" : ""}`;
  const apagarCookie = (resposta: FastifyReply) => resposta.header("set-cookie", `${COOKIE_DA_SESSAO}=; ${atributos}; Max-Age=0`);
  const identificadorDoPedido = (cabecalho: string | undefined) => {
    const valor = lerCookie(cabecalho, COOKIE_DA_SESSAO);
    return valor !== null && IDENTIFICADOR.test(valor) ? valor : null;
  };

  servidor.addHook("onRequest", async (pedido, resposta) => {
    const caminho = pedido.url.split("?")[0] ?? "";
    if (!caminho.startsWith("/api/") || ROTAS_SEM_SESSAO.has(caminho)) return;
    const identificador = identificadorDoPedido(pedido.headers.cookie);
    const pessoa = identificador === null ? null : await pessoaDaSessao(banco, identificador, autenticacao.horasSemUso);
    if (pessoa === null) return apagarCookie(resposta).status(401).send({ erro: MENSAGEM_DE_SESSAO_INVALIDA });
    pedido.pessoaDaSessao = pessoa;
  });

  servidor.post<{ Body: { email: string; senha: string } }>(
    "/api/auth/login",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "senha"],
          additionalProperties: false,
          properties: { email: { type: "string", maxLength: 254 }, senha: { type: "string", maxLength: 200 } },
        },
      },
    },
    async (pedido, resposta) => {
      const email = pedido.body.email.trim().toLowerCase();
      // Cenário D7: o limite vale antes de conferir a senha; a tentativa bloqueada não é registrada.
      if (await tentativasEsgotadas(banco, email, pedido.ip)) return resposta.status(429).send({ erro: MENSAGEM_DE_TENTATIVAS_ESGOTADAS });
      let id: string | null;
      try {
        id = email === "" || pedido.body.senha === "" ? null : await autenticacao.verificador.conferir(email, pedido.body.senha);
      } catch (erro) {
        if (!(erro instanceof ErroDoProvedorDeLogin)) throw erro;
        pedido.log.error({ erro: erro.message }, "Serviço de login indisponível");
        return resposta.status(503).send({ erro: "Serviço de login indisponível. Tente novamente em instantes." });
      }
      const perfil = id === null ? null : await perfilAtivo(banco, id);
      await registrarTentativa(banco, { email, ip: pedido.ip, sucesso: perfil !== null });
      if (perfil === null) return resposta.status(401).send({ erro: MENSAGEM_DE_LOGIN_RECUSADO });

      const identificador = await criarSessao(banco, perfil.id);
      resposta.header("set-cookie", `${COOKIE_DA_SESSAO}=${identificador}; ${atributos}`);
      return { pessoa: { nome: perfil.nome, papel: perfil.papel } };
    },
  );

  servidor.get("/api/auth/me", async (pedido) => ({ pessoa: { nome: pedido.pessoaDaSessao?.nome, papel: pedido.pessoaDaSessao?.papel } }));

  servidor.post("/api/auth/logout", async (pedido, resposta) => {
    const identificador = identificadorDoPedido(pedido.headers.cookie);
    if (identificador !== null) await apagarSessao(banco, identificador);
    apagarCookie(resposta);
    return { saiu: true };
  });
}
