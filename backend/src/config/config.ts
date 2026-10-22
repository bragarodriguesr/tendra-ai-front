import path from "node:path";

export const NIVEIS_DE_LOG = ["error", "warn", "info", "debug"] as const;
export type NivelDeLog = (typeof NIVEIS_DE_LOG)[number];

export interface Configuracao {
  chaveApi: string;
  pastaDados: string;
  nivelDeLog: NivelDeLog;
  /** Porta do servidor local, que só ouve em 127.0.0.1. */
  porta: number;
}

/** Erro de configuração. A mensagem cita nomes de variáveis, nunca os valores. */
export class ErroDeConfiguracao extends Error {
  override name = "ErroDeConfiguracao";
}

const PASTA_DADOS_PADRAO = "../dados";
const NIVEL_DE_LOG_PADRAO: NivelDeLog = "info";
const PORTA_PADRAO = 3000;

/** Configuração dos comandos que não chamam a IA, como a carga da base e o servidor. */
export type ConfiguracaoSemChave = Omit<Configuracao, "chaveApi">;

/** Lê as variáveis comuns a todos os comandos e acumula os problemas encontrados. */
function lerVariaveisComuns(
  ambiente: NodeJS.ProcessEnv,
  pastaBase: string,
  problemas: string[],
): { pastaDados: string; nivelDeLog: NivelDeLog | undefined; porta: number } {
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
  return { pastaDados, nivelDeLog, porta };
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

  const { pastaDados, nivelDeLog, porta } = lerVariaveisComuns(ambiente, pastaBase, problemas);
  if (problemas.length > 0 || nivelDeLog === undefined) {
    throw new ErroDeConfiguracao(problemas.join("\n"));
  }

  return { chaveApi, pastaDados, nivelDeLog, porta };
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
  const { pastaDados, nivelDeLog, porta } = lerVariaveisComuns(ambiente, pastaBase, problemas);
  if (problemas.length > 0 || nivelDeLog === undefined) {
    throw new ErroDeConfiguracao(problemas.join("\n"));
  }
  return { pastaDados, nivelDeLog, porta };
}
