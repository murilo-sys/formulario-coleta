// js/mascaras.js
document.addEventListener("DOMContentLoaded", () => {
  //Endereços
  cep = document.getElementById('cepInput')
  logradouro = document.getElementById('logradouroInput')
  numero = document.getElementById('numeroInput')
  complemento = document.getElementById('complementoInput')
  bairro = document.getElementById('bairroInput')
  cidade = document.getElementById('cidadeInput')
  estado = document.getElementById('estadoInput')

  //Define como falso inicialmente
  solicitanteVerificado = remetenteVerificado = destinatarioVerificado = false;

  // ========================================================================= //
  //                MÁSCARAS DE DOCUMENTOS (CPF / CNPJ DINÂMICO)               //
  // ========================================================================= //

  const solicitanteDoc = document.getElementById("solicitanteDoc");
  const remetenteDoc = document.getElementById("remetenteDoc");
  const destinatarioDoc = document.getElementById("destinatarioDoc");

  // Configuração reutilizável para a lógica de alternância CPF/CNPJ
  const maskOptionsDoc = {
    mask: [
      {
        mask: "000.000.000-00",
        type: "CPF",
      },
      {
        mask: "00.000.000/0000-00",
        type: "CNPJ",
      },
    ],
    dispatch: function (appended, dynamicMasked) {
      const number = (dynamicMasked.value + appended).replace(/\D/g, ""); // Remove tudo que não for número

      // Se o número de dígitos puros for maior que 11, pula para a máscara de CNPJ
      if (number.length > 11) {
        return dynamicMasked.compiledMasks[1]; // Retorna o CNPJ
      }
      return dynamicMasked.compiledMasks[0]; // Se não, mantém o CPF
    },
  };

  // Aplica a máscara no Solicitante
  if (solicitanteDoc) {
    maskSolicitante = IMask(solicitanteDoc, maskOptionsDoc);
  }

  // Aplica a máscara no Remetente
  if (remetenteDoc) {
    maskRemetente = IMask(remetenteDoc, maskOptionsDoc);
  }

  // Aplica a máscara no Destinatário
  if (destinatarioDoc) {
    maskDestinatario = IMask(destinatarioDoc, maskOptionsDoc);
  }

  // ================================================================================== //
  //                                      MÁSCARA DE CEP                                //
  // ================================================================================== //

  if (cep) {
    maskCep = IMask(cep, {
      mask: "00000-000",
    });
  }

  // ================================================================================================================= //
  //                  MÁSCARAS DE VALORES (PESO, VALOR DA NF, COMPRIMENTO, LARGURA, ALTURA E VOLUMES)                  //
  // ================================================================================================================= //

  const pesoReal = document.getElementById("pesoReal");
  const valorNf = document.getElementById("valorNf");
  const volumes = document.getElementById('qtdVolumes')

  // Máscara para o Peso (Número Puro e Blindado contra Negativos)
  if (pesoReal) {
    maskPeso = IMask(pesoReal, {
      mask: Number,
      thousandsSeparator: ".",
      radix: ",",
      scale: 2,
      signed: false, // Evita números negativos
      prepare: function (str) {
        if (str === "-") return "";
        return str;
      },
    });
  }

  // Máscara para o Valor da Nota Fiscal (Adiciona zeros fracionários)
  if (valorNf) {
    maskValor = IMask(valorNf, {
      mask: Number,
      thousandsSeparator: ".",
      radix: ",",
      padFractionalZeros: true, // Garante os ",00" no final
      scale: 2,
      signed: false,
      prepare: function (str) {
        if (str === "-") return "";
        return str;
      },
    });
  }

  //Blinda o campo de volumes 
  blindarInputCubagem(volumes)

  // Blinda imediatamente a primeira linha nativa de cubagem que já veio escrita no HTML
  const primeiraLinhaHTML = document.querySelector(".coluna-cubagem");
  if (primeiraLinhaHTML) {
    blindarInputCubagem(primeiraLinhaHTML.querySelector(".input-comprimento"));
    blindarInputCubagem(primeiraLinhaHTML.querySelector(".input-largura"));
    blindarInputCubagem(primeiraLinhaHTML.querySelector(".input-altura"));
  }
});

function blindarInputCubagem(inputElement) {
  if (!inputElement) return;

  // 1. BLOQUEIO FÍSICO DO TECLADO: Impede que as teclas apareçam no ecrã
  inputElement.addEventListener("keydown", (evento) => {
    if (
      evento.key === "e" ||
      evento.key === "E" ||
      evento.key === "-" ||
      evento.key === "." ||
      evento.key === "," ||
      evento.key === "+"
    ) {
      evento.preventDefault(); // Cancela a ação da tecla imediatamente
    }
  });

  // 2. MÁSCARA IMASK: Garante a blindagem caso o utilizador tente colar um texto (Ctrl+V)
  IMask(inputElement, {
    mask: Number,
    scale: 0, // 0 casas decimais = apenas números inteiros
    signed: false, // Bloqueia números negativos
    prepare: function (str) {
      if (str === "-") return "";
      return str;
    }
  });
}
