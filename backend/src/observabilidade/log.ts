import pino, { type DestinationStream, type Logger } from "pino";
import type { NivelDeLog } from "../config/config.ts";

/**
 * Campos que nunca aparecem nos logs, mesmo se forem passados por engano.
 * O conteúdo de documentos e de respostas também não deve ser registrado:
 * os módulos registram identificadores e contagens, não textos.
 */
const CAMPOS_OMITIDOS = [
  "chaveApi",
  "*.chaveApi",
  "apiKey",
  "*.apiKey",
  "ANTHROPIC_API_KEY",
  "*.ANTHROPIC_API_KEY",
  'headers["x-api-key"]',
  '*.headers["x-api-key"]',
];

/** Cria o log estruturado do backend (JSON, uma linha por evento). */
export function criarLog(nivel: NivelDeLog, destino?: DestinationStream): Logger {
  return pino(
    {
      level: nivel,
      base: undefined,
      redact: { paths: CAMPOS_OMITIDOS, censor: "[omitido]" },
    },
    destino,
  );
}
