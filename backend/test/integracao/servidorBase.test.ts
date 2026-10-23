import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { LIMITE_DO_ENVIO_EM_BYTES, criarServidor } from "../../src/http/servidor.ts";
import { abrirBancoDeTeste } from "../apoio/banco.ts";
import type { Banco } from "../../src/persistencia/banco.ts";

/** Rotas da tela Base de conhecimento: listar, enviar `.md` e ativar ou desativar (cenários 7 a 9, 39 e 40). */
const PULSE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../base-sintetica/pulse-beneficios");
const HOJE = "2026-10-21";

let banco: Banco;
let servidor: FastifyInstance;

beforeAll(async () => {
  banco = await abrirBancoDeTeste();
  servidor = criarServidor({ banco, hoje: () => HOJE });
  await servidor.ready();
}, 60_000);

afterAll(async () => {
  await servidor.close();
  await banco.close();
});

beforeEach(async () => {
  await banco.exec("TRUNCATE documentos RESTART IDENTITY CASCADE");
});

async function arquivo(caminho: string) {
  return { nome: path.basename(caminho), conteudoBase64: (await readFile(path.join(PULSE, caminho))).toString("base64") };
}

const enviar = (payload: unknown) => servidor.inject({ method: "POST", url: "/api/base/documentos", payload: payload as object });

describe("POST /api/base/documentos · envio pela tela", () => {
  it("carrega os .md enviados, devolve o resumo e a lista atualizada com quem enviou", async () => {
    const resposta = await enviar({
      enviadoPor: "  Kadu Mendes ",
      arquivos: [
        await arquivo("base/politicas/politica-seguranca-informacao.md"),
        await arquivo("base/contratos/anexo-sla-slo-rto.md"),
      ],
    });

    expect(resposta.statusCode).toBe(200);
    const corpo = resposta.json();
    expect(corpo.resumo.carregados).toEqual(["politica-seguranca-informacao.md", "anexo-sla-slo-rto.md"]);
    expect(corpo.documentos).toHaveLength(2);
    expect(corpo.documentos[0]).toMatchObject({
      id: 1,
      nome: "politica-seguranca-informacao.md",
      titulo: "Política de Segurança da Informação",
      tipo: "documento",
      atualizadoEm: "2025-03-12",
      versao: "3.0",
      ativo: true,
      enviadoPor: "Kadu Mendes",
    });
    expect(corpo.documentos[0]).not.toHaveProperty("hash");
  });

  it("recusa os inválidos com o motivo e ignora outros formatos, sem impedir os válidos", async () => {
    const resposta = await enviar({
      arquivos: [
        await arquivo("casos-de-carga/data-futura.md"),
        await arquivo("casos-de-carga/outro-formato.txt"),
        await arquivo("casos-de-carga/campo-desconhecido.md"),
      ],
    });

    expect(resposta.statusCode).toBe(200);
    expect(resposta.json().resumo).toEqual({
      carregados: ["campo-desconhecido.md"],
      atualizados: [],
      semMudanca: [],
      recusados: [{ nome: "data-futura.md", motivo: "atualizado_em está no futuro." }],
      avisos: [{ nome: "campo-desconhecido.md", mensagem: 'campo "area" ignorado.' }],
      ignorados: [{ nome: "outro-formato.txt", motivo: "formato não aceito nesta versão" }],
    });
  });

  it("reenviar sem mudança não regrava; uma nova versão atualiza e mantém o documento desativado", async () => {
    await enviar({ arquivos: [await arquivo("base/politicas/politica-seguranca-informacao.md")] });
    await servidor.inject({ method: "PATCH", url: "/api/base/documentos/1", payload: { ativo: false } });

    const igual = await enviar({ arquivos: [await arquivo("base/politicas/politica-seguranca-informacao.md")] });
    expect(igual.json().resumo.semMudanca).toEqual(["politica-seguranca-informacao.md"]);

    const nova = await enviar({ arquivos: [await arquivo("atualizacao/politicas/politica-seguranca-informacao.md")] });
    expect(nova.json().resumo.atualizados).toEqual(["politica-seguranca-informacao.md"]);
    expect(nova.json().documentos).toMatchObject([{ id: 1, versao: "4.0", ativo: false }]);
  });

  it("recusa pedido sem arquivos, com conteúdo mal codificado ou acima do limite", async () => {
    expect((await enviar({ arquivos: [] })).statusCode).toBe(400);
    expect((await enviar({ arquivos: [{ nome: "a.md" }] })).statusCode).toBe(400);

    const malCodificado = await enviar({ arquivos: [{ nome: "a.md", conteudoBase64: "não é base64" }] });
    expect(malCodificado.statusCode).toBe(400);
    expect(malCodificado.json()).toEqual({ erro: "Pedido inválido: conteúdo de arquivo mal codificado." });

    const grande = Buffer.alloc(LIMITE_DO_ENVIO_EM_BYTES / 2 + 1).toString("base64");
    const acima = await enviar({ arquivos: [{ nome: "a.md", conteudoBase64: grande }, { nome: "b.md", conteudoBase64: grande }] });
    expect(acima.statusCode).toBe(413);
    expect(acima.json().erro).toContain("Envio acima de 10 MB");
    expect((await servidor.inject({ method: "GET", url: "/api/base/documentos" })).json().documentos).toEqual([]);
  });
});

describe("GET e PATCH /api/base/documentos · lista e cenário 40", () => {
  it("lista vazia antes da primeira carga", async () => {
    const resposta = await servidor.inject({ method: "GET", url: "/api/base/documentos" });
    expect(resposta.statusCode).toBe(200);
    expect(resposta.json()).toEqual({ documentos: [] });
  });

  it("desativa e reativa um documento; id inexistente ou corpo inválido são recusados", async () => {
    await enviar({ arquivos: [await arquivo("base/certificacoes/certificado-iso27001.md")] });

    const desativado = await servidor.inject({ method: "PATCH", url: "/api/base/documentos/1", payload: { ativo: false } });
    expect(desativado.statusCode).toBe(200);
    expect(desativado.json().documento).toMatchObject({ id: 1, ativo: false });

    const reativado = await servidor.inject({ method: "PATCH", url: "/api/base/documentos/1", payload: { ativo: true } });
    expect(reativado.json().documento.ativo).toBe(true);

    const inexistente = await servidor.inject({ method: "PATCH", url: "/api/base/documentos/99", payload: { ativo: false } });
    expect(inexistente.statusCode).toBe(404);
    expect(inexistente.json()).toEqual({ erro: "Documento não encontrado na base." });

    expect((await servidor.inject({ method: "PATCH", url: "/api/base/documentos/abc", payload: { ativo: false } })).statusCode).toBe(400);
    expect((await servidor.inject({ method: "PATCH", url: "/api/base/documentos/1", payload: { ativo: "não" } })).statusCode).toBe(400);
  });
});
