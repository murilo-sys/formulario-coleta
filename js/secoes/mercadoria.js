// js/secoes/mercadoria.js
import { state } from '../state.js';

export const NATUREZAS_BLOQUEADAS = ["liquido", "quimica_diversos", "artigos_perigosos", "perecivel"];

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

  const valorNf = document.getElementById("valorNf");
  const dialogValorNfBaixo = document.getElementById("dialogValorNfBaixo");
  const dialogValorNfAlto = document.getElementById("dialogValorNfAlto");
  const naturezaSelect = document.getElementById("naturezaMercadoria");

  function validarLimitesValorNf() {
    if (!valorNf || !valorNf.value) return;
    
    const valorLimpo = state.maskValor ? state.maskValor.unmaskedValue : valorNf.value;
    const valorFloat = parseFloat(valorLimpo.replace(',', '.'));
    
    let limiteValor = 250000;
    let limiteFormatado = "250.000,00";
    
    if (naturezaSelect && naturezaSelect.value === "informatica") {
      limiteValor = 50000;
      limiteFormatado = "50.000,00";
    }

    if (!isNaN(valorFloat) && valorFloat > 0) {
      if (valorFloat <= 200) {
        valorNf.value = "";
        if (state.maskValor) state.maskValor.value = "";
        if (dialogValorNfBaixo) {
          dialogValorNfBaixo.showModal();
        }
      } else if (valorFloat > limiteValor) {
        valorNf.value = "";
        if (state.maskValor) state.maskValor.value = "";
        if (dialogValorNfAlto) {
          const subtitulo = document.getElementById("dialogValorNfAltoSubtitulo");
          if (subtitulo) {
            subtitulo.textContent = `Notamos que o valor da sua Nota Fiscal é maior que R$ ${limiteFormatado}.`;
          }
          dialogValorNfAlto.showModal();
        }
      }
    }
  }

  if (valorNf) {
    valorNf.addEventListener("blur", validarLimitesValorNf);
  }

  if (naturezaSelect) {
    naturezaSelect.addEventListener("change", validarLimitesValorNf);
  }

  const pesoReal = document.getElementById("pesoReal");
  const dialogPesoExcedido = document.getElementById("dialogPesoExcedido");

  if (pesoReal) {
    pesoReal.addEventListener("blur", () => {
      const pesoLimpo = state.maskPeso ? state.maskPeso.unmaskedValue : pesoReal.value;
      const pesoFloat = parseFloat(pesoLimpo.replace(',', '.'));
      if (!isNaN(pesoFloat) && pesoFloat > 500) {
        pesoReal.value = "";
        if (state.maskPeso) state.maskPeso.value = "";
        if (dialogPesoExcedido) {
          dialogPesoExcedido.showModal();
        }
      }
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

  const valorNfFloat = parseFloat(valorNfLimpo.replace(',', '.'));

  let limiteValor = 250000;
  if (naturezaMercadoria && naturezaMercadoria.value === "informatica") {
    limiteValor = 50000;
  }

  // Verifica se o valor da NF é maior que 200 e menor ou igual ao limite
  if (isNaN(valorNfFloat) || valorNfFloat <= 200 || valorNfFloat > limiteValor) {
    marcarErro(valorNf);
    valido = false;
  }

  // Verifica a quantidade de volumes informada
  if (qtdVolumes.value <= 0 || isNaN(qtdVolumes.value) || qtdVolumes.value === "") {
    marcarErro(qtdVolumes);
    valido = false;
  }

  const pesoFloat = parseFloat(pesoLimpo.replace(',', '.'));

  // Verifica se o peso real é válido, maior que zero e não ultrapassa 500KG
  if (isNaN(pesoFloat) || pesoFloat <= 0 || pesoFloat > 500 || pesoLimpo === "") {
    marcarErro(pesoReal);
    valido = false;
  }

  return valido;
}
