// js/utils/utils.js

// Verifica se o CNPJ tem tamanho básico válido (14 dígitos)
export function verificarCnpj(cnpj) {
  if (cnpj && cnpj.length !== 14) return false;
  return true;
}

// Verifica se o tamanho do documento corresponde a CPF (11) ou CNPJ (14)
export function DocValido(doc) {
  if (doc.length !== 11 && doc.length !== 14) {
    return false;
  }
  return true;
}
