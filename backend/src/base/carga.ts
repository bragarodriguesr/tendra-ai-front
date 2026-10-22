import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { gravarDocumento, listarDocumentos } from "../persistencia/documentos.ts";
import type { Banco } from "../persistencia/banco.ts";
import { dividirEmBlocos } from "./blocos.ts";
import { ErroDeArquivoMd, lerArquivoMd } from "./cabecalho.ts";

/** Resumo do comando carregar-base (FORMATO_BASE_MD.md, seção 5). Caminhos relativos à pasta. */
export interface ResumoDaCarga {
  carregados: string[];
  atualizados: string[];
  semMudanca: string[];
  recusados: { caminho: string; motivo: string }[];
  avisos: { caminho: string; mensagem: string }[];
  ignorados: { caminho: string; motivo: string }[];
  /** Documentos do banco sem arquivo correspondente na pasta. Nada é apagado. */
  orfaos: string[];
}

export interface OpcoesDaCarga {
  pasta: string;
  banco: Banco;
  /** Data de hoje (AAAA-MM-DD), usada para recusar `atualizado_em` no futuro. */
  hoje: string;
  /** Quem carregou, para a coluna "Enviado por" da tela da Base. */
  enviadoPor: string | null;
}

export const MOTIVO_FORMATO_NAO_ACEITO = "formato não aceito nesta versão";

/** Estimativa de tokens usada até a contagem exata pela API (etapa A5). */
export function estimarTokens(texto: string): number {
  return Math.ceil(texto.length / 4);
}

/**
 * Carrega os arquivos `.md` de uma pasta (e subpastas) na base (cenários 7, 8, 9 e 39).
 * Cada arquivo é tratado sozinho: um arquivo recusado não impede os demais.
 */
export async function carregarBase(opcoes: OpcoesDaCarga): Promise<ResumoDaCarga> {
  const resumo: ResumoDaCarga = {
    carregados: [],
    atualizados: [],
    semMudanca: [],
    recusados: [],
    avisos: [],
    ignorados: [],
    orfaos: [],
  };

  const gravados = new Map((await listarDocumentos(opcoes.banco)).map((documento) => [documento.caminho, documento]));
  const encontrados = new Set<string>();

  for (const caminho of await listarArquivos(opcoes.pasta)) {
    encontrados.add(caminho);
    if (!caminho.toLowerCase().endsWith(".md")) {
      resumo.ignorados.push({ caminho, motivo: MOTIVO_FORMATO_NAO_ACEITO });
      continue;
    }

    const conteudo = new Uint8Array(await readFile(path.join(opcoes.pasta, caminho)));
    const hash = createHash("sha256").update(conteudo).digest("hex");
    if (gravados.get(caminho)?.hash === hash) {
      resumo.semMudanca.push(caminho);
      continue;
    }

    try {
      const lido = lerArquivoMd(conteudo, opcoes.hoje);
      const blocos = dividirEmBlocos(lido.linhas, lido.inicioDoCorpo);
      if (blocos.length === 0) throw new ErroDeArquivoMd("o arquivo não tem conteúdo.");

      const resultado = await gravarDocumento(opcoes.banco, {
        caminho,
        cabecalho: lido.cabecalho,
        hash,
        tamanhoBytes: conteudo.byteLength,
        tokensEstimados: estimarTokens(blocos.map((bloco) => bloco.texto).join("\n")),
        enviadoPor: opcoes.enviadoPor,
        blocos,
      });
      (resultado === "novo" ? resumo.carregados : resumo.atualizados).push(caminho);
      for (const mensagem of lido.avisos) resumo.avisos.push({ caminho, mensagem });
    } catch (erro) {
      if (!(erro instanceof ErroDeArquivoMd)) throw erro;
      resumo.recusados.push({ caminho, motivo: erro.message });
    }
  }

  resumo.orfaos = [...gravados.keys()].filter((caminho) => !encontrados.has(caminho)).sort();
  return resumo;
}

/** Arquivos da pasta e das subpastas, com caminho relativo usando "/". Ignora nomes iniciados por ponto. */
async function listarArquivos(pasta: string): Promise<string[]> {
  const entradas = await readdir(pasta, { recursive: true, withFileTypes: true });
  return entradas
    .filter((entrada) => entrada.isFile())
    .map((entrada) => path.relative(pasta, path.join(entrada.parentPath, entrada.name)).split(path.sep).join("/"))
    .filter((caminho) => !caminho.split("/").some((parte) => parte.startsWith(".")))
    .sort();
}
