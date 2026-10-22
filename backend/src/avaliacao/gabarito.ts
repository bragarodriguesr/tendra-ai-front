import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { ErroDeConfiguracao } from "../config/config.ts";

/**
 * Leitura do gabarito sintético (`base-sintetica/rfps/gabarito-rfps-pulse.json`) e da base
 * autorizada em disco, usada para conferir as fontes de forma independente do banco.
 */

export type Momento = "base" | "atualizacao";

export interface PerguntaDoGabarito {
  ref: string;
  linha: number;
  pergunta: string;
  temResposta: boolean;
  /** Nomes de arquivo esperados como fonte (sem a pasta: a identidade na base é o nome). */
  documentosEsperados: string[];
  alertasEsperados: string[];
  /** Caso especial das variantes (por exemplo "injecao-em-documento"). */
  caso: string | null;
}

export interface GabaritoDaRfp {
  arquivo: string;
  aba: string;
  perguntas: PerguntaDoGabarito[];
}

interface PerguntaNoArquivo {
  ref: string;
  linha: number;
  pergunta: string;
  tem_resposta: boolean;
  documentos_esperados?: string[];
  alertas_esperados_base?: string[];
  alertas_esperados_apos_atualizacao?: string[];
  caso?: string;
}

interface RfpNoArquivo {
  arquivo: string;
  aba: string;
  perguntas: PerguntaNoArquivo[];
}

interface ArquivoDeGabarito {
  rfps: RfpNoArquivo[];
  casos_de_borda?: RfpNoArquivo;
  pasta_base: string;
  pasta_atualizacao: string;
}

export interface GabaritoCarregado {
  rfps: GabaritoDaRfp[];
  /** Pastas da base, relativas à pasta raiz dos dados sintéticos. */
  pastaBase: string;
  pastaAtualizacao: string;
  /** Pasta raiz dos dados sintéticos (onde estão rfps/ e pulse-beneficios/). */
  raiz: string;
}

export async function carregarGabarito(arquivo: string, momento: Momento): Promise<GabaritoCarregado> {
  const dados = JSON.parse(await readFile(arquivo, "utf8")) as ArquivoDeGabarito;
  if (!Array.isArray(dados.rfps)) throw new ErroDeConfiguracao(`${path.basename(arquivo)}: gabarito sem a lista rfps.`);
  const converter = (rfp: RfpNoArquivo): GabaritoDaRfp => ({
    arquivo: rfp.arquivo,
    aba: rfp.aba,
    perguntas: rfp.perguntas.map((pergunta) => ({
      ref: pergunta.ref,
      linha: pergunta.linha,
      pergunta: pergunta.pergunta,
      temResposta: pergunta.tem_resposta,
      documentosEsperados: (pergunta.documentos_esperados ?? []).map((caminho) => path.posix.basename(caminho)),
      alertasEsperados: (momento === "base" ? pergunta.alertas_esperados_base : pergunta.alertas_esperados_apos_atualizacao) ?? [],
      caso: pergunta.caso ?? null,
    })),
  });
  return {
    rfps: [...dados.rfps, ...(dados.casos_de_borda ? [dados.casos_de_borda] : [])].map(converter),
    pastaBase: dados.pasta_base,
    pastaAtualizacao: dados.pasta_atualizacao,
    raiz: path.resolve(path.dirname(arquivo), ".."),
  };
}

/** A RFP do gabarito com o mesmo nome de arquivo da tarefa avaliada. */
export function rfpDoGabarito(gabarito: GabaritoCarregado, nomeDoArquivo: string): GabaritoDaRfp | undefined {
  return gabarito.rfps.find((rfp) => path.posix.basename(rfp.arquivo) === nomeDoArquivo);
}

/** Linhas de cada arquivo `.md` da base autorizada, pelo nome. Na atualização, os arquivos novos substituem os de mesmo nome. */
export async function lerBaseAutorizada(gabarito: GabaritoCarregado, momento: Momento): Promise<Map<string, string[]>> {
  const base = new Map<string, string[]>();
  const pastas = [gabarito.pastaBase, ...(momento === "atualizacao" ? [gabarito.pastaAtualizacao] : [])];
  for (const pasta of pastas) {
    const absoluta = path.join(gabarito.raiz, pasta);
    for (const entrada of await readdir(absoluta, { recursive: true, withFileTypes: true })) {
      if (!entrada.isFile() || !entrada.name.endsWith(".md")) continue;
      const conteudo = await readFile(path.join(entrada.parentPath, entrada.name), "utf8");
      base.set(entrada.name, conteudo.replace(/^﻿/, "").split(/\r?\n/));
    }
  }
  return base;
}
