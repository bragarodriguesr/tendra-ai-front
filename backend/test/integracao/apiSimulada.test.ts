import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { carregarBase } from "../../src/base/carga.ts";
import { carregarCabecalhos } from "../../src/config/cabecalhos.ts";
import { carregarConfiguracaoDoServidor, ErroDeConfiguracao } from "../../src/config/config.ts";
import { carregarTermosCriticos } from "../../src/config/termosCriticos.ts";
import { processarTarefa } from "../../src/fluxo/processarTarefa.ts";
import { criarApiSimulada } from "../../src/ia/apiSimulada.ts";
import { ClienteDaIa } from "../../src/ia/cliente.ts";
import { abrirBancoDeTeste } from "../apoio/banco.ts";
import type { Banco } from "../../src/persistencia/banco.ts";
import { ORGANIZACAO_INICIAL } from "../../src/persistencia/organizacoes.ts";

/**
 * API simulada do servidor (TENDRA_API_SIMULADA=1), usada até a A1. Não mede a IA: só garante
 * que o caminho inteiro funciona e que as respostas passam pela mesma checagem das reais.
 */
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../base-sintetica");
const IA = { modelo: "claude-opus-5-5", modeloDeIdentificacao: "claude-haiku-5-5", modeloDeConflito: "claude-haiku-5-5", esforco: "medium" as const, tamanhoDoLote: 10 };

let banco: Banco;
beforeAll(async () => {
  banco = await abrirBancoDeTeste();
  await carregarBase({ organizacaoId: ORGANIZACAO_INICIAL, pasta: path.join(RAIZ, "pulse-beneficios/base"), banco, hoje: "2026-10-21", enviadoPor: null });
}, 60_000);
afterAll(async () => {
  await banco.close();
});

const processar = async (arquivo: string) =>
  processarTarefa({ organizacaoId: ORGANIZACAO_INICIAL, 
    banco,
    cliente: new ClienteDaIa(criarApiSimulada(), () => {}),
    ia: IA,
    nomesDeCabecalho: await carregarCabecalhos(),
    termosCriticos: await carregarTermosCriticos(),
    hoje: "2026-10-21",
    nomeDoArquivo: path.basename(arquivo),
    planilha: new Uint8Array(await readFile(path.join(RAIZ, "rfps", arquivo))),
  });

describe("API simulada", () => {
  it("responde parte das perguntas com fontes válidas da base e marca as respostas como simuladas", async () => {
    const { itens } = await processar("RFP-01-Rede-Varejo-Alfa.xlsx");
    const sugeridos = itens.filter((item) => item.st === "sugerida");
    expect(sugeridos.length).toBeGreaterThan(10);
    expect(itens.some((item) => item.st === "sem-rascunho")).toBe(true);
    expect(sugeridos.every((item) => item.orig.startsWith("[Resposta simulada]") && item.srcs.length > 0)).toBe(true);
  });

  it("identifica perguntas na planilha sem coluna Pergunta", async () => {
    const { perguntas, origemDasPerguntas } = await processar("variantes/RFP-sem-coluna-pergunta.xlsx");
    expect(origemDasPerguntas).toBe("ia");
    expect(perguntas.map((pergunta) => pergunta.linha)).toEqual([4, 5, 6, 7]);
  });
});

describe("Cenário 27 · configuração do servidor", () => {
  it("sem a chave, recusa iniciar e cita a variável e a opção da API simulada", () => {
    expect(() => carregarConfiguracaoDoServidor({}, "/tmp")).toThrow(ErroDeConfiguracao);
    expect(() => carregarConfiguracaoDoServidor({}, "/tmp")).toThrow(/ANTHROPIC_API_KEY[\s\S]*TENDRA_API_SIMULADA=1/);
  });

  it("com a chave usa a API real; com TENDRA_API_SIMULADA=1 usa a simulada sem exigir a chave", () => {
    expect(carregarConfiguracaoDoServidor({ ANTHROPIC_API_KEY: "chave-falsa" }, "/tmp").api).toEqual({ tipo: "real", chaveApi: "chave-falsa" });
    const simulada = carregarConfiguracaoDoServidor({ TENDRA_API_SIMULADA: "1" }, "/tmp");
    expect(simulada.api).toEqual({ tipo: "simulada" });
    expect(simulada.ia.modelo).toBe("claude-sonnet-5-5");
  });
});
