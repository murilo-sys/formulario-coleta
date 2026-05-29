// js/validacao.js
import { state } from './estado.js';

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
      const cnpjSolicitante = state.maskSolicitante ? state.maskSolicitante.unmaskedValue : "";
      const documentoRemetente = state.maskRemetente ? state.maskRemetente.unmaskedValue : "";
      const documentoDestinatario = state.maskDestinatario ? state.maskDestinatario.unmaskedValue : "";
      const cepLimpo = state.maskCep ? state.maskCep.unmaskedValue : "";
      const pesoLimpo = state.maskPeso ? state.maskPeso.unmaskedValue : "";
      const valorNfLimpo = state.maskValor ? state.maskValor.unmaskedValue : "";

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

      // Regex que não permite números
      const regexNome = /^[a-zA-ZÀ-ÿ\s]+$/;

      if (solicitanteNome && (solicitanteNome.value.trim() === "" || !regexNome.test(solicitanteNome.value))) {
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
      if (state.cep && (state.cep.value.trim() === "" || cepLimpo.length !== 8)) {
        marcarErro(state.cep);
      }
      if (state.logradouro && state.logradouro.value.trim() === "") {
        marcarErro(state.logradouro);
      }
      if (state.numero && state.numero.value.trim() === "") {
        marcarErro(state.numero);
      }
      if (state.bairro && state.bairro.value.trim() === "") {
        marcarErro(state.bairro);
      }
      if (state.cidade && state.cidade.value.trim() === "") {
        marcarErro(state.cidade);
      }
      if (state.estado && state.estado.value.trim() === "") {
        marcarErro(state.estado);
      }

      // Validação do Horário de Funcionamento
      const horarioAbertura = document.getElementById("horarioAbertura");
      const horarioFechamento = document.getElementById("horarioFechamento");

      if (horarioAbertura && horarioAbertura.value === "") {
        marcarErro(horarioAbertura);
      }
      if (horarioFechamento && horarioFechamento.value === "") {
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
      if (naturezaMercadoria.value === "") {
        marcarErro(naturezaMercadoria);
      }

      // Verifica se valor da NF é menor/igual a zero, nulo ou NaN
      if (valorNfLimpo <= 0 || isNaN(valorNfLimpo) || valorNfLimpo === "") {
        marcarErro(valorNf);
      }

      // Verifica a quantidade de volumes
      const qtdVolumes = document.getElementById("qtdVolumes");
      if (
        qtdVolumes.value <= 0 ||
        isNaN(qtdVolumes.value) ||
        qtdVolumes.value === ""
      ) {
        marcarErro(qtdVolumes);
      }

      // Verifica o peso real
      if (pesoLimpo <= 0 || isNaN(pesoLimpo) || pesoLimpo === "") {
        marcarErro(pesoReal);
      }

      // Verifica as observações
      if (observacoes && observacoes.value.trim() === "") {
        marcarErro(observacoes);
      }

      // Validação das linhas de cubagem geradas dinamicamente
      const containerCubagem = document.getElementById("containerCubagem");
      const totalLinhas = containerCubagem.querySelectorAll(".coluna-cubagem");

      totalLinhas.forEach((linha) => {
        const comprimento = inline => linha.querySelector(".input-comprimento");
        const largura = inline => linha.querySelector(".input-largura");
        const altura = inline => linha.querySelector(".input-altura");

        const compInput = comprimento();
        const largInput = largura();
        const altInput = altura();

        if (compInput.value <= 0) compInput.classList.add("erro-input");
        if (largInput.value <= 0) largInput.classList.add("erro-input");
        if (altInput.value <= 0) altInput.classList.add("erro-input");
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
