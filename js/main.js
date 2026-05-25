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

    //Clique do botão submit
    formulario.addEventListener('submit', (evento) => {
      evento.preventDefault();

      console.log("botão clicado")

      //Limpar campos erro-input
      const todosOsCampos = document.querySelectorAll('input, select');
      todosOsCampos.forEach(campo => {
        campo.addEventListener('input', () => {
          campo.classList.remove('erro-input');
        });
      });


      //Puxando os valores sem a mascara
      const cnpjSolicitante = maskSolicitante ? maskSolicitante.unmaskedValue : '';
      const documentoDestinatario = maskDestinatario ? maskDestinatario.unmaskedValue : '';
      const documentoRemetente = maskRemetente ? maskRemetente.unmaskedValue : '';
      const cepLimpo = maskCep ? maskCep.unmaskedValue : '';
      const pesoLimpo = maskPeso ? maskPeso.unmaskedValue : '';
      const valorNfLimpo = maskValor ? maskValor.unmaskedValue : '';

      //Função verificar se documento (CNPJ/CPF) está valido
      function DocValido(doc) {
        if (doc.length !== 11 && doc.length !== 14) {
          return false
        }
        return true
      }

      //verifica solicitante
      if (!DocValido(cnpjSolicitante)) {
        void solicitanteDoc.offsetWidth
        solicitanteDoc.classList.add('erro-input')
      }

      //verifica remetente
      if (!DocValido(documentoRemetente)) {
        void docRemetente.offsetWidth
        docRemetente.classList.add('erro-input')
      }

      //verifica destinatario
      if (!DocValido(documentoDestinatario)) {
        void docDestinatario.offsetWidth
        docDestinatario.classList.add('erro-input')
      }

      //verifica natureza da mercadoria
      const naturezaMercadoria = document.getElementById('naturezaMercadoria')
      if (naturezaMercadoria.value == "") {
        void naturezaMercadoria.offsetWidth
        naturezaMercadoria.classList.add('erro-input')
      }

      //verifica se valornf é menor ou igual que zero || ou nulo
      if (valorNfLimpo <= 0 || isNaN(valorNfLimpo) || valorNfLimpo == "") {
        void valorNf.offsetWidth
        valorNf.classList.add('erro-input')
      }

      //verifica se quantidade de volumes é valido
      const qtdVolumes = document.getElementById('qtdVolumes')
      if (qtdVolumes.value <= 0 || isNaN(qtdVolumes.value) || qtdVolumes.value == "") {
        void qtdVolumes.offsetWidth
        qtdVolumes.classList.add('erro-input')
      }

      //verifica se peso real é valido
      if (pesoLimpo <= 0 || isNaN(pesoLimpo) || pesoLimpo == "") {
        void pesoReal.offsetWidth
        pesoReal.classList.add('erro-input')
      }

      //Se caso tiver erro, ir para ele e clicar no campo
      const primeiroErro = document.querySelector('.erro-input')
      if (primeiroErro) {
        primeiroErro.scrollIntoView({ behavior: 'smooth', block: 'center' })
        primeiroErro.focus();
        return
      }
    })


    //Adiciona nova dimensão 
    const btnAdicionar = document.getElementById('botaoAdicionar');
    const containerCubagem = document.getElementById('containerCubagem');

    if (btnAdicionar && containerCubagem) {
      btnAdicionar.addEventListener('click', () => {

        const qtdColunaCubagem = document.querySelectorAll('.coluna-cubagem')
        const qtdVolumes = document.getElementById('qtdVolumes')

        if ((qtdColunaCubagem.length) >= qtdVolumes.value) {
          void qtdVolumes.offsetWidth
          qtdVolumes.classList.add('erro-input')
          return
        }


        // O bloco de HTML para duplicar
        const novaLinhaHTML = `
        <div class="coluna-cubagem">
          <div class="coluna-flex-1">
            <p class="pergunta-cubagem">COMPRIMENTO</p>
            <div class="input-grupo-sufixo">
              <input class="input-comprimento" placeholder="0">
              <span class="sufixo">| cm</span>
            </div>
          </div>
          <div class="coluna-flex-1">
            <p class="pergunta-cubagem">LARGURA</p>
            <div class="input-grupo-sufixo">
              <input class="input-largura" placeholder="0">
              <span class="sufixo">| cm</span>
            </div>
          </div>
          <div class="coluna-flex-1">
            <p class="pergunta-cubagem">ALTURA</p>
            <div class="input-grupo-sufixo">
              <input class="input-altura" placeholder="0">
              <span class="sufixo">| cm</span>
            </div>
          </div>
          <div class="coluna-lixo">
            <button class="botao-lixo" type="button">🗑️</button>
          </div>
        </div>
        `;

        // Injeta o HTML novo no final da lista dentro do container
        containerCubagem.insertAdjacentHTML('beforeend', novaLinhaHTML);

      });
    }
  }
});