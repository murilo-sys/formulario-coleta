document.addEventListener("DOMContentLoaded", () => {
  // ========================================================================= //
  //                          VARIÁVEIS GLOBAIS DE MÁSCARAS                    //
  // ========================================================================= //

  //Endereços
  const cep = document.getElementById('cepInput')
  const logradouro = document.getElementById('logradouroInput')
  const numero = document.getElementById('numeroInput')
  const complemento = document.getElementById('complementoInput')
  const bairro = document.getElementById('bairroInput')
  const cidade = document.getElementById('cidadeInput')
  const estado = document.getElementById('estadoInput')

  //Mascaras do IMASK
  let maskSolicitante,
    maskRemetente,
    maskDestinatario,
    maskCep,
    maskPeso,
    maskValor,
    maskVolumes;

  //Endereço remetente
  let enderecoRemetente;

  //Verificadores
  let solicitanteVerificado,
    remetenteVerificado,
    destinatarioVerificado;

  //Define como falso inicialmente
  solicitanteVerificado = remetenteVerificado = destinatarioVerificado = false;

  // ========================================================================= //
  //                MÁSCARAS DE DOCUMENTOS (CPF / CNPJ DINÂMICO)               //
  // ========================================================================= //

  const solicitanteDoc = document.getElementById("solicitanteDoc");
  const remetenteDoc = document.getElementById("remetenteDoc");
  const destinatarioDoc = document.getElementById("destinatarioDoc");
  const solicitanteNome = document.getElementById("solicitanteNome")

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

  const cepInput = document.getElementById("cepInput");

  if (cepInput) {
    maskCep = IMask(cepInput, {
      mask: "00000-000",
    });
  }

  // ================================================================================================================= //
  //                  MÁSCARAS DE VALORES (PESO, VALOR DA NF, COMPRIMENTO, LARGURA, ALTURA E VOLUMES)                  //
  // ================================================================================================================= //

  const pesoReal = document.getElementById("pesoReal");
  const valorNf = document.getElementById("valorNf");
  const volumes = document.getElementById('qtdVolumes')

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

  // ================================================================================ //
  // FUNÇÕES                                                                          //
  // ================================================================================ //

  //Função de "ativar" ou "desativar" EndColeta com readOnly
  function readOnlyEndColeta(valor) {
    cep.readOnly = valor
    logradouro.readOnly = valor
    numero.readOnly = valor
    complemento.readOnly = valor
    bairro.readOnly = valor
    cidade.readOnly = valor
    estado.readOnly = valor
  }

  function preencherEndColeta() {

    readOnlyEndColeta(true)

    //Define os campos do endereço com o do Remetente
    maskCep.value = enderecoRemetente.postalCode || ""
    logradouro.value = enderecoRemetente.line1 || ""
    numero.value = enderecoRemetente.number || ""
    complemento.value = enderecoRemetente.line2 || ""
    bairro.value = enderecoRemetente.neighborhood || ""
    cidade.value = enderecoRemetente.city?.name || ""
    estado.value = enderecoRemetente.city?.state.code || ""
  }

  function limparEndColeta() {

    //limpa os campos do endereço
    const campos = [maskCep, logradouro, numero, complemento, bairro, cidade, estado]

    //entra em cada campo e não limpa caso tiver algo
    campos.forEach(campo => {
      if (campo) {
        campo.value = ""
      }
    });
  }



  //Função de verificar cnpj
  function verificarCnpj(cnpj) {

    //Aqui verifica se o cnpj tem 14 caracteres
    if (cnpj && cnpj.length !== 14) return false

    return true
  }

  //Função de preencher o EndColeta com os dados do remetente
  async function verificarEndRemetente() {

    const remetenteDocLimpo = maskRemetente.unmaskedValue

    //Verifica se já não foi verificado a api no remetente antes 
    if (remetenteVerificado) {
      console.log("Dados já salvos anteriormente, buscando...")
      preencherEndColeta()
      return
    }

    if (await !verificarCnpj(remetenteDocLimpo)) return

    console.log("Dados não encontrados, consultando na API")

    //Consulta os dados do solicitante.
    const endereco = await consultarEmpresaPorCnpj(remetenteDocLimpo)

    //Verifica se os dados existem
    if (!endereco) { return console.log("Endereço não encontrado e(ou) indisponivel") }

    enderecoRemetente = endereco

    preencherEndColeta()

    //Remetente já foi verificado marcar como true
    remetenteVerificado = true
  }

  // ========================================================================= //
  //                           VALIDAÇÃO E ENVIO DO FORMULÁRIO                 //
  // ========================================================================= //

  const formulario = document.querySelector(".formularioColeta");

  if (formulario) {
    // Evento para limpar a classe de erro assim que o usuário começar a digitar/selecionar
    formulario.addEventListener("input", (evento) => {
      if (
        evento.target.tagName === "INPUT" ||
        evento.target.tagName === "SELECT"
      ) {
        evento.target.classList.remove("erro-input");
      }
    });

    // Evento disparado ao tentar enviar o formulário
    formulario.addEventListener("submit", (evento) => {
      evento.preventDefault();

      // Puxando os valores reais (sem a formatação da máscara) para validação
      const cnpjSolicitante = maskSolicitante ? maskSolicitante.unmaskedValue : "";
      const documentoRemetente = maskRemetente ? maskRemetente.unmaskedValue : "";
      const documentoDestinatario = maskDestinatario ? maskDestinatario.unmaskedValue : "";
      const cepLimpo = maskCep ? maskCep.unmaskedValue : "";
      const pesoLimpo = maskPeso ? maskPeso.unmaskedValue : "";
      const valorNfLimpo = maskValor ? maskValor.unmaskedValue : "";

      // Função auxiliar para verificar se o documento tem o tamanho correto (CPF = 11, CNPJ = 14)
      function DocValido(doc) {
        if (doc.length !== 11 && doc.length !== 14) {
          return false;
        }
        return true;
      }

      // --- Início das Validações Individuais ---

      //Regex que não permite números
      const regexNome = /^[a-zA-ZÀ-ÿ\s]+$/

      if (solicitanteNome && solicitanteNome.value.trim() == "" || !regexNome.test(solicitanteNome.value)) {
        void solicitanteNome.offsetWidth
        solicitanteNome.classList.add("erro-input")
      }

      if (!DocValido(cnpjSolicitante)) {
        void solicitanteDoc.offsetWidth; // Força um reflow para reiniciar possíveis animações de erro
        solicitanteDoc.classList.add("erro-input");
      }

      if (!DocValido(documentoRemetente)) {
        void remetenteDoc.offsetWidth;
        remetenteDoc.classList.add("erro-input");
      }

      if (!DocValido(documentoDestinatario)) {
        void destinatarioDoc.offsetWidth;
        destinatarioDoc.classList.add("erro-input");
      }

      // Verifica natureza da mercadoria (Select)
      const naturezaMercadoria = document.getElementById("naturezaMercadoria");
      if (naturezaMercadoria.value == "") {
        void naturezaMercadoria.offsetWidth;
        naturezaMercadoria.classList.add("erro-input");
      }

      // Verifica se valor da NF é menor/igual a zero, nulo ou NaN
      if (valorNfLimpo <= 0 || isNaN(valorNfLimpo) || valorNfLimpo == "") {
        void valorNf.offsetWidth;
        valorNf.classList.add("erro-input");
      }

      // Verifica a quantidade de volumes
      const qtdVolumes = document.getElementById("qtdVolumes");
      if (
        qtdVolumes.value <= 0 ||
        isNaN(qtdVolumes.value) ||
        qtdVolumes.value == ""
      ) {
        void qtdVolumes.offsetWidth;
        qtdVolumes.classList.add("erro-input");
      }

      // Verifica o peso real
      if (pesoLimpo <= 0 || isNaN(pesoLimpo) || pesoLimpo == "") {
        void pesoReal.offsetWidth;
        pesoReal.classList.add("erro-input");
      }

      // Validação das linhas de cubagem geradas dinamicamente
      const containerCubagem = document.getElementById("containerCubagem");
      const totalLinhas = containerCubagem.querySelectorAll(".coluna-cubagem");

      totalLinhas.forEach((linha) => {
        const comprimento = linha.querySelector(".input-comprimento");
        const largura = linha.querySelector(".input-largura");
        const altura = linha.querySelector(".input-altura");

        if (comprimento.value <= 0) comprimento.classList.add("erro-input");
        if (largura.value <= 0) largura.classList.add("erro-input");
        if (altura.value <= 0) altura.classList.add("erro-input");
      });

      // --- Tratamento de Erros e Submit Final ---

      // Se houver algum erro, rola a tela suavemente até o primeiro campo inválido e foca nele
      const primeiroErro = document.querySelector(".erro-input");
      if (primeiroErro) {
        primeiroErro.scrollIntoView({ behavior: "smooth", block: "center" });
        primeiroErro.focus();
        return; // Interrompe o envio
      }

      // Se passou por todas as validações com sucesso
      alert("Formulario enviado");
    });
  }

  // ================================================================================ //
  // CAMPO DINAMICO QUE FICA OCULTO E APARECEM EM SEGUIDA                             //
  // ================================================================================ //

  const grupoEscondidoSolicitante = document.getElementById('grupoEscondidoSolicitante')

  //Verifica se pode aparecer o campo que pergunta papel do solicitante
  solicitanteDoc.addEventListener('blur', () => {
    const cnpjSolicitante = maskSolicitante.unmaskedValue

    //Aqui verifica se o cnpj tem 14 caracteres
    if (cnpjSolicitante.length !== 14) return

    //Abre div escondida para selecionar o papel do solicitante
    grupoEscondidoSolicitante.classList.add('visivel')
  })

  // ================================================================================ //
  // CLIQUE ONDE É DEFINIDO O PAPEL DO SOLICITANTE                                    //
  // ================================================================================ //

  //Verifica o botão clicado no grupo que solicita o papel do solicitante
  grupoEscondidoSolicitante.addEventListener('click', (evento) => {

    //Se clicou no destinatario
    if (evento.target.value == 'destinatario') {

      //Verifica se o valor do remetente é igual a do solicitante
      if (maskRemetente.unmaskedValue == maskSolicitante.unmaskedValue) {

        //se for igual ele vai limpar
        maskRemetente.value = ""
      }

      //Ativa o campo remetente caso tiver desativado
      if (remetenteDoc.readOnly == true) {
        remetenteDoc.readOnly = false
      }

      //Coloca o valor do solicitante no destinatario
      maskDestinatario.value = solicitanteDoc.value

      //Desativa o campo destinatario
      destinatarioDoc.readOnly = true

      limparEndColeta()

      readOnlyEndColeta(false)
    }


    //Se clicou no remetente
    if (evento.target.value == 'remetente') {

      //Verifica se o valor do destinatario é igual a do solicitante
      if (maskDestinatario.unmaskedValue == maskSolicitante.unmaskedValue) {

        //se for igual ele vai limpar
        maskDestinatario.value = ""
      }

      //Ativa o campo destinatario caso tiver desativado
      if (destinatarioDoc.readOnly == true) {
        destinatarioDoc.readOnly = false
      }

      //Coloca o valor do solicitante no remetente
      maskRemetente.value = solicitanteDoc.value

      //Faz a requisição da api para preencher campo de endereço de coleta
      verificarEndRemetente()

      //Desativa o campo remetente
      remetenteDoc.readOnly = true

    }

    if (evento.target.value == 'outros') {

      //Ativa o campo destinatario caso tiver desativado
      if (destinatarioDoc.readOnly == true) {
        destinatarioDoc.readOnly = false
      }

      //Ativa o campo remetente caso tiver desativado
      if (remetenteDoc.readOnly == true) {
        remetenteDoc.readOnly = false
      }

      //Confere o campo de coleta (especificamente pelo cep), e se tiver algo ele limpa tudo
      if (maskCep.value.trim() != "") {

        console.log("Vestigios de dados no campo de coleta, limpando...")

        readOnlyEndColeta(false)
        limparEndColeta()
      }

      //Verifica se o valor do destinatario é igual a do solicitante
      if (maskDestinatario.unmaskedValue == maskSolicitante.unmaskedValue) {

        //se for igual ele vai limpar
        maskDestinatario.value = ""
      }

      //Verifica se o valor do remetente é igual a do solicitante
      if (maskRemetente.unmaskedValue == maskSolicitante.unmaskedValue) {

        //se for igual ele vai limpar
        maskRemetente.value = ""
      }


    }
  })

  // ========================================================================= //
  //             LÓGICA DINÂMICA: ADICIONAR/REMOVER LINHAS DE CUBAGEM          //
  // ========================================================================= //

  const qtdVolumes = document.getElementById("qtdVolumes");

  if (qtdVolumes) {
    // Bloqueia fisicamente as teclas indesejadas no campo de volumes no momento exato do clique
    qtdVolumes.addEventListener("keydown", (evento) => {
      if (evento.key === "-" || evento.key === "." || evento.key === ",") {
        evento.preventDefault(); // Impede o sinal de menos, ponto ou vírgula antes de aparecer
      }
    });

    // Quando digita algo dentro do input
    qtdVolumes.addEventListener("input", () => {
      // Regra de segurança: ignora se não for número ou se for maior/igual a 100
      if (isNaN(qtdVolumes.value) || qtdVolumes.value >= 100) return;

      const containerCubagem = document.getElementById("containerCubagem");
      let totalLinhas = containerCubagem.querySelectorAll(".coluna-cubagem");
      let totalLinhasInvertidas = Array.from(totalLinhas).reverse();

      // Adiciona linhas de cubagens caso a quantidade solicitada seja maior que as atuais
      if (qtdVolumes.value >= totalLinhas.length) {
        // CORREÇÃO LOGÍSTICA: Adiciona apenas a diferença exata para não multiplicar infinitamente
        const linhasQueFaltam = qtdVolumes.value - totalLinhas.length;

        for (let i = 0; i < linhasQueFaltam; i++) {
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
          </div>
          `;

          // Injeta o HTML novo no final da lista dentro do container
          containerCubagem.insertAdjacentHTML("beforeend", novaLinhaHTML);

          // BLINDAGEM AUTOMÁTICA: Aplica a máscara IMask na linha que ACABA de ser criada
          const linhasAgora = containerCubagem.querySelectorAll(".coluna-cubagem");
          const ultimaLinhaCriada = linhasAgora[linhasAgora.length - 1];

          blindarInputCubagem(ultimaLinhaCriada.querySelector(".input-comprimento"));
          blindarInputCubagem(ultimaLinhaCriada.querySelector(".input-largura"));
          blindarInputCubagem(ultimaLinhaCriada.querySelector(".input-altura"));
        }
      }

      // Atualiza a NodeList de linhas antes de tentar remover (necessário após adicionar)
      totalLinhas = containerCubagem.querySelectorAll(".coluna-cubagem");
      totalLinhasInvertidas = Array.from(totalLinhas).reverse();

      // Apaga as linhas (de baixo para cima) caso qtdVolumes for menor
      if (totalLinhas.length > qtdVolumes.value) {
        totalLinhasInvertidas.forEach((linha) => {
          // Garante que o formulário nunca fique com 0 linhas (preserva no mínimo 1)
          if (containerCubagem.querySelectorAll(".coluna-cubagem").length <= 1) return;

          // Se ainda tivermos mais linhas do que o número desejado, remove a linha atual
          if (containerCubagem.querySelectorAll(".coluna-cubagem").length > qtdVolumes.value) {
            linha.remove();
          }
        });
      }

      // Caso a qtd de volumes for apagada (ficar vazia), limpar tudo exceto a primeira linha
      if (qtdVolumes.value == "") {
        totalLinhas.forEach(linha => {
          if (containerCubagem.querySelectorAll(".coluna-cubagem").length <= 1) return;
          linha.remove();
        });
      }
    });
  }
});