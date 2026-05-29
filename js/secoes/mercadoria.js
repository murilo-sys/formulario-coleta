// js/secoes/mercadoria.js
import { state } from '../state.js';

// Executa as validações da seção de mercadoria
export function validarMercadoria(marcarErro) {
  let valido = true;

  const pesoReal = document.getElementById("pesoReal");
  const valorNf = document.getElementById("valorNf");
  const qtdVolumes = document.getElementById("qtdVolumes");
  const naturezaMercadoria = document.getElementById("naturezaMercadoria");

  const pesoLimpo = state.maskPeso ? state.maskPeso.unmaskedValue : "";
  const valorNfLimpo = state.maskValor ? state.maskValor.unmaskedValue : "";

  // Verifica a seleção da natureza da carga
  if (naturezaMercadoria.value === "") {
    marcarErro(naturezaMercadoria);
    valido = false;
  }

  // Verifica se o valor da NF é maior que zero
  if (valorNfLimpo <= 0 || isNaN(valorNfLimpo) || valorNfLimpo === "") {
    marcarErro(valorNf);
    valido = false;
  }

  // Verifica a quantidade de volumes informada
  if (qtdVolumes.value <= 0 || isNaN(qtdVolumes.value) || qtdVolumes.value === "") {
    marcarErro(qtdVolumes);
    valido = false;
  }

  // Verifica se o peso real é válido e maior que zero
  if (pesoLimpo <= 0 || isNaN(pesoLimpo) || pesoLimpo === "") {
    marcarErro(pesoReal);
    valido = false;
  }

  return valido;
}
