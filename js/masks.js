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

  const numeroNf = document.getElementById("numeroNf");
  if (numeroNf) {
    numeroNf.addEventListener("keydown", (evento) => {
      const teclasPermitidas = [
        "Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", 
        "Enter", "Escape", "Home", "End"
      ];
      if (teclasPermitidas.includes(evento.key) || evento.ctrlKey || evento.metaKey) {
        return;
      }
      if (!/^[0-9]$/.test(evento.key)) {
        evento.preventDefault();
      }
    });

    numeroNf.addEventListener("input", () => {
      numeroNf.value = numeroNf.value.replace(/\D/g, "");
    });
  }

  blindarInputCubagem(volumes);

  const primeiraLinhaHTML = document.querySelector(".coluna-cubagem");
  if (primeiraLinhaHTML) {
    blindarInputCubagem(primeiraLinhaHTML.querySelector(".input-volumes"));
    blindarInputMetro(primeiraLinhaHTML.querySelector(".input-comprimento"));
    blindarInputMetro(primeiraLinhaHTML.querySelector(".input-largura"));
    blindarInputMetro(primeiraLinhaHTML.querySelector(".input-altura"));
  }
});

export function blindarInputCubagem(inputElement) {
  if (!inputElement) return;

  inputElement.addEventListener("keydown", (evento) => {
    const teclasPermitidas = [
      "Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", 
      "Enter", "Escape", "Home", "End"
    ];
    if (teclasPermitidas.includes(evento.key) || evento.ctrlKey || evento.metaKey) {
      return;
    }
    if (!/^[0-9]$/.test(evento.key)) {
      evento.preventDefault();
    }
  });

  inputElement.addEventListener("input", () => {
    inputElement.value = inputElement.value.replace(/\D/g, "");
  });
}

export function blindarInputMetro(inputElement) {
  if (!inputElement) return;

  // Keydown block para garantir apenas números e comandos
  inputElement.addEventListener("keydown", (evento) => {
    const teclasPermitidas = [
      "Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", 
      "Enter", "Escape", "Home", "End"
    ];
    
    if (teclasPermitidas.includes(evento.key) || evento.ctrlKey || evento.metaKey) {
      return;
    }

    if (!/^[0-9]$/.test(evento.key)) {
      evento.preventDefault();
    }
  });

  // Formatação tipo monetário (direita para a esquerda) ao digitar
  inputElement.addEventListener("input", () => {
    let apenasNumeros = inputElement.value.replace(/\D/g, "");
    apenasNumeros = apenasNumeros.replace(/^0+/, "");

    if (apenasNumeros === "") {
      inputElement.value = "";
      return;
    }

    while (apenasNumeros.length < 3) {
      apenasNumeros = "0" + apenasNumeros;
    }

    const parteInteira = apenasNumeros.slice(0, -2);
    const parteDecimal = apenasNumeros.slice(-2);

    inputElement.value = parseInt(parteInteira, 10) + "," + parteDecimal;

    // Mantém o cursor sempre no final do input
    inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);
  });
}
