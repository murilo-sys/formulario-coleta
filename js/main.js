document.addEventListener('DOMContentLoaded', () => {

  //Variaveis das mascaras
  let maskSolicitante, maskRemetente, maskDestinatario, maskCep, maskPeso, maskValor;

  //Mascara CNPJ

  const solicitanteDoc = document.getElementById('solicitanteDoc');
  const docRemetente = document.getElementById('docRemetente');
  const docDestinatario = document.getElementById('docDestinatario');

  if (solicitanteDoc) {
    maskSolicitante = IMask(solicitanteDoc, {
      mask: [
        {
          mask: '000.000.000-00',
          type: 'CPF'
        },
        {
          mask: '00.000.000/0000-00',
          type: 'CNPJ'
        }
      ],
      dispatch: function (appended, dynamicMasked) {
        const number = (dynamicMasked.value + appended).replace(/\D/g, ''); // Remove tudo que não for número

        // Se o número de dígitos puros for maior que 11, pula para a máscara de CNPJ
        if (number.length > 11) {
          return dynamicMasked.compiledMasks[1]; // Retorna o CNPJ
        }
        return dynamicMasked.compiledMasks[0]; // Se não, mantém o CPF
      }
    });
  }

  if (docRemetente) {
    maskRemetente = IMask(docRemetente, {
      mask: [
        {
          mask: '000.000.000-00',
          type: 'CPF'
        },
        {
          mask: '00.000.000/0000-00',
          type: 'CNPJ'
        }
      ],
      dispatch: function (appended, dynamicMasked) {
        const number = (dynamicMasked.value + appended).replace(/\D/g, ''); // Remove tudo que não for número

        // Se o número de dígitos puros for maior que 11, pula para a máscara de CNPJ
        if (number.length > 11) {
          return dynamicMasked.compiledMasks[1]; // Retorna o CNPJ
        }
        return dynamicMasked.compiledMasks[0]; // Se não, mantém o CPF
      }
    });
  }

  if (docDestinatario) {
    maskDestinatario = IMask(docDestinatario, {
      mask: [
        {
          mask: '000.000.000-00',
          type: 'CPF'
        },
        {
          mask: '00.000.000/0000-00',
          type: 'CNPJ'
        }
      ],
      dispatch: function (appended, dynamicMasked) {
        const number = (dynamicMasked.value + appended).replace(/\D/g, ''); // Remove tudo que não for número

        // Se o número de dígitos puros for maior que 11, pula para a máscara de CNPJ
        if (number.length > 11) {
          return dynamicMasked.compiledMasks[1]; // Retorna o CNPJ
        }
        return dynamicMasked.compiledMasks[0]; // Se não, mantém o CPF
      }
    });
  }

  //Mascara CEP

  const cepInput = document.getElementById('cepInput');

  if (cepInput) {
    maskCep = IMask(cepInput, {
      mask: '00000-000',
    });
  }

  // --- Mascara Peso (Número Puro e Blindado contra Negativos) ---
  const pesoReal = document.getElementById('pesoReal');

  if (pesoReal) {
    maskPeso = IMask(pesoReal, {
      mask: Number,
      thousandsSeparator: '.',
      radix: ',',
      scale: 2,
      signed: false,
      prepare: function (str) {
        if (str === '-') {
          return '';
        }
        return str;
      }
    });
  }

  const valorNf = document.getElementById('valorNf');

  if (valorNf) {
    maskValor = IMask(valorNf, {
      mask: Number,
      thousandsSeparator: '.',
      radix: ',',
      padFractionalZeros: true,
      scale: 2,
      signed: false,
      prepare: function (str) {
        if (str === '-') {
          return '';
        }
        return str;
      }
    });
  }

  //Verificação dos campos no submit
  const formulario = document.querySelector('.formularioColeta')

  if (formulario) {
    formulario.addEventListener('submit', (evento) => {
      evento.preventDefault();

      //Puxando os valores sem a mascara
      const cnpjSolicitante = maskSolicitante ? maskSolicitante.unmaskedValue : '';
      const documentoDestinatario = maskDestinatario ? maskDestinatario.unmaskedValue : '';
      const documentoRemetente = maskRemetente ? maskRemetente.unmaskedValue : '';
      const cepLimpo = maskCep ? maskCep.unmaskedValue : '';
      const pesoLimpo = maskPeso ? maskPeso.unmaskedValue : '';

      //Função verificar se documento (CNPJ/CPF) está valido
      function DocValido(doc) {
        if (doc.length !== 11 && doc.length !== 14) {
          return false
        }
        return true
      }

      //verifica solicitante
      if (!DocValido(cnpjSolicitante)) {
        alert("Cnpj do solicitante invalido")
        return
      }

      //verifica remetente
      if (!DocValido(documentoRemetente)) {
        alert("Cnpj do Remetente invalido")
        return
      }

      //verifica destinatario
      if (!DocValido(documentoDestinatario)) {
        alert("Cnpj do Destinatario invalido")
        return
      }

      

    })
  }
});