/**
 * CNPJ numérico ou alfanumérico (IN RFB nº 2.229/2024): 12 caracteres de raiz e ordem, com letras
 * maiúsculas ou números, e 2 dígitos verificadores numéricos. Gravado sem máscara e em maiúsculas.
 * O backend confere só o formato; os dígitos verificadores são conferidos pela tela (cenário 63).
 */
export const FORMATO_DO_CNPJ = /^[0-9A-Z]{12}[0-9]{2}$/;

/** CNPJ sem máscara e em maiúsculas, ou null quando não tem o formato de 14 caracteres. */
export function normalizarCnpj(valor: string | undefined): string | null {
  const limpo = (valor ?? "").toUpperCase().replace(/[^0-9A-Z]/g, "");
  return FORMATO_DO_CNPJ.test(limpo) ? limpo : null;
}
