/**
 * CNPJ numérico ou alfanumérico (IN RFB nº 2.229/2024): 12 caracteres de raiz e ordem, com letras
 * maiúsculas ou números, e 2 dígitos verificadores numéricos. O dígito verificador usa o módulo 11
 * de sempre, com o valor de cada caractere igual ao código ASCII menos 48 (0 a 9 valem 0 a 9; A vale
 * 17, B vale 18 e assim por diante).
 */

/** Só letras e números, em maiúsculas, até 14 caracteres; letras só nas 12 primeiras posições. */
export function cnpjSemMascara(valor) {
  const limpo = String(valor || "").toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 14);
  return limpo.slice(0, 12) + limpo.slice(12).replace(/\D/g, "");
}

/** Máscara 00.000.000/0000-00, com letras ou números nas 12 primeiras posições. */
export function mascararCnpj(valor) {
  const c = cnpjSemMascara(valor);
  const partes = [c.slice(0, 2), c.slice(2, 5), c.slice(5, 8), c.slice(8, 12), c.slice(12, 14)];
  let saida = partes[0];
  if (partes[1]) saida += "." + partes[1];
  if (partes[2]) saida += "." + partes[2];
  if (partes[3]) saida += "/" + partes[3];
  if (partes[4]) saida += "-" + partes[4];
  return saida;
}

const digitoVerificador = (base) => {
  let soma = 0, peso = base.length - 7;
  for (let i = 0; i < base.length; i++) {
    soma += (base.charCodeAt(i) - 48) * peso--;
    if (peso < 2) peso = 9;
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
};

/** Confere o formato e os dois dígitos verificadores (14 caracteres, sem máscara). */
export function cnpjValido(c) {
  if (!/^[0-9A-Z]{12}\d{2}$/.test(c) || /^(.)\1{13}$/.test(c)) return false;
  const primeiro = digitoVerificador(c.slice(0, 12));
  return primeiro === +c[12] && digitoVerificador(c.slice(0, 13)) === +c[13];
}
