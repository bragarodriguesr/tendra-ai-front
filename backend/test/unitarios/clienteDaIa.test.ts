import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import Anthropic from "@anthropic-ai/sdk";
import { afterEach, describe, expect, it } from "vitest";
import { ClienteDaIa, criarApiDoClaude, ErroDaIa, type EntradaDoRegistro, type ParametrosDaGeracao } from "../../src/ia/cliente.ts";
import { ApiSimulada, mensagem, texto } from "../apoio/apiSimulada.ts";

const CHAVE_FALSA = "chave-falsa-de-teste-a5";
const TEXTO_DO_DOCUMENTO = "Conteúdo confidencial do documento";
const PARAMETROS: ParametrosDaGeracao = {
  model: "claude-opus-5-5",
  max_tokens: 1000,
  messages: [{ role: "user", content: [{ type: "text", text: TEXTO_DO_DOCUMENTO }] }],
};

const pedido = { etapa: "geracao" as const, documentos: ["politica.md"], perguntas: [1, 2], parametros: PARAMETROS };

function cliente(api: ApiSimulada) {
  const registro: EntradaDoRegistro[] = [];
  return { registro, cliente: new ClienteDaIa(api, (entrada) => registro.push(entrada)) };
}

async function erroDe(promessa: Promise<unknown>): Promise<ErroDaIa> {
  const erro = await promessa.then(
    () => null,
    (falha: unknown) => falha,
  );
  if (!(erro instanceof ErroDaIa)) throw new Error(`esperava ErroDaIa, veio ${String(erro)}`);
  return erro;
}

describe("Cenário 29 · registro das requisições", () => {
  it("registra etapa, modelo, documentos, perguntas e tokens, sem conteúdo nem chave", async () => {
    const api = new ApiSimulada();
    api.respostas = [mensagem([texto("[P1] Resposta")])];
    const { cliente: ia, registro } = cliente(api);

    await ia.gerar(pedido);

    expect(registro).toEqual([
      expect.objectContaining({
        etapa: "geracao",
        modelo: "claude-opus-5-5",
        documentos: ["politica.md"],
        perguntas: [1, 2],
        tokens: { entrada: 100, saida: 20, lidosDoCache: 900, gravadosNoCache: 0 },
        resultado: "sucesso",
      }),
    ]);
    const serializado = JSON.stringify(registro);
    expect(serializado).not.toContain(TEXTO_DO_DOCUMENTO);
    expect(serializado).not.toContain("Resposta");
  });

  it("registra o modelo que respondeu quando houve fallback", async () => {
    const api = new ApiSimulada();
    api.respostas = [mensagem([texto("ok")], { model: "claude-opus-5" })];
    const { cliente: ia, registro } = cliente(api);
    await ia.gerar(pedido);
    expect(registro[0]?.modelo).toBe("claude-opus-5");
  });
});

describe("Cenário 17 · falhas do provedor de IA", () => {
  it.each([
    ["chave recusada (401)", new Anthropic.AuthenticationError(401, undefined, "invalid x-api-key", new Headers()), "chave_recusada", "Chave da API recusada."],
    ["sem permissão (403)", new Anthropic.PermissionDeniedError(403, undefined, "forbidden", new Headers()), "chave_recusada", "Chave da API recusada."],
    ["pedido inválido (400)", new Anthropic.BadRequestError(400, undefined, "bad", new Headers()), "pedido_recusado", "O provedor de IA recusou o pedido."],
    ["sobrecarga (529) depois das novas tentativas", new Anthropic.InternalServerError(529, undefined, "overloaded", new Headers()), "falha_de_comunicacao", "Falha na comunicação com o provedor de IA."],
    ["sem conexão", new Anthropic.APIConnectionError({ message: "fetch failed" }), "falha_de_comunicacao", "Falha na comunicação com o provedor de IA."],
  ])("%s vira um erro com motivo legível e entra no registro", async (_caso, falha, tipo, mensagemLegivel) => {
    const api = new ApiSimulada();
    api.respostas = [falha];
    const { cliente: ia, registro } = cliente(api);

    const erro = await erroDe(ia.gerar(pedido));

    expect(erro).toMatchObject({ tipo, message: mensagemLegivel });
    expect(registro).toEqual([expect.objectContaining({ resultado: "erro", erro: tipo, tokens: null })]);
  });

  it("recusa do modelo e resposta cortada não seguem adiante como resultado", async () => {
    const api = new ApiSimulada();
    api.respostas = [mensagem([texto("[P1] parcial")], { stop_reason: "refusal" }), mensagem([texto("[P1] parcial")], { stop_reason: "max_tokens" })];
    const { cliente: ia, registro } = cliente(api);

    expect((await erroDe(ia.gerar(pedido))).tipo).toBe("recusa");
    expect((await erroDe(ia.gerar(pedido))).tipo).toBe("resposta_incompleta");
    expect(registro.map((entrada) => [entrada.resultado, entrada.erro])).toEqual([
      ["erro", "recusa"],
      ["erro", "resposta_incompleta"],
    ]);
  });

  it("erro do próprio backend não é confundido com falha do provedor", async () => {
    const api = new ApiSimulada();
    api.respostas = [new TypeError("bug")];
    const { cliente: ia } = cliente(api);
    await expect(ia.gerar(pedido)).rejects.toBeInstanceOf(TypeError);
  });
});

describe("Cenário 17 · novas tentativas pelo SDK, com um servidor local no lugar da API", () => {
  let servidor: Server | undefined;
  afterEach(() => servidor?.close());

  async function servidorLocal(respostas: { status: number; corpo: object }[]) {
    const chaves: string[] = [];
    servidor = createServer((pedidoHttp, resposta) => {
      chaves.push(String(pedidoHttp.headers["x-api-key"]));
      const proxima = respostas.shift() ?? { status: 500, corpo: {} };
      resposta.writeHead(proxima.status, { "content-type": "application/json", "retry-after-ms": "1" });
      resposta.end(JSON.stringify(proxima.corpo));
    });
    await new Promise<void>((pronto) => servidor?.listen(0, "127.0.0.1", pronto));
    const { port } = servidor.address() as AddressInfo;
    return { chaves, endereco: `http://127.0.0.1:${port}` };
  }

  const contagem = { etapa: "contagem" as const, documentos: ["a.md"], perguntas: [], parametros: { model: "claude-opus-5-5", messages: PARAMETROS.messages } };
  const erroDaApi = (tipo: string) => ({ type: "error", error: { type: tipo, message: "x" } });

  it("tenta de novo em erro temporário e conclui na tentativa seguinte", async () => {
    const { chaves, endereco } = await servidorLocal([
      { status: 529, corpo: erroDaApi("overloaded_error") },
      { status: 500, corpo: erroDaApi("api_error") },
      { status: 200, corpo: { input_tokens: 1234 } },
    ]);
    const registro: EntradaDoRegistro[] = [];
    const ia = new ClienteDaIa(criarApiDoClaude(CHAVE_FALSA, { enderecoBase: endereco }), (entrada) => registro.push(entrada));

    expect(await ia.contarTokens(contagem)).toBe(1234);
    expect(chaves).toHaveLength(3);
    expect(JSON.stringify(registro)).not.toContain(CHAVE_FALSA);
  });

  it("depois das novas tentativas, informa a falha de comunicação; chave recusada não é repetida", async () => {
    const falhas = await servidorLocal(Array.from({ length: 4 }, () => ({ status: 500, corpo: erroDaApi("api_error") })));
    const ia = new ClienteDaIa(criarApiDoClaude(CHAVE_FALSA, { enderecoBase: falhas.endereco }), () => {});
    const erro = await erroDe(ia.contarTokens(contagem));
    expect(erro.tipo).toBe("falha_de_comunicacao");
    expect(falhas.chaves).toHaveLength(4);
    expect(erro.message).not.toContain(CHAVE_FALSA);
    servidor?.close();

    const recusada = await servidorLocal([{ status: 401, corpo: erroDaApi("authentication_error") }]);
    const comChaveRecusada = new ClienteDaIa(criarApiDoClaude(CHAVE_FALSA, { enderecoBase: recusada.endereco }), () => {});
    expect((await erroDe(comChaveRecusada.contarTokens(contagem))).tipo).toBe("chave_recusada");
    expect(recusada.chaves).toHaveLength(1);
  });
});
