import { cp, mkdir, mkdtemp, readFile, rename, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { carregarArquivos, carregarBase, MOTIVO_FORMATO_NAO_ACEITO } from "../../src/base/carga.ts";
import { abrirBancoDeTeste } from "../apoio/banco.ts";
import { aplicarMigracoes, type Banco } from "../../src/persistencia/banco.ts";
import { ORGANIZACAO_INICIAL } from "../../src/persistencia/organizacoes.ts";
import {
  definirAtivo,
  listarBlocos,
  listarDocumentos,
  listarDocumentosAtivos,
} from "../../src/persistencia/documentos.ts";

/** Dados sintéticos da Pulse Benefícios (fase 0.2). Data de referência: 2026-10-21. */
const PULSE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../base-sintetica/pulse-beneficios");
const BASE = path.join(PULSE, "base");
const HOJE = "2026-10-21";

let banco: Banco;
let temporarias: string[] = [];

// Criar um banco PGlite leva alguns segundos; o arquivo usa um só e o esvazia antes de cada teste.
beforeAll(async () => {
  banco = await abrirBancoDeTeste();
}, 60_000);

afterAll(async () => {
  await banco.close();
});

beforeEach(async () => {
  await banco.exec("TRUNCATE documentos RESTART IDENTITY CASCADE");
});

afterEach(async () => {
  await Promise.all(temporarias.map((pasta) => rm(pasta, { recursive: true, force: true })));
  temporarias = [];
});

const carregar = (pasta: string, enviadoPor: string | null = null) =>
  carregarBase({ organizacaoId: ORGANIZACAO_INICIAL, pasta, banco, hoje: HOJE, enviadoPor });

/** Id do documento com esse nome de arquivo. */
async function idDe(nome: string): Promise<number> {
  const documento = (await listarDocumentos(banco, ORGANIZACAO_INICIAL)).find((candidato) => candidato.nome === nome);
  if (documento === undefined) throw new Error(`${nome} não está na base`);
  return documento.id;
}

/** Cópia da base numa pasta temporária, para alterar arquivos sem tocar nos dados do repositório. */
async function copiaDaBase(): Promise<string> {
  const pasta = await mkdtemp(path.join(tmpdir(), "tendra-base-"));
  temporarias.push(pasta);
  await cp(BASE, pasta, { recursive: true });
  return pasta;
}

describe("Cenário 7 · carga da base sintética", () => {
  it("carrega os 16 documentos sem recusas, com título, tipo, data, versão e quem enviou", async () => {
    const resumo = await carregar(BASE, "Kadu Mendes");

    expect(resumo.carregados).toHaveLength(16);
    expect(resumo.recusados).toEqual([]);
    expect(resumo.ignorados).toEqual([]);
    expect(resumo.orfaos).toEqual([]);

    const documentos = await listarDocumentos(banco, ORGANIZACAO_INICIAL);
    expect(documentos.find((documento) => documento.nome === "politica-seguranca-informacao.md")).toMatchObject({
      titulo: "Política de Segurança da Informação",
      tipo: "documento",
      atualizadoEm: "2025-03-12",
      versao: "3.0",
      ativo: true,
      enviadoPor: "Kadu Mendes",
    });
    expect(documentos.find((documento) => documento.nome === "certificado-iso27001.md")?.versao).toBe("2.0");
    expect(documentos.every((documento) => documento.tokensEstimados > 0 && documento.hash.length === 64)).toBe(true);
  });

  it("guarda cada bloco com a seção e a linha do arquivo, contada desde o cabeçalho", async () => {
    await carregar(BASE);
    const caminho = "politicas/norma-registro-e-monitoramento.md";
    const linhasDoArquivo = (await readFile(path.join(BASE, caminho), "utf8")).split("\n");
    const linhaEsperada = linhasDoArquivo.findIndex((linha) => linha.startsWith("Os registros de acesso e de auditoria")) + 1;

    const bloco = (await listarBlocos(banco, ORGANIZACAO_INICIAL, "norma-registro-e-monitoramento.md")).find((candidato) => candidato.texto.includes("12 meses"));

    expect(bloco).toMatchObject({ secao: "2. Retenção dos registros", linhaInicial: linhaEsperada });
    expect(bloco?.caminhoDeSecoes).toEqual(["Norma de Registro e Monitoramento de Eventos", "2. Retenção dos registros"]);
    expect(linhasDoArquivo[linhaEsperada - 1]).toBe(bloco?.texto.split("\n")[0]);
  });
});

describe("Cenários 8 e 9 · casos de carga", () => {
  it("recusa os inválidos com o motivo, ignora outros formatos, avisa campo desconhecido e carrega os demais", async () => {
    const resumo = await carregar(path.join(PULSE, "casos-de-carga"));

    expect(resumo.carregados.sort()).toEqual(["campo-desconhecido.md", "versao-numerica.md"]);
    expect(Object.fromEntries(resumo.recusados.map(({ nome, motivo }) => [nome, motivo]))).toEqual({
      "cabecalho-sem-fechamento.md": "cabeçalho ausente ou sem fechamento. O arquivo deve começar com --- na linha 1.",
      "corpo-vazio.md": "o arquivo não tem conteúdo.",
      "data-formato-errado.md": 'atualizado_em "14/08/2026" inválido. Use AAAA-MM-DD.',
      "data-futura.md": "atualizado_em está no futuro.",
      "nao-utf8.md": "o arquivo precisa estar em UTF-8.",
      "sem-atualizado-em.md": "campo atualizado_em ausente. Use AAAA-MM-DD.",
      "sem-cabecalho.md": "cabeçalho ausente ou sem fechamento. O arquivo deve começar com --- na linha 1.",
      "tipo-invalido.md": 'tipo inválido "politica". Use documento ou rfp-passada.',
      "titulo-curto.md": "titulo deve ter de 3 a 120 caracteres.",
      "versao-longa.md": "versao deve ter até 20 caracteres.",
    });
    expect(resumo.avisos).toEqual([{ nome: "campo-desconhecido.md", mensagem: 'campo "area" ignorado.' }]);
    expect(resumo.ignorados).toEqual([{ nome: "outro-formato.txt", motivo: MOTIVO_FORMATO_NAO_ACEITO }]);
    expect((await listarDocumentos(banco, ORGANIZACAO_INICIAL)).find((documento) => documento.nome === "versao-numerica.md")?.versao).toBe("3.2");
  });
});

describe("Cenário 39 · recarga da base", () => {
  it("não regrava arquivos sem mudança", async () => {
    await carregar(BASE);
    const resumo = await carregar(BASE);
    expect(resumo.semMudanca).toHaveLength(16);
    expect([...resumo.carregados, ...resumo.atualizados]).toEqual([]);
  });

  it("substitui a versão do mesmo nome e mantém o documento desativado", async () => {
    await carregar(BASE);
    await definirAtivo(banco, ORGANIZACAO_INICIAL, await idDe("politica-seguranca-informacao.md"), false);

    const pasta = await copiaDaBase();
    await cp(path.join(PULSE, "atualizacao"), pasta, { recursive: true });
    const resumo = await carregar(pasta);

    expect(resumo.atualizados.sort()).toEqual(["anexo-sla-slo-rto.md", "politica-seguranca-informacao.md"]);
    expect(resumo.semMudanca).toHaveLength(14);
    expect(resumo.orfaos).toEqual([]);

    const politica = (await listarDocumentos(banco, ORGANIZACAO_INICIAL)).find((documento) => documento.nome === "politica-seguranca-informacao.md");
    expect(politica).toMatchObject({ versao: "4.0", atualizadoEm: "2026-08-20", ativo: false });
    const blocos = await listarBlocos(banco, ORGANIZACAO_INICIAL, "politica-seguranca-informacao.md");
    expect(blocos.some((bloco) => bloco.texto.includes("24 meses"))).toBe(true);
    expect(blocos.some((bloco) => bloco.texto.includes("6 meses"))).toBe(false);
  });

  it("trata arquivo renomeado como documento novo e lista o antigo como órfão, sem apagá-lo", async () => {
    await carregar(BASE);
    const pasta = await copiaDaBase();
    await rename(path.join(pasta, "produto/app-mobile-funcionalidades.md"), path.join(pasta, "produto/aplicativo.md"));

    const resumo = await carregar(pasta);

    expect(resumo.carregados).toEqual(["aplicativo.md"]);
    expect(resumo.orfaos).toEqual(["app-mobile-funcionalidades.md"]);
    expect(await listarDocumentos(banco, ORGANIZACAO_INICIAL)).toHaveLength(17);
  });

  it("mover o arquivo para outra subpasta não muda a identidade: o nome do arquivo é o mesmo", async () => {
    await carregar(BASE);
    const pasta = await copiaDaBase();
    await mkdir(path.join(pasta, "outra-pasta"));
    await rename(path.join(pasta, "produto/app-mobile-funcionalidades.md"), path.join(pasta, "outra-pasta/app-mobile-funcionalidades.md"));

    const resumo = await carregar(pasta);

    expect(resumo.semMudanca).toHaveLength(16);
    expect(resumo.orfaos).toEqual([]);
  });

  it("recusa dois arquivos com o mesmo nome em subpastas diferentes, citando onde estão", async () => {
    await carregar(BASE);
    const pasta = await copiaDaBase();
    await mkdir(path.join(pasta, "outra-pasta"));
    await cp(path.join(PULSE, "injecao-em-documento/produto/app-mobile-funcionalidades.md"), path.join(pasta, "outra-pasta/app-mobile-funcionalidades.md"));

    const resumo = await carregar(pasta);

    expect(resumo.recusados).toEqual([
      {
        nome: "app-mobile-funcionalidades.md",
        motivo:
          "há mais de um arquivo com este nome nesta carga (outra-pasta/app-mobile-funcionalidades.md, produto/app-mobile-funcionalidades.md). Cada documento da base precisa de um nome único.",
      },
      {
        nome: "app-mobile-funcionalidades.md",
        motivo:
          "há mais de um arquivo com este nome nesta carga (outra-pasta/app-mobile-funcionalidades.md, produto/app-mobile-funcionalidades.md). Cada documento da base precisa de um nome único.",
      },
    ]);
    expect(resumo.orfaos).toEqual([]);
    expect(await listarBlocos(banco, ORGANIZACAO_INICIAL, "app-mobile-funcionalidades.md")).not.toHaveLength(0);
  });

  it("mantém a versão anterior quando a nova é recusada", async () => {
    await carregar(BASE);
    const pasta = await copiaDaBase();
    const arquivo = path.join(pasta, "produto/app-mobile-funcionalidades.md");
    const original = await readFile(arquivo, "utf8");
    await cp(path.join(PULSE, "casos-de-carga/sem-cabecalho.md"), arquivo);

    const resumo = await carregar(pasta);

    expect(resumo.recusados.map((recusado) => recusado.nome)).toEqual(["app-mobile-funcionalidades.md"]);
    expect(resumo.orfaos).toEqual([]);
    const blocos = await listarBlocos(banco, ORGANIZACAO_INICIAL, "app-mobile-funcionalidades.md");
    expect(blocos.length).toBeGreaterThan(0);
    expect(original).toContain(blocos[0]?.texto ?? "?");
  });
});

describe("Cenário 40 · ativar e desativar documento (parte do banco)", () => {
  it("só os ativos ficam disponíveis como fonte; reativar devolve o documento", async () => {
    await carregar(BASE);
    const nome = "certificado-iso27001-ciclo-anterior.md";
    const id = await idDe(nome);

    expect(await definirAtivo(banco, ORGANIZACAO_INICIAL, id, false)).toMatchObject({ nome, ativo: false });
    expect((await listarDocumentosAtivos(banco, ORGANIZACAO_INICIAL, "2026-10-21")).map((documento) => documento.nome)).not.toContain(nome);
    expect(await listarDocumentosAtivos(banco, ORGANIZACAO_INICIAL, "2026-10-21")).toHaveLength(15);

    await definirAtivo(banco, ORGANIZACAO_INICIAL, id, true);
    expect((await listarDocumentosAtivos(banco, ORGANIZACAO_INICIAL, "2026-10-21")).map((documento) => documento.nome)).toContain(nome);
    expect(await definirAtivo(banco, ORGANIZACAO_INICIAL, 9999, false)).toBeNull();
  });
});

describe("Envio pela tela · mesma carga do comando", () => {
  const arquivo = async (caminho: string, nome = path.basename(caminho)) => ({
    nome,
    conteudo: new Uint8Array(await readFile(path.join(PULSE, caminho))),
  });

  it("usa só o nome do arquivo como identidade, mesmo quando o navegador manda um caminho", async () => {
    const resumo = await carregarArquivos({ organizacaoId: ORGANIZACAO_INICIAL, 
      banco,
      hoje: HOJE,
      enviadoPor: "Paula Rocha",
      arquivos: [await arquivo("base/produto/app-mobile-funcionalidades.md", "C:\\fakepath\\app-mobile-funcionalidades.md")],
    });

    expect(resumo.carregados).toEqual(["app-mobile-funcionalidades.md"]);
    expect(await listarDocumentos(banco, ORGANIZACAO_INICIAL)).toMatchObject([{ nome: "app-mobile-funcionalidades.md", enviadoPor: "Paula Rocha" }]);
  });

  it("um arquivo enviado pela tela atualiza o documento carregado pelo comando", async () => {
    await carregar(BASE);
    const resumo = await carregarArquivos({ organizacaoId: ORGANIZACAO_INICIAL, 
      banco,
      hoje: HOJE,
      enviadoPor: null,
      arquivos: [await arquivo("atualizacao/politicas/politica-seguranca-informacao.md")],
    });

    expect(resumo.atualizados).toEqual(["politica-seguranca-informacao.md"]);
    expect(await listarDocumentos(banco, ORGANIZACAO_INICIAL)).toHaveLength(16);
  });

  it("recusa arquivo sem nome e ignora outros formatos, sem impedir os demais", async () => {
    const resumo = await carregarArquivos({ organizacaoId: ORGANIZACAO_INICIAL, 
      banco,
      hoje: HOJE,
      enviadoPor: null,
      arquivos: [
        await arquivo("casos-de-carga/outro-formato.txt"),
        { nome: "  ", conteudo: new Uint8Array() },
        await arquivo("base/contratos/anexo-sla-slo-rto.md"),
      ],
    });

    expect(resumo.ignorados).toEqual([{ nome: "outro-formato.txt", motivo: MOTIVO_FORMATO_NAO_ACEITO }]);
    expect(resumo.recusados).toEqual([{ nome: "(sem nome)", motivo: "nome de arquivo inválido. Use até 200 caracteres." }]);
    expect(resumo.carregados).toEqual(["anexo-sla-slo-rto.md"]);
  });
});

describe("Migrações", () => {
  it("não reaplica migrações já aplicadas", async () => {
    expect(await aplicarMigracoes(banco)).toEqual([]);
  });
});
