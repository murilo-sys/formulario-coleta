// js/validacao.js
document.addEventListener("DOMContentLoaded", () => {
  const formulario = document.querySelector(".formularioColeta");
  const solicitanteNome = document.getElementById("solicitanteNome");
  const solicitanteDoc = document.getElementById("solicitanteDoc");
  const remetenteDoc = document.getElementById("remetenteDoc");
  const destinatarioDoc = document.getElementById("destinatarioDoc");
  const pesoReal = document.getElementById("pesoReal");
  const valorNf = document.getElementById("valorNf");
  const observacoes = document.getElementById("observacoes");

  // ========================================================================= //
  //                           VALIDAÇÃO E ENVIO DO FORMULÁRIO                 //
  // ========================================================================= //

  if (formulario) {
    // Evento para limpar a classe de erro assim que o usuário começar a digitar/selecionar
    formulario.addEventListener("input", (evento) => {
      if (
        evento.target.tagName === "INPUT" ||
        evento.target.tagName === "SELECT"
      ) {
        evento.target.classList.remove("erro-input");
      }

      // Limpa o erro do container de rádio de almoço ao selecionar uma das opções
      if (evento.target.name === "horarioAlmoco") {
        const grupoRadioAlmoco = document.querySelector(".grupo-radio-almoco");
        if (grupoRadioAlmoco) {
          grupoRadioAlmoco.classList.remove("erro-input");
        }
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

      // Função reutilizável para aplicar o estilo de erro com animação
      function marcarErro(elemento) {
        if (!elemento) return;
        void elemento.offsetWidth; // Força reflow para reiniciar animações CSS
        elemento.classList.add("erro-input");
      }

      // --- Início das Validações Individuais ---

      //Regex que não permite números
      const regexNome = /^[a-zA-ZÀ-ÿ\s]+$/

      if (solicitanteNome && (solicitanteNome.value.trim() == "" || !regexNome.test(solicitanteNome.value))) {
        marcarErro(solicitanteNome);
      }

      if (!DocValido(cnpjSolicitante)) {
        marcarErro(solicitanteDoc);
      }

      if (!DocValido(documentoRemetente)) {
        marcarErro(remetenteDoc);
      }

      if (!DocValido(documentoDestinatario)) {
        marcarErro(destinatarioDoc);
      }

      // Validação do Endereço de Coleta (exceto complemento)
      if (cep && (cep.value.trim() == "" || cepLimpo.length !== 8)) {
        marcarErro(cep);
      }
      if (logradouro && logradouro.value.trim() == "") {
        marcarErro(logradouro);
      }
      if (numero && numero.value.trim() == "") {
        marcarErro(numero);
      }
      if (bairro && bairro.value.trim() == "") {
        marcarErro(bairro);
      }
      if (cidade && cidade.value.trim() == "") {
        marcarErro(cidade);
      }
      if (estado && estado.value.trim() == "") {
        marcarErro(estado);
      }

      // Validação do Horário de Funcionamento
      const horarioAbertura = document.getElementById("horarioAbertura");
      const horarioFechamento = document.getElementById("horarioFechamento");

      if (horarioAbertura && horarioAbertura.value == "") {
        marcarErro(horarioAbertura);
      }
      if (horarioFechamento && horarioFechamento.value == "") {
        marcarErro(horarioFechamento);
      }
      // Validação cronológica (Abertura não pode ser depois do Fechamento)
      if (horarioAbertura && horarioFechamento && horarioAbertura.value !== "" && horarioFechamento.value !== "") {
        if (horarioAbertura.value >= horarioFechamento.value) {
          marcarErro(horarioAbertura);
          marcarErro(horarioFechamento);
        }
      }

      // Verifica natureza da mercadoria (Select)
      const naturezaMercadoria = document.getElementById("naturezaMercadoria");
      if (naturezaMercadoria.value == "") {
        marcarErro(naturezaMercadoria);
      }

      // Verifica se valor da NF é menor/igual a zero, nulo ou NaN
      if (valorNfLimpo <= 0 || isNaN(valorNfLimpo) || valorNfLimpo == "") {
        marcarErro(valorNf);
      }

      // Verifica a quantidade de volumes
      const qtdVolumes = document.getElementById("qtdVolumes");
      if (
        qtdVolumes.value <= 0 ||
        isNaN(qtdVolumes.value) ||
        qtdVolumes.value == ""
      ) {
        marcarErro(qtdVolumes);
      }

      // Verifica o peso real
      if (pesoLimpo <= 0 || isNaN(pesoLimpo) || pesoLimpo == "") {
        marcarErro(pesoReal);
      }

      //Verifica as observações
      if (observacoes && observacoes.value.trim() == "") {
        marcarErro(observacoes);
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
});
