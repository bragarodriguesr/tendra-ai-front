import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { LIMITE_DO_ENVIO_EM_BYTES, criarServidor } from "../../src/http/servidor.ts";
import { abrirBancoDeTeste } from "../apoio/banco.ts";
import type { Banco } from "../../src/persistencia/banco.ts";
import { listarDocumentosAtivos } from "../../src/persistencia/documentos.ts";
import { ORGANIZACAO_INICIAL } from "../../src/persistencia/organizacoes.ts";

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

describe("Cenário 80 · validade do documento", () => {
  const md = (nome: string, validade: string | null) => ({
    nome,
    conteudoBase64: Buffer.from(
      `---\ntitulo: Documento ${nome}\ntipo: documento\natualizado_em: 2026-10-01\n${validade === null ? "" : `validade: ${validade}\n`}---\n\n# Seção\n\nTexto.\n`,
    ).toString("base64"),
  });

  it("devolve a validade (ou null, Indefinido) e marca como vencido, inativo, o documento com validade atingida", async () => {
    const resposta = await enviar({ arquivos: [md("sem-validade.md", null), md("valido.md", "2026-12-31"), md("vence-hoje.md", HOJE)] });
    expect(resposta.json().resumo.avisos).toEqual([{ nome: "vence-hoje.md", mensagem: `validade ${HOJE} já atingida: o documento entra como Vencido e não vai para a geração.` }]);
    const porNome = Object.fromEntries((resposta.json().documentos as { nome: string }[]).map((documento) => [documento.nome, documento]));
    expect(porNome["sem-validade.md"]).toMatchObject({ validade: null, vencido: false, ativo: true });
    expect(porNome["valido.md"]).toMatchObject({ validade: "2026-12-31", vencido: false, ativo: true });
    expect(porNome["vence-hoje.md"]).toMatchObject({ validade: HOJE, vencido: true, ativo: false });
  });

  it("documento vencido não pode ser reativado; desativar continua possível", async () => {
    await enviar({ arquivos: [md("vencido.md", "2026-10-10")] });
    const reativar = await servidor.inject({ method: "PATCH", url: "/api/base/documentos/1", payload: { ativo: true } });
    expect({ status: reativar.statusCode, erro: reativar.json().erro }).toEqual({ status: 409, erro: "Documento vencido não pode ser reativado. Envie uma versão com nova validade." });
    const desativar = await servidor.inject({ method: "PATCH", url: "/api/base/documentos/1", payload: { ativo: false } });
    expect(desativar.json().documento).toMatchObject({ vencido: true, ativo: false });
  });

  it("uma nova versão do arquivo com validade futura volta a valer, e o documento vencido fica fora da geração", async () => {
    await enviar({ arquivos: [md("renovado.md", "2026-10-10")] });
    expect(await listarDocumentosAtivos(banco, ORGANIZACAO_INICIAL, HOJE)).toEqual([]);
    const renovado = await enviar({ arquivos: [md("renovado.md", "2027-10-10")] });
    expect(renovado.json().documentos[0]).toMatchObject({ validade: "2027-10-10", vencido: false, ativo: true });
    expect((await listarDocumentosAtivos(banco, ORGANIZACAO_INICIAL, HOJE)).map((documento) => documento.nome)).toEqual(["renovado.md"]);
  });
});
