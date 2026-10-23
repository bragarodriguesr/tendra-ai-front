import path from "node:path";

export const NIVEIS_DE_LOG = ["error", "warn", "info", "debug"] as const;
export type NivelDeLog = (typeof NIVEIS_DE_LOG)[number];

export const NIVEIS_DE_ESFORCO = ["low", "medium", "high", "xhigh", "max"] as const;
export type NivelDeEsforco = (typeof NIVEIS_DE_ESFORCO)[number];

/** Comportamento da IA, registrado em cada tarefa (cenário 38). Decidido na etapa A10 (P8). */
export interface ConfiguracaoDaIa {
  /** Modelo da geração das respostas. */
  modelo: string;
  /** Modelo pequeno da identificação de perguntas, quando a regra da coluna falha. */
  modeloDeIdentificacao: string;
  /** Modelo da segunda chamada, que aponta conflitos entre as fontes citadas (cenário 22). */
  modeloDeConflito: string;
  esforco: NivelDeEsforco;
  /** Perguntas por requisição de geração. */
  tamanhoDoLote: number;
}

export interface Configuracao {
  chaveApi: string;
  ia: ConfiguracaoDaIa;
  pastaDados: string;
  nivelDeLog: NivelDeLog;
  /** Porta do servidor local, que só ouve em 127.0.0.1. */
  porta: number;
  /** Conexão ao Postgres (DATABASE_URL, etapa D1). Sem ela, o banco é o PGlite em `<pastaDados>/banco`. */
  bancoUrl: string | null;
}

/** Erro de configuração. A mensagem cita nomes de variáveis, nunca os valores. */
export class ErroDeConfiguracao extends Error {
  override name = "ErroDeConfiguracao";
}

const PASTA_DADOS_PADRAO = "../dados";
const NIVEL_DE_LOG_PADRAO: NivelDeLog = "info";
const PORTA_PADRAO = 3000;
const MODELO_PADRAO = "claude-opus-5-5";
const MODELO_DE_IDENTIFICACAO_PADRAO = "claude-haiku-5-5";
const MODELO_DE_CONFLITO_PADRAO = "claude-sonnet-5-5";
const ESFORCO_PADRAO: NivelDeEsforco = "medium";
const TAMANHO_DO_LOTE_PADRAO = 10;
const TAMANHO_MAXIMO_DO_LOTE = 50;

/** Configuração dos comandos que não chamam a IA, como a carga da base e o servidor. */
export type ConfiguracaoSemChave = Omit<Configuracao, "chaveApi" | "ia">;

/** Lê as variáveis da IA e acumula os problemas encontrados. */
function lerVariaveisDaIa(ambiente: NodeJS.ProcessEnv, problemas: string[]): ConfiguracaoDaIa {
  const esforcoInformado = ambiente.TENDRA_ESFORCO?.trim() || ESFORCO_PADRAO;
  const esforco = NIVEIS_DE_ESFORCO.find((nivel) => nivel === esforcoInformado);
  if (esforco === undefined) problemas.push(`TENDRA_ESFORCO inválida. Use ${NIVEIS_DE_ESFORCO.join(", ")}.`);

  const loteInformado = ambiente.TENDRA_TAMANHO_LOTE?.trim() || String(TAMANHO_DO_LOTE_PADRAO);
  const tamanhoDoLote = Number(loteInformado);
  if (!/^\d+$/.test(loteInformado) || tamanhoDoLote < 1 || tamanhoDoLote > TAMANHO_MAXIMO_DO_LOTE) {
    problemas.push(`TENDRA_TAMANHO_LOTE inválida. Use um número de 1 a ${TAMANHO_MAXIMO_DO_LOTE}.`);
  }

  return {
    modelo: ambiente.TENDRA_MODELO?.trim() || MODELO_PADRAO,
    modeloDeIdentificacao: ambiente.TENDRA_MODELO_IDENTIFICACAO?.trim() || MODELO_DE_IDENTIFICACAO_PADRAO,
    modeloDeConflito: ambiente.TENDRA_MODELO_CONFLITO?.trim() || MODELO_DE_CONFLITO_PADRAO,
    esforco: esforco ?? ESFORCO_PADRAO,
    tamanhoDoLote,
  };
}

/** Lê as variáveis comuns a todos os comandos e acumula os problemas encontrados. */
function lerVariaveisComuns(
  ambiente: NodeJS.ProcessEnv,
  pastaBase: string,
  problemas: string[],
): { pastaDados: string; nivelDeLog: NivelDeLog | undefined; porta: number; bancoUrl: string | null } {
  const nivelInformado = ambiente.TENDRA_NIVEL_LOG?.trim() || NIVEL_DE_LOG_PADRAO;
  const nivelDeLog = NIVEIS_DE_LOG.find((nivel) => nivel === nivelInformado);
  if (nivelDeLog === undefined) {
    problemas.push(`TENDRA_NIVEL_LOG inválida. Use ${NIVEIS_DE_LOG.join(", ")}.`);
  }
  const pastaDados = path.resolve(
    pastaBase,
    ambiente.TENDRA_PASTA_DADOS?.trim() || PASTA_DADOS_PADRAO,
  );
  const portaInformada = ambiente.TENDRA_PORTA?.trim() || String(PORTA_PADRAO);
  const porta = Number(portaInformada);
  if (!/^\d+$/.test(portaInformada) || porta < 1 || porta > 65535) {
    problemas.push("TENDRA_PORTA inválida. Use um número de 1 a 65535.");
  }
  const bancoUrl = ambiente.DATABASE_URL?.trim() || null;
  if (bancoUrl !== null && !/^postgres(ql)?:\/\//.test(bancoUrl)) {
    problemas.push("DATABASE_URL inválida. Use uma conexão postgres://.");
  }
  return { pastaDados, nivelDeLog, porta, bancoUrl };
}

/**
 * Lê e valida as variáveis de ambiente do backend (cenário 27).
 * Lança ErroDeConfiguracao listando todas as variáveis ausentes ou inválidas.
 */
export function carregarConfiguracao(
  ambiente: NodeJS.ProcessEnv = process.env,
  pastaBase: string = process.cwd(),
): Configuracao {
  const problemas: string[] = [];

  const chaveApi = ambiente.ANTHROPIC_API_KEY?.trim() ?? "";
  if (chaveApi === "") {
    problemas.push("Variável de ambiente obrigatória ausente: ANTHROPIC_API_KEY");
  }

  const { pastaDados, nivelDeLog, porta, bancoUrl } = lerVariaveisComuns(ambiente, pastaBase, problemas);
  const ia = lerVariaveisDaIa(ambiente, problemas);
  if (problemas.length > 0 || nivelDeLog === undefined) {
    throw new ErroDeConfiguracao(problemas.join("\n"));
  }

  return { chaveApi, ia, pastaDados, nivelDeLog, porta, bancoUrl };
}

/**
 * Lê a configuração dos comandos que não chamam a IA (como `carregar-base` e o servidor da
 * base de conhecimento), sem exigir a chave da API. Lança ErroDeConfiguracao se alguma variável estiver inválida.
 */
export function carregarConfiguracaoSemChave(
  ambiente: NodeJS.ProcessEnv = process.env,
  pastaBase: string = process.cwd(),
): ConfiguracaoSemChave {
  const problemas: string[] = [];
  const { pastaDados, nivelDeLog, porta, bancoUrl } = lerVariaveisComuns(ambiente, pastaBase, problemas);
  if (problemas.length > 0 || nivelDeLog === undefined) {
    throw new ErroDeConfiguracao(problemas.join("\n"));
  }
  return { pastaDados, nivelDeLog, porta, bancoUrl };
}

/** Configuração do servidor: com a chave da API ou, enquanto a A1 não é feita, com a API simulada. */
export type ConfiguracaoDoServidor = ConfiguracaoSemChave & {
  ia: ConfiguracaoDaIa;
  api: { tipo: "real"; chaveApi: string } | { tipo: "simulada" };
};

/**
 * Lê a configuração do servidor. Sem ANTHROPIC_API_KEY, o servidor não inicia (cenário 27), a não ser
 * com TENDRA_API_SIMULADA=1, que liga a API simulada para usar a tela sem a chave.
 */
export function carregarConfiguracaoDoServidor(
  ambiente: NodeJS.ProcessEnv = process.env,
  pastaBase: string = process.cwd(),
): ConfiguracaoDoServidor {
  if (ambiente.TENDRA_API_SIMULADA?.trim() === "1") {
    const problemas: string[] = [];
    const comuns = carregarConfiguracaoSemChave(ambiente, pastaBase);
    const ia = lerVariaveisDaIa(ambiente, problemas);
    if (problemas.length > 0) throw new ErroDeConfiguracao(problemas.join("\n"));
    return { ...comuns, ia, api: { tipo: "simulada" } };
  }
  try {
    const { chaveApi, ...resto } = carregarConfiguracao(ambiente, pastaBase);
    return { ...resto, api: { tipo: "real", chaveApi } };
  } catch (erro) {
    if (erro instanceof ErroDeConfiguracao && erro.message.includes("ANTHROPIC_API_KEY")) {
      throw new ErroDeConfiguracao(`${erro.message}\nPara usar o servidor sem a chave, com respostas simuladas, defina TENDRA_API_SIMULADA=1.`);
    }
    throw erro;
  }
}
