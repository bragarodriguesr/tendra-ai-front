import path from "node:path";

export const NIVEIS_DE_LOG = ["error", "warn", "info", "debug"] as const;
export type NivelDeLog = (typeof NIVEIS_DE_LOG)[number];

export interface Configuracao {
  chaveApi: string;
  pastaDados: string;
  nivelDeLog: NivelDeLog;
}

/** Erro de configuração. A mensagem cita nomes de variáveis, nunca os valores. */
export class ErroDeConfiguracao extends Error {
  override name = "ErroDeConfiguracao";
}

const PASTA_DADOS_PADRAO = "../dados";
const NIVEL_DE_LOG_PADRAO: NivelDeLog = "info";

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

  const nivelInformado = ambiente.TENDRA_NIVEL_LOG?.trim() || NIVEL_DE_LOG_PADRAO;
  const nivelDeLog = NIVEIS_DE_LOG.find((nivel) => nivel === nivelInformado);
  if (nivelDeLog === undefined) {
    problemas.push(`TENDRA_NIVEL_LOG inválida. Use ${NIVEIS_DE_LOG.join(", ")}.`);
  }

  if (problemas.length > 0 || nivelDeLog === undefined) {
    throw new ErroDeConfiguracao(problemas.join("\n"));
  }

  const pastaDados = path.resolve(
    pastaBase,
    ambiente.TENDRA_PASTA_DADOS?.trim() || PASTA_DADOS_PADRAO,
  );

  return { chaveApi, pastaDados, nivelDeLog };
}
