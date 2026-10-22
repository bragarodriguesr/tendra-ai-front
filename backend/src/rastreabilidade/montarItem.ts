import type { CitacaoGerada, RespostaGerada } from "../geracao/separarRespostas.ts";
import type { ContextoDaBase, DocumentoDoContexto } from "../recuperacao/buscarFontes.ts";

/**
 * Rastreabilidade (etapa A6): confere cada citação contra os blocos do documento, traduz a
 * localização para `seção · linha N`, preserva a relação entre parágrafo e fontes e remove o
 * texto sem citação válida. O resultado segue o contrato de `src/workspace/data.js`.
 * Regras determinísticas: a IA não decide nada aqui (constitution II).
 */

export type TipoDeAlerta = "lowconf" | "conflict" | "old" | "critical" | "nocontext";

/** Fonte no formato de `mk()` em data.js. */
export interface FonteDoItem {
  /** Nome do arquivo da base. */
  doc: string;
  /** `seção · linha N`, com a linha contada desde o início do arquivo. */
  loc: string;
  type: "Documento" | "RFP passada";
  /** Dias desde `atualizado_em` até a data do backend. */
  age: number;
  /** Texto literal do documento na localização indicada. */
  ex: string;
  conflict?: boolean;
}

export interface ParagrafoDoItem {
  t: string;
  /** Índices (a partir de 1) das fontes em `srcs`. */
  s: number[];
}

/** Item no formato de data.js. Sai sempre como sugestão pendente: nunca aprovado (cenário 33). */
export interface ItemDaRevisao {
  id: string;
  q: string;
  paras: ParagrafoDoItem[];
  srcs: FonteDoItem[];
  alerts: { t: TipoDeAlerta }[];
  st: "sugerida" | "sem-rascunho";
  orig: string;
}

/** O que a checagem descartou, para as métricas e a avaliação. */
export interface ChecagemDoItem {
  citacoesValidas: number;
  /** Citações que não conferem com o documento (cenário 19) ou que a separação já descartou. */
  citacoesDescartadas: number;
  /** Trechos com texto e sem citação válida, retirados dos parágrafos (cenário 18). */
  trechosSemFonte: number;
  /** A resposta do lote não trouxe o marcador desta pergunta. */
  semMarcador: boolean;
}

export interface ItemChecado {
  item: ItemDaRevisao;
  checagem: ChecagemDoItem;
}

const DIA_EM_MS = 24 * 60 * 60 * 1000;
const QUEBRA_DE_PARAGRAFO = /\n[ \t]*\n/;
/** Trecho sem letras nem números (pontuação, espaços): liga trechos citados, não é afirmação. */
const SO_CONECTOR = /^[^\p{L}\p{N}]*$/u;

export function idadeEmDias(atualizadoEm: string, hoje: string): number {
  return Math.max(0, Math.round((Date.parse(`${hoje}T00:00:00Z`) - Date.parse(`${atualizadoEm}T00:00:00Z`)) / DIA_EM_MS));
}

const normalizar = (texto: string) => texto.replace(/\s+/g, " ").trim();

/**
 * Confere a citação: os blocos existem no documento do contexto e o trecho citado aparece, ignorando
 * só diferenças de espaços, no texto desses blocos. Devolve a fonte com o texto literal do
 * documento (`ex`), ou null quando não confere (cenários 13 e 19).
 */
export function conferirCitacao(citacao: CitacaoGerada, documento: DocumentoDoContexto | undefined, hoje: string): FonteDoItem | null {
  if (documento === undefined) return null;
  const { blocoInicial, blocoFinal } = citacao;
  if (!Number.isInteger(blocoInicial) || !Number.isInteger(blocoFinal) || blocoInicial < 0 || blocoFinal <= blocoInicial || blocoFinal > documento.blocos.length) {
    return null;
  }
  const blocos = documento.blocos.slice(blocoInicial, blocoFinal);
  const citado = normalizar(citacao.textoCitado);
  const literal = blocos.map((bloco) => bloco.texto).join("\n");
  if (citado === "" || !normalizar(literal).includes(citado)) return null;

  const primeiro = blocos[0];
  if (primeiro === undefined) return null;
  return {
    doc: documento.nome,
    loc: `${primeiro.secao} · linha ${primeiro.linhaInicial}`,
    type: documento.tipo === "rfp-passada" ? "RFP passada" : "Documento",
    age: idadeEmDias(documento.atualizadoEm, hoje),
    ex: literal,
  };
}

/**
 * Monta o item de uma pergunta a partir da resposta gerada. Sem resposta, sem marcador ou sem
 * nenhum trecho com fonte válida, o item fica sem rascunho com o alerta `nocontext` (cenários 14,
 * 18 e 34). Texto retirado ou citação descartada deixam o alerta `lowconf` (cenários 18 e 19).
 */
export function montarItem(entrada: {
  pergunta: { numero: number; texto: string };
  resposta: RespostaGerada | null;
  contexto: Pick<ContextoDaBase, "documentos"> | null;
  hoje: string;
}): ItemChecado {
  const { pergunta, resposta, contexto, hoje } = entrada;
  const checagem: ChecagemDoItem = {
    citacoesValidas: 0,
    citacoesDescartadas: resposta?.citacoesDescartadas ?? 0,
    trechosSemFonte: 0,
    semMarcador: resposta?.situacao === "sem_marcador",
  };
  const semRascunho = (): ItemChecado => ({
    item: { id: `r${pergunta.numero}`, q: pergunta.texto, paras: [], srcs: [], alerts: [{ t: "nocontext" }], st: "sem-rascunho", orig: "" },
    checagem,
  });
  if (resposta === null || contexto === null || resposta.situacao !== "respondida") return semRascunho();

  const porNome = new Map(contexto.documentos.map((documento) => [documento.nome, documento]));
  const srcs: FonteDoItem[] = [];
  const indiceDaFonte = new Map<string, number>();
  type Parte = { texto: string; fontes: number[] };
  const paragrafos: Parte[][] = [[]];

  for (const trecho of resposta.trechos) {
    const fontes: number[] = [];
    for (const citacao of trecho.citacoes) {
      const fonte = conferirCitacao(citacao, porNome.get(citacao.documento), hoje);
      if (fonte === null) {
        checagem.citacoesDescartadas++;
        continue;
      }
      checagem.citacoesValidas++;
      const chave = `${fonte.doc}\u0000${citacao.blocoInicial}\u0000${citacao.blocoFinal}`;
      let indice = indiceDaFonte.get(chave);
      if (indice === undefined) {
        srcs.push(fonte);
        indice = srcs.length;
        indiceDaFonte.set(chave, indice);
      }
      if (!fontes.includes(indice)) fontes.push(indice);
    }
    trecho.texto.split(QUEBRA_DE_PARAGRAFO).forEach((pedaco, posicao) => {
      if (posicao > 0) paragrafos.push([]);
      paragrafos.at(-1)?.push({ texto: pedaco, fontes });
    });
  }

  const paras: ParagrafoDoItem[] = [];
  for (const partes of paragrafos) {
    const mantidas = partes.filter((parte) => {
      if (parte.fontes.length > 0 || SO_CONECTOR.test(parte.texto)) return true;
      checagem.trechosSemFonte++;
      return false;
    });
    const s = [...new Set(mantidas.flatMap((parte) => parte.fontes))].sort((a, b) => a - b);
    const t = mantidas.map((parte) => parte.texto).join("").replace(/\s+/g, " ").trim();
    if (s.length > 0 && t !== "") paras.push({ t, s });
  }
  if (paras.length === 0) return semRascunho();

  // Fontes só de parágrafos que ficaram: renumera para não sobrar fonte solta.
  const usadas = [...new Set(paras.flatMap((paragrafo) => paragrafo.s))].sort((a, b) => a - b);
  const novoIndice = new Map(usadas.map((antigo, posicao) => [antigo, posicao + 1]));
  const parasFinais = paras.map((paragrafo) => ({ t: paragrafo.t, s: paragrafo.s.map((antigo) => novoIndice.get(antigo) ?? antigo) }));
  const srcsFinais = usadas.flatMap((antigo) => {
    const fonte = srcs[antigo - 1];
    return fonte === undefined ? [] : [fonte];
  });

  const alerts: ItemDaRevisao["alerts"] = checagem.trechosSemFonte > 0 || checagem.citacoesDescartadas > 0 ? [{ t: "lowconf" }] : [];
  return {
    item: {
      id: `r${pergunta.numero}`,
      q: pergunta.texto,
      paras: parasFinais,
      srcs: srcsFinais,
      alerts,
      st: "sugerida",
      orig: parasFinais.map((paragrafo) => paragrafo.t).join("\n\n"),
    },
    checagem,
  };
}
