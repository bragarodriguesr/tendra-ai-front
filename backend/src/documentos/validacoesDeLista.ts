import JSZip from "jszip";

/** Intervalo de células, com linhas e colunas numeradas a partir de 1. */
export interface Intervalo {
  linhaInicial: number;
  linhaFinal: number;
  colunaInicial: number;
  colunaFinal: number;
}

/** Validação de dados do tipo lista, como gravada no arquivo, antes de resolver os valores. */
export interface ValidacaoDeListaGravada {
  intervalos: Intervalo[];
  /** Fórmula da lista: valores entre aspas ("0,1,2") ou referência a células (Sheet1!$A$1:$A$5). */
  formula: string;
}

/**
 * Lê as validações do tipo lista de cada aba, direto do XML do arquivo.
 * Cobre o formato padrão e o formato de extensão do Excel (x14), usado quando a lista
 * aponta para outra aba e que a biblioteca de leitura de planilhas não interpreta.
 */
export async function lerValidacoesDeLista(conteudo: Uint8Array): Promise<Map<string, ValidacaoDeListaGravada[]>> {
  const zip = await JSZip.loadAsync(conteudo);
  const arquivoDaAba = await mapearArquivosDasAbas(zip);
  const resultado = new Map<string, ValidacaoDeListaGravada[]>();

  for (const [nomeDaAba, caminho] of arquivoDaAba) {
    const xml = await zip.file(caminho)?.async("string");
    if (xml === undefined) continue;
    const validacoes = [...lerFormatoPadrao(xml), ...lerFormatoDeExtensao(xml)];
    if (validacoes.length > 0) resultado.set(nomeDaAba, validacoes);
  }
  return resultado;
}

async function mapearArquivosDasAbas(zip: JSZip): Promise<Map<string, string>> {
  const pasta = (await zip.file("xl/workbook.xml")?.async("string")) ?? "";
  const relacoes = (await zip.file("xl/_rels/workbook.xml.rels")?.async("string")) ?? "";

  const destinoPorId = new Map<string, string>();
  for (const [tag] of relacoes.matchAll(/<Relationship\b[^>]*>/g)) {
    const id = atributo(tag, "Id");
    const destino = atributo(tag, "Target");
    if (id === undefined || destino === undefined) continue;
    destinoPorId.set(id, destino.startsWith("/") ? destino.slice(1) : `xl/${destino}`);
  }

  const arquivoDaAba = new Map<string, string>();
  for (const [tag] of pasta.matchAll(/<sheet\b[^>]*>/g)) {
    const nome = atributo(tag, "name");
    const id = atributo(tag, "r:id");
    const destino = id === undefined ? undefined : destinoPorId.get(id);
    if (nome !== undefined && destino !== undefined) arquivoDaAba.set(desfazerEntidades(nome), destino);
  }
  return arquivoDaAba;
}

function lerFormatoPadrao(xml: string): ValidacaoDeListaGravada[] {
  const validacoes: ValidacaoDeListaGravada[] = [];
  for (const [, atributos = "", corpo = ""] of xml.matchAll(
    /<dataValidation\b([^>]*)>([\s\S]*?)<\/dataValidation>/g,
  )) {
    if (atributo(atributos, "type") !== "list") continue;
    const formula = /<formula1>([\s\S]*?)<\/formula1>/.exec(corpo)?.[1];
    const referencia = atributo(atributos, "sqref");
    if (formula !== undefined && referencia !== undefined) {
      validacoes.push({ formula: desfazerEntidades(formula), intervalos: lerIntervalos(referencia) });
    }
  }
  return validacoes;
}

function lerFormatoDeExtensao(xml: string): ValidacaoDeListaGravada[] {
  const validacoes: ValidacaoDeListaGravada[] = [];
  for (const [, atributos = "", corpo = ""] of xml.matchAll(
    /<x14:dataValidation\b([^>]*)>([\s\S]*?)<\/x14:dataValidation>/g,
  )) {
    if (atributo(atributos, "type") !== "list") continue;
    const formula = /<x14:formula1>[\s\S]*?<xm:f>([\s\S]*?)<\/xm:f>/.exec(corpo)?.[1];
    const referencia = /<xm:sqref>([\s\S]*?)<\/xm:sqref>/.exec(corpo)?.[1];
    if (formula !== undefined && referencia !== undefined) {
      validacoes.push({ formula: desfazerEntidades(formula), intervalos: lerIntervalos(referencia) });
    }
  }
  return validacoes;
}

function atributo(tag: string, nome: string): string | undefined {
  const escapado = nome.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\s${escapado}="([^"]*)"`).exec(tag)?.[1];
}

function desfazerEntidades(texto: string): string {
  return texto
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** Converte uma lista de referências separadas por espaço ("E6:E216 G2") em intervalos. */
export function lerIntervalos(referencia: string): Intervalo[] {
  return referencia
    .trim()
    .split(/\s+/)
    .map((parte) => {
      const [inicio = "", fim = inicio] = parte.replace(/\$/g, "").split(":");
      const a = lerCelula(inicio);
      const b = lerCelula(fim);
      if (a === undefined || b === undefined) return undefined;
      return {
        linhaInicial: Math.min(a.linha, b.linha),
        linhaFinal: Math.max(a.linha, b.linha),
        colunaInicial: Math.min(a.coluna, b.coluna),
        colunaFinal: Math.max(a.coluna, b.coluna),
      };
    })
    .filter((intervalo) => intervalo !== undefined);
}

/** Converte uma referência como "E6" em linha e coluna. */
export function lerCelula(referencia: string): { linha: number; coluna: number } | undefined {
  const partes = /^([A-Z]{1,3})(\d+)$/i.exec(referencia.trim());
  if (partes === null) return undefined;
  const [, letras = "", numero = ""] = partes;
  const coluna = [...letras.toUpperCase()].reduce((soma, letra) => soma * 26 + letra.charCodeAt(0) - 64, 0);
  return { linha: Number(numero), coluna };
}

export function contem(intervalo: Intervalo, linha: number, coluna: number): boolean {
  return (
    linha >= intervalo.linhaInicial &&
    linha <= intervalo.linhaFinal &&
    coluna >= intervalo.colunaInicial &&
    coluna <= intervalo.colunaFinal
  );
}
