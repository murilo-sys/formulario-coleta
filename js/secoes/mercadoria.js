// js/secoes/mercadoria.js
import { state } from '../state.js';

export const NATUREZAS_BLOQUEADAS = ["liquido", "quimica_diversos", "artigos_perigosos"];

// Listener para gerenciar a seleção de naturezas de carga bloqueadas (Requisitos 3 e 4)
document.addEventListener("DOMContentLoaded", () => {
  const naturezaSelect = document.getElementById("naturezaMercadoria");
  const buttonSolicitarColeta = document.getElementById("buttonSolicitarColeta");
  const dialogNaturezaBloqueada = document.getElementById("dialogNaturezaBloqueada");
  const btnFecharNaturezaBloqueada = document.getElementById("btnFecharNaturezaBloqueada");

  if (naturezaSelect) {
    // Valida o estado inicial na carga da página (desfaz se for inválido de início)
    if (NATUREZAS_BLOQUEADAS.includes(naturezaSelect.value)) {
      naturezaSelect.value = "";
    }

    naturezaSelect.addEventListener("change", () => {
      if (NATUREZAS_BLOQUEADAS.includes(naturezaSelect.value)) {
        naturezaSelect.value = ""; // Desfaz a seleção
        if (buttonSolicitarColeta) {
          buttonSolicitarColeta.disabled = false; // Garante que não permaneça travado
        }
        if (dialogNaturezaBloqueada) {
          dialogNaturezaBloqueada.showModal();
        }
      } else {
        if (buttonSolicitarColeta) {
          buttonSolicitarColeta.disabled = false;
        }
      }
    });
  }

  if (btnFecharNaturezaBloqueada && dialogNaturezaBloqueada) {
    btnFecharNaturezaBloqueada.addEventListener("click", () => {
      dialogNaturezaBloqueada.close();
    });
  }
});

// Executa as validações da seção de mercadoria
export function validarMercadoria(marcarErro) {
  let valido = true;

  const pesoReal = document.getElementById("pesoReal");
  const valorNf = document.getElementById("valorNf");
  const numeroNf = document.getElementById("numeroNf");
  const qtdVolumes = document.getElementById("qtdVolumes");
  const naturezaMercadoria = document.getElementById("naturezaMercadoria");

  const pesoLimpo = state.maskPeso ? state.maskPeso.unmaskedValue : "";
  const valorNfLimpo = state.maskValor ? state.maskValor.unmaskedValue : "";
  const numeroNfValor = numeroNf ? numeroNf.value.trim() : "";

  // Verifica a seleção da natureza da carga (não pode ser vazia ou bloqueada)
  if (naturezaMercadoria.value === "" || NATUREZAS_BLOQUEADAS.includes(naturezaMercadoria.value)) {
    marcarErro(naturezaMercadoria);
    valido = false;
  }

  // Verifica se o número da NF está preenchido
  if (!numeroNf || numeroNfValor === "") {
    if (numeroNf) marcarErro(numeroNf);
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
