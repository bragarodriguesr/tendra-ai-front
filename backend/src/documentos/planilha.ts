import ExcelJS from "exceljs";
import type { NomesDeCabecalho } from "../config/cabecalhos.ts";
import { contem, lerIntervalos, lerValidacoesDeLista, type Intervalo } from "./validacoesDeLista.ts";

/** Limite de tamanho da planilha de RFP (cenário 31). */
export const LIMITE_DA_PLANILHA_EM_BYTES = 10 * 1024 * 1024;

/** Quantas linhas do topo de cada aba são examinadas em busca do cabeçalho (cenário 1). */
export const LINHAS_EXAMINADAS_PARA_O_CABECALHO = 20;

export type MotivoDoErroDePlanilha = "formato" | "tamanho" | "invalida" | "sem-perguntas";

const MENSAGENS: Record<MotivoDoErroDePlanilha, string> = {
  formato: "Envie a RFP em formato .xlsx",
  tamanho: "A planilha passa do limite de 10 MB",
  invalida: "Arquivo .xlsx inválido",
  "sem-perguntas": "Nenhuma pergunta encontrada na planilha",
};

/** Erro de entrada da planilha, com a mensagem definida no SPEC (cenários 4, 5 e 31). */
export class ErroDePlanilha extends Error {
  override name = "ErroDePlanilha";
  readonly motivo: MotivoDoErroDePlanilha;

  constructor(motivo: MotivoDoErroDePlanilha) {
    super(MENSAGENS[motivo]);
    this.motivo = motivo;
  }
}

export interface Celula {
  coluna: number;
  texto: string;
  /** Parte de uma mesclagem que ocupa mais de uma coluna (título de seção, por exemplo). */
  mescladaEmVariasColunas: boolean;
}

export interface Linha {
  numero: number;
  celulas: Celula[];
}

/** Lista de valores permitidos de uma validação de dados, com as células em que vale. */
export interface ListaDeValores {
  intervalos: Intervalo[];
  valores: string[];
}

export interface Aba {
  nome: string;
  linhas: Linha[];
  listas: ListaDeValores[];
}

/** Conteúdo das abas visíveis da planilha, só com as células preenchidas. */
export interface PlanilhaLida {
  abas: Aba[];
}

export interface Pergunta {
  aba: string;
  linha: number;
  /** Texto exato da célula. */
  texto: string;
}

/** Perguntas encontradas pela regra do cabeçalho, com a posição do cabeçalho. */
export interface IdentificacaoPorRegra {
  aba: string;
  linhaDoCabecalho: number;
  colunaDasPerguntas: number;
  perguntas: Pergunta[];
}

/** Colunas de resposta e de comentário que a própria RFP define (cenários 51 e 52). */
export interface ModeloDeResposta {
  colunaDeResposta: number;
  cabecalhoDaResposta: string;
  colunaDeComentario: number | null;
  cabecalhoDoComentario: string | null;
  /** Valores da lista de validação da coluna de resposta; null quando a resposta é texto livre. */
  valoresPermitidos: string[] | null;
}

/** Resposta esperada do identificador de perguntas com IA (cenário 3). */
export type PerguntaSugeridaPelaIA = Pergunta;
export type IdentificadorDePerguntasComIA = (planilha: PlanilhaLida) => Promise<PerguntaSugeridaPelaIA[]>;

export interface ResultadoDaIdentificacao {
  perguntas: Pergunta[];
  origem: "regra" | "ia";
  modelo: ModeloDeResposta | null;
}

const ASSINATURA_ZIP = [0x50, 0x4b, 0x03, 0x04];

/** Confere extensão, tamanho e assinatura do arquivo antes de lê-lo (cenários 4 e 31). */
export function validarArquivoDePlanilha(nomeOriginal: string, conteudo: Uint8Array): void {
  if (!nomeOriginal.toLowerCase().endsWith(".xlsx")) throw new ErroDePlanilha("formato");
  if (conteudo.byteLength > LIMITE_DA_PLANILHA_EM_BYTES) throw new ErroDePlanilha("tamanho");
  if (!ASSINATURA_ZIP.every((byte, posicao) => conteudo[posicao] === byte)) {
    throw new ErroDePlanilha("invalida");
  }
}

/** Lê as abas visíveis da planilha. Lança ErroDePlanilha("invalida") se o arquivo não for uma planilha. */
export async function lerPlanilha(conteudo: Uint8Array): Promise<PlanilhaLida> {
  const pasta = new ExcelJS.Workbook();
  let validacoes;
  try {
    // O exceljs declara um tipo Buffer próprio; o Buffer do Node é aceito em tempo de execução.
    await pasta.xlsx.load(Buffer.from(conteudo) as unknown as ExcelJS.Buffer);
    validacoes = await lerValidacoesDeLista(conteudo);
  } catch {
    throw new ErroDePlanilha("invalida");
  }

  const abas = pasta.worksheets
    .filter((aba) => aba.state === "visible")
    .map((aba) => ({
      nome: aba.name,
      linhas: lerLinhas(aba),
      listas: (validacoes.get(aba.name) ?? []).flatMap(({ intervalos, formula }) => {
        const valores = resolverValoresDaLista(formula, aba.name, pasta);
        return valores === null ? [] : [{ intervalos, valores }];
      }),
    }));
  return { abas };
}

function lerLinhas(aba: ExcelJS.Worksheet): Linha[] {
  const linhas: Linha[] = [];
  aba.eachRow({ includeEmpty: false }, (linha, numero) => {
    const colunasPorMesclagem = new Map<string, number>();
    const lidas: { coluna: number; texto: string; mesclagem: string | undefined }[] = [];

    for (let coluna = 1; coluna <= aba.columnCount; coluna++) {
      const celula = linha.getCell(coluna);
      const mesclagem = celula.isMerged ? celula.master.address : undefined;
      if (mesclagem !== undefined) {
        colunasPorMesclagem.set(mesclagem, (colunasPorMesclagem.get(mesclagem) ?? 0) + 1);
      }
      const texto = textoDaCelula(celula);
      if (texto.trim() !== "") lidas.push({ coluna, texto, mesclagem });
    }

    if (lidas.length === 0) return;
    linhas.push({
      numero,
      celulas: lidas.map(({ coluna, texto, mesclagem }) => ({
        coluna,
        texto,
        mescladaEmVariasColunas: mesclagem !== undefined && (colunasPorMesclagem.get(mesclagem) ?? 0) > 1,
      })),
    });
  });
  return linhas;
}

/**
 * Valores de uma lista de validação: valores entre aspas ("0,1,2") ou referência a células,
 * na mesma aba ou em outra, inclusive oculta. Outras fórmulas (nomes definidos, funções)
 * não são resolvidas, e a coluna fica como texto livre.
 */
function resolverValoresDaLista(formula: string, abaAtual: string, pasta: ExcelJS.Workbook): string[] | null {
  const texto = formula.trim();
  if (texto.length >= 2 && texto.startsWith('"') && texto.endsWith('"')) {
    const valores = texto.slice(1, -1).split(",").map((valor) => valor.trim()).filter((valor) => valor !== "");
    return valores.length > 0 ? valores : null;
  }

  const referencia = /^(?:'((?:[^']|'')+)'|([^!']+))!(.+)$/.exec(texto);
  const nomeDaAba = referencia === null ? abaAtual : (referencia[1]?.replace(/''/g, "'") ?? referencia[2] ?? "");
  const intervalo = lerIntervalos(referencia === null ? texto : (referencia[3] ?? ""))[0];
  const aba = pasta.getWorksheet(nomeDaAba);
  if (intervalo === undefined || aba === undefined) return null;

  const valores: string[] = [];
  for (let linha = intervalo.linhaInicial; linha <= intervalo.linhaFinal; linha++) {
    for (let coluna = intervalo.colunaInicial; coluna <= intervalo.colunaFinal; coluna++) {
      const valor = textoDaCelula(aba.getCell(linha, coluna)).trim();
      if (valor !== "") valores.push(valor);
    }
  }
  return valores.length > 0 ? valores : null;
}

/** Texto exibido da célula. Fórmulas sem resultado calculado contam como vazias. */
function textoDaCelula(celula: ExcelJS.Cell): string {
  try {
    return celula.text ?? "";
  } catch {
    return "";
  }
}

function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().replace(/\s+/g, " ").toLowerCase();
}

/** O cabeçalho é o nome ou começa com ele seguido de algo que não é letra nem número. */
function comecaComONome(cabecalho: string, nome: string): boolean {
  const texto = normalizar(cabecalho);
  const procurado = normalizar(nome);
  return texto.startsWith(procurado) && !/[\p{L}\p{N}]/u.test(texto.charAt(procurado.length));
}

/**
 * Identifica as perguntas pela coluna cujo cabeçalho é um dos nomes aceitos (cenários 1 e 2).
 * Devolve null quando nenhuma aba visível tem esse cabeçalho.
 */
export function identificarPerguntasPorRegra(
  planilha: PlanilhaLida,
  nomesAceitos: string[],
): IdentificacaoPorRegra | null {
  const aceitos = new Set(nomesAceitos.map(normalizar));

  for (const aba of planilha.abas) {
    for (const linha of aba.linhas) {
      if (linha.numero > LINHAS_EXAMINADAS_PARA_O_CABECALHO) break;
      const cabecalho = linha.celulas.find(
        (celula) => !celula.mescladaEmVariasColunas && aceitos.has(normalizar(celula.texto)),
      );
      if (cabecalho === undefined) continue;

      const perguntas = aba.linhas
        .filter((outra) => outra.numero > linha.numero)
        .flatMap((outra) =>
          outra.celulas
            .filter((celula) => celula.coluna === cabecalho.coluna && !celula.mescladaEmVariasColunas)
            .map((celula) => ({ aba: aba.nome, linha: outra.numero, texto: celula.texto })),
        );
      return { aba: aba.nome, linhaDoCabecalho: linha.numero, colunaDasPerguntas: cabecalho.coluna, perguntas };
    }
  }
  return null;
}

/**
 * Identifica o modelo de resposta da RFP na linha do cabeçalho de perguntas (cenários 51 e 52):
 * a coluna de resposta, a de comentário e, se a coluna de resposta tiver validação em lista,
 * os valores permitidos. Devolve null quando não há coluna de resposta reconhecida.
 */
export function identificarModeloDeResposta(
  planilha: PlanilhaLida,
  identificacao: IdentificacaoPorRegra,
  nomes: Pick<NomesDeCabecalho, "resposta" | "comentario">,
): ModeloDeResposta | null {
  const aba = planilha.abas.find((candidata) => candidata.nome === identificacao.aba);
  const linhaDoCabecalho = aba?.linhas.find((linha) => linha.numero === identificacao.linhaDoCabecalho);
  if (aba === undefined || linhaDoCabecalho === undefined) return null;

  const candidatas = linhaDoCabecalho.celulas.filter(
    (celula) => celula.coluna !== identificacao.colunaDasPerguntas && !celula.mescladaEmVariasColunas,
  );
  const resposta = candidatas.find((celula) => nomes.resposta.some((nome) => comecaComONome(celula.texto, nome)));
  if (resposta === undefined) return null;

  const comentario = candidatas.find(
    (celula) =>
      celula.coluna !== resposta.coluna && nomes.comentario.some((nome) => comecaComONome(celula.texto, nome)),
  );

  const primeiraLinha = identificacao.perguntas[0]?.linha ?? identificacao.linhaDoCabecalho + 1;
  const lista = aba.listas.find((candidata) =>
    candidata.intervalos.some((intervalo) => contem(intervalo, primeiraLinha, resposta.coluna)),
  );

  return {
    colunaDeResposta: resposta.coluna,
    cabecalhoDaResposta: resposta.texto,
    colunaDeComentario: comentario?.coluna ?? null,
    cabecalhoDoComentario: comentario?.texto ?? null,
    valoresPermitidos: lista?.valores ?? null,
  };
}

/**
 * Usa a IA para apontar as perguntas e mantém só as que aparecem literalmente numa célula
 * da linha e da aba indicadas (cenário 3). Textos reescritos ou fora do lugar são descartados.
 */
export async function identificarPerguntasComIA(
  planilha: PlanilhaLida,
  identificador: IdentificadorDePerguntasComIA,
): Promise<Pergunta[]> {
  const sugeridas = await identificador(planilha);
  const ordemDaAba = new Map(planilha.abas.map((aba, posicao) => [aba.nome, posicao]));
  const vistas = new Set<string>();
  const validas: Pergunta[] = [];

  for (const sugerida of sugeridas) {
    const aba = planilha.abas.find((candidata) => candidata.nome === sugerida.aba);
    const linha = aba?.linhas.find((candidata) => candidata.numero === sugerida.linha);
    const existe = linha?.celulas.some((celula) => celula.texto === sugerida.texto) ?? false;
    const chave = `${sugerida.aba}\u0000${sugerida.linha}\u0000${sugerida.texto}`;
    if (!existe || vistas.has(chave)) continue;
    vistas.add(chave);
    validas.push({ aba: sugerida.aba, linha: sugerida.linha, texto: sugerida.texto });
  }

  return validas.sort(
    (a, b) => (ordemDaAba.get(a.aba) ?? 0) - (ordemDaAba.get(b.aba) ?? 0) || a.linha - b.linha,
  );
}

/**
 * Identifica as perguntas e o modelo de resposta da planilha: primeiro pela regra do cabeçalho e,
 * se ela não se aplicar, com a IA (sem modelo de resposta). Sem nenhuma pergunta, lança
 * ErroDePlanilha("sem-perguntas") (cenário 5).
 */
export async function identificarPerguntas(
  planilha: PlanilhaLida,
  opcoes: { nomes: NomesDeCabecalho; identificadorComIA: IdentificadorDePerguntasComIA },
): Promise<ResultadoDaIdentificacao> {
  const porRegra = identificarPerguntasPorRegra(planilha, opcoes.nomes.pergunta);
  if (porRegra !== null && porRegra.perguntas.length > 0) {
    return {
      perguntas: porRegra.perguntas,
      origem: "regra",
      modelo: identificarModeloDeResposta(planilha, porRegra, opcoes.nomes),
    };
  }

  if (porRegra === null) {
    const comIA = await identificarPerguntasComIA(planilha, opcoes.identificadorComIA);
    if (comIA.length > 0) return { perguntas: comIA, origem: "ia", modelo: null };
  }

  throw new ErroDePlanilha("sem-perguntas");
}
