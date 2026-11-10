import type { FastifyInstance, FastifyRequest } from "fastify";
import { AREAS_DO_APROVADOR } from "../regras/areas.ts";
import { PAPEIS } from "../autenticacao/perfis.ts";
import { MENSAGEM_SO_APROVADOR, adicionarUsuario, alterarUsuario, areasDoAprovador, listarUsuariosDaGestao } from "../autenticacao/gestaoDeUsuarios.ts";
import type { Banco } from "../persistencia/banco.ts";
import { organizacaoDo } from "./organizacao.ts";
import { exigirAprovador } from "./rotasDeAutenticacao.ts";

/**
 * Rotas do Painel de Usuários (fase Q, Q1 a Q13). Só existem com login (modo compartilhado) e só
 * respondem ao Aprovador. Ficam em /api/gestao/usuarios para não misturar com GET /api/usuarios, que só
 * devolve nome e papel ao campo "Responsável" (cenários 62 e 74).
 */

const UUID = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$";

/** Pessoa da sessão, que existe em toda rota com login (o gancho de autenticação responde 401 antes). */
function idDaSessao(pedido: FastifyRequest): string {
  exigirAprovador(pedido, MENSAGEM_SO_APROVADOR);
  const id = pedido.pessoaDaSessao?.id;
  if (id === undefined) throw new Error("Rota da gestão sem pessoa da sessão.");
  return id;
}

export function registrarRotasDeGestaoDeUsuarios(servidor: FastifyInstance, opcoes: { banco: Banco; procurarConta: (email: string) => Promise<string | null> }): void {
  const { banco, procurarConta } = opcoes;

  servidor.get("/api/gestao/usuarios", async (pedido) => {
    const sessao = idDaSessao(pedido);
    return { usuarios: await listarUsuariosDaGestao(banco, organizacaoDo(pedido), sessao), areasDoAprovador: areasDoAprovador() };
  });

  // Fase T (T2.7): papel, áreas e situação opcionais; sem eles, Revisor, sem área, ativo (Q3).
  servidor.post<{ Body: { nome: string; email: string; papel?: string; areas?: string[]; ativo?: boolean } }>(
    "/api/gestao/usuarios",
    {
      schema: {
        body: {
          type: "object",
          required: ["nome", "email"],
          additionalProperties: false,
          properties: {
            nome: { type: "string", maxLength: 200 },
            email: { type: "string", maxLength: 254 },
            papel: { type: "string", enum: [...PAPEIS] },
            areas: { type: "array", maxItems: AREAS_DO_APROVADOR.length, items: { type: "string", maxLength: 60 } },
            ativo: { type: "boolean" },
          },
        },
      },
    },
    async (pedido, resposta) => {
      const sessao = idDaSessao(pedido);
      const { nome, email, papel, areas, ativo } = pedido.body;
      const usuario = await adicionarUsuario(banco, { organizacaoId: organizacaoDo(pedido), idDaSessao: sessao, nome, email, papel, areas, ativo, procurarConta });
      return resposta.status(201).send({ usuario });
    },
  );

  servidor.patch<{ Params: { id: string }; Body: { papel?: string; areas?: string[]; ativo?: boolean } }>(
    "/api/gestao/usuarios/:id",
    {
      schema: {
        params: { type: "object", required: ["id"], properties: { id: { type: "string", pattern: UUID } } },
        body: {
          type: "object",
          minProperties: 1,
          additionalProperties: false,
          properties: {
            papel: { type: "string", enum: [...PAPEIS] },
            areas: { type: "array", maxItems: AREAS_DO_APROVADOR.length, items: { type: "string", maxLength: 60 } },
            ativo: { type: "boolean" },
          },
        },
      },
    },
    async (pedido) => {
      const sessao = idDaSessao(pedido);
      return { usuario: await alterarUsuario(banco, { organizacaoId: organizacaoDo(pedido), idDaSessao: sessao, id: pedido.params.id.toLowerCase(), mudanca: pedido.body }) };
    },
  );
}
