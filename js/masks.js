// js/masks.js
import { state } from './state.js';

document.addEventListener("DOMContentLoaded", () => {
  const solicitanteDoc = document.getElementById("solicitanteDoc");
  const remetenteDoc = document.getElementById("remetenteDoc");
  const destinatarioDoc = document.getElementById("destinatarioDoc");

  const maskOptionsDoc = {
    mask: [
      { mask: "000.000.000-00", type: "CPF" },
      { mask: "00.000.000/0000-00", type: "CNPJ" }
    ],
    dispatch: function (appended, dynamicMasked) {
      const number = (dynamicMasked.value + appended).replace(/\D/g, "");
      if (number.length > 11) {
        return dynamicMasked.compiledMasks[1];
      }
      return dynamicMasked.compiledMasks[0];
    }
  };

  if (solicitanteDoc) {
    state.maskSolicitante = IMask(solicitanteDoc, maskOptionsDoc);
  }

  if (remetenteDoc) {
    state.maskRemetente = IMask(remetenteDoc, maskOptionsDoc);
  }

  if (destinatarioDoc) {
    state.maskDestinatario = IMask(destinatarioDoc, maskOptionsDoc);
  }

  const cepEl = document.getElementById('cepInput');
  if (cepEl) {
    state.maskCep = IMask(cepEl, { mask: "00000-000" });
  }

  const pesoReal = document.getElementById("pesoReal");
  const valorNf = document.getElementById("valorNf");
  const volumes = document.getElementById('qtdVolumes');

  if (pesoReal) {
    state.maskPeso = IMask(pesoReal, {
      mask: Number,
      thousandsSeparator: ".",
      radix: ",",
      scale: 2,
      signed: false,
      prepare: function (str) {
        if (str === "-") return "";
        return str;
      }
    });
  }

  if (valorNf) {
    state.maskValor = IMask(valorNf, {
      mask: Number,
      thousandsSeparator: ".",
      radix: ",",
      padFractionalZeros: true,
      scale: 2,
      signed: false,
      prepare: function (str) {
        if (str === "-") return "";
        return str;
      }
    });
  }

  blindarInputCubagem(volumes);

  const primeiraLinhaHTML = document.querySelector(".coluna-cubagem");
  if (primeiraLinhaHTML) {
    blindarInputCubagem(primeiraLinhaHTML.querySelector(".input-comprimento"));
    blindarInputCubagem(primeiraLinhaHTML.querySelector(".input-largura"));
    blindarInputCubagem(primeiraLinhaHTML.querySelector(".input-altura"));
  }
});

export function blindarInputCubagem(inputElement) {
  if (!inputElement) return;

  inputElement.addEventListener("keydown", (evento) => {
    if (
      evento.key === "e" ||
      evento.key === "E" ||
      evento.key === "-" ||
      evento.key === "." ||
      evento.key === "," ||
      evento.key === "+"
    ) {
      evento.preventDefault();
    }
  });

  IMask(inputElement, {
    mask: Number,
    scale: 0,
    signed: false,
    prepare: function (str) {
      if (str === "-") return "";
      return str;
    }
  });
}
