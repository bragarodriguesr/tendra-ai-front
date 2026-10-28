/**
 * Leitura e validação dos arquivos `.md` da base de conhecimento, conforme
 * docs/mvp-resposta-rfp/FORMATO_BASE_MD.md (cenários 7 e 9).
 */

export const TIPOS_DE_DOCUMENTO = ["documento", "rfp-passada"] as const;
export type TipoDeDocumento = (typeof TIPOS_DE_DOCUMENTO)[number];

export interface Cabecalho {
  titulo: string;
  tipo: TipoDeDocumento;
  /** Data no formato AAAA-MM-DD. */
  atualizadoEm: string;
  versao: string | null;
  /**
   * Validade (AAAA-MM-DD), ou null quando o cabeçalho não traz o campo ("Indefinido" na tela). A partir
   * dessa data o documento fica vencido: sai da geração e não pode ser reativado.
   */
  validade: string | null;
}

export interface ArquivoMdLido {
  cabecalho: Cabecalho;
  /** Todas as linhas do arquivo, cabeçalho incluído. A linha N do arquivo é `linhas[N - 1]`. */
  linhas: string[];
  /** Índice (a partir de 0) da primeira linha depois do fechamento do cabeçalho. */
  inicioDoCorpo: number;
  /** Avisos que não impedem a carga, como campos desconhecidos no cabeçalho. */
  avisos: string[];
}

/** Arquivo recusado pela carga. A mensagem segue a tabela de validação do FORMATO_BASE_MD.md. */
export class ErroDeArquivoMd extends Error {
  override name = "ErroDeArquivoMd";
}

const CAMPOS_CONHECIDOS = ["titulo", "tipo", "atualizado_em", "versao", "validade"];
const TITULO_MINIMO = 3;
const TITULO_MAXIMO = 120;
const VERSAO_MAXIMA = 20;

/**
 * Lê um arquivo `.md` da base: confere a codificação, o cabeçalho e o corpo.
 * `hoje` (AAAA-MM-DD) é a data usada para recusar `atualizado_em` no futuro.
 * Lança ErroDeArquivoMd com o motivo quando o arquivo deve ser recusado.
 */
export function lerArquivoMd(conteudo: Uint8Array, hoje: string): ArquivoMdLido {
  let texto: string;
  try {
    // A marca BOM do início é descartada pelo próprio decodificador.
    texto = new TextDecoder("utf-8", { fatal: true }).decode(conteudo);
  } catch {
    throw new ErroDeArquivoMd("o arquivo precisa estar em UTF-8.");
  }

  const linhas = texto.split(/\r?\n/);
  const fechamento = linhas.findIndex((linha, indice) => indice > 0 && linha.trimEnd() === "---");
  if (linhas[0]?.trimEnd() !== "---" || fechamento === -1) {
    throw new ErroDeArquivoMd("cabeçalho ausente ou sem fechamento. O arquivo deve começar com --- na linha 1.");
  }

  const { campos, avisos } = lerCampos(linhas, fechamento);
  const cabecalho = validarCampos(campos, hoje);
  if (cabecalho.validade !== null && estaVencido(cabecalho.validade, hoje)) {
    avisos.push(`validade ${cabecalho.validade} já atingida: o documento entra como Vencido e não vai para a geração.`);
  }

  const corpo = linhas.slice(fechamento + 1);
  if (corpo.every((linha) => linha.trim() === "")) {
    throw new ErroDeArquivoMd("o arquivo não tem conteúdo.");
  }

  return { cabecalho, linhas, inicioDoCorpo: fechamento + 1, avisos };
}

/**
 * Lê as linhas `chave: valor` entre as duas linhas `---`. Aceita valores entre aspas simples
 * ou duplas e comentários iniciados por `#`. Qualquer outra estrutura do YAML (listas, blocos,
 * recuo) e chaves repetidas tornam o cabeçalho ilegível.
 */
function lerCampos(linhas: string[], fechamento: number): { campos: Map<string, string>; avisos: string[] } {
  const campos = new Map<string, string>();
  const avisos: string[] = [];

  for (let indice = 1; indice < fechamento; indice++) {
    const linha = linhas[indice] ?? "";
    if (linha.trim() === "" || linha.trimStart().startsWith("#")) continue;

    const partes = /^([A-Za-z_][A-Za-z0-9_]*):(?:[ \t]+(.*))?$/.exec(linha.trimEnd());
    const chave = partes?.[1];
    const valor = partes === null ? undefined : lerValor(partes[2] ?? "");
    if (chave === undefined || valor === undefined || campos.has(chave)) {
      throw new ErroDeArquivoMd(`cabeçalho ilegível (linha ${indice + 1}).`);
    }

    campos.set(chave, valor);
    if (!CAMPOS_CONHECIDOS.includes(chave)) avisos.push(`campo "${chave}" ignorado.`);
  }
  return { campos, avisos };
}

/** Valor de um campo, sem aspas e sem comentário no fim. Devolve undefined se não for um texto simples. */
function lerValor(bruto: string): string | undefined {
  const valor = bruto.trim();
  if (valor.startsWith('"')) {
    const fim = /^"((?:[^"\\]|\\.)*)"\s*(?:#.*)?$/.exec(valor);
    return fim?.[1]?.replace(/\\(.)/g, "$1");
  }
  if (valor.startsWith("'")) {
    const fim = /^'((?:[^']|'')*)'\s*(?:#.*)?$/.exec(valor);
    return fim?.[1]?.replace(/''/g, "'");
  }
  if (/^[[{|>&*!%@`]/.test(valor)) return undefined;
  return valor.replace(/\s+#.*$/, "").trim();
}

function validarCampos(campos: Map<string, string>, hoje: string): Cabecalho {
  for (const obrigatorio of ["titulo", "tipo", "atualizado_em"]) {
    if ((campos.get(obrigatorio) ?? "") === "") {
      const dica = obrigatorio === "atualizado_em" ? " Use AAAA-MM-DD." : "";
      throw new ErroDeArquivoMd(`campo ${obrigatorio} ausente.${dica}`);
    }
  }

  const titulo = (campos.get("titulo") ?? "").trim();
  if (titulo.length < TITULO_MINIMO || titulo.length > TITULO_MAXIMO) {
    throw new ErroDeArquivoMd(`titulo deve ter de ${TITULO_MINIMO} a ${TITULO_MAXIMO} caracteres.`);
  }

  const tipoInformado = campos.get("tipo") ?? "";
  const tipo = TIPOS_DE_DOCUMENTO.find((candidato) => candidato === tipoInformado);
  if (tipo === undefined) {
    throw new ErroDeArquivoMd(`tipo inválido "${tipoInformado}". Use ${TIPOS_DE_DOCUMENTO.join(" ou ")}.`);
  }

  const atualizadoEm = campos.get("atualizado_em") ?? "";
  if (!ehDataValida(atualizadoEm)) {
    throw new ErroDeArquivoMd(`atualizado_em "${atualizadoEm}" inválido. Use AAAA-MM-DD.`);
  }
  if (atualizadoEm > hoje) {
    throw new ErroDeArquivoMd("atualizado_em está no futuro.");
  }

  const versaoInformada = (campos.get("versao") ?? "").trim();
  if (versaoInformada.length > VERSAO_MAXIMA) {
    throw new ErroDeArquivoMd(`versao deve ter até ${VERSAO_MAXIMA} caracteres.`);
  }

  // Validade opcional; já vencida, o documento entra na base como "Vencido".
  const validadeInformada = (campos.get("validade") ?? "").trim();
  if (validadeInformada !== "" && !ehDataValida(validadeInformada)) {
    throw new ErroDeArquivoMd(`validade "${validadeInformada}" inválida. Use AAAA-MM-DD.`);
  }
  if (validadeInformada !== "" && validadeInformada < atualizadoEm) {
    throw new ErroDeArquivoMd("validade anterior a atualizado_em.");
  }

  return { titulo, tipo, atualizadoEm, versao: versaoInformada === "" ? null : versaoInformada, validade: validadeInformada === "" ? null : validadeInformada };
}

/** Vencido a partir da data de validade, inclusive. Sem validade, nunca vence. */
export function estaVencido(validade: string | null, hoje: string): boolean {
  return validade !== null && validade <= hoje;
}

/** Data AAAA-MM-DD que existe no calendário (recusa, por exemplo, 2026-02-30). */
export function ehDataValida(texto: string): boolean {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (partes === null) return false;
  const [ano, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
}
