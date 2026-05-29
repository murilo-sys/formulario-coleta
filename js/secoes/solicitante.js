// js/secoes/solicitante.js
import { state } from '../state.js';
import { verificarEndRemetente, limparEndColeta } from './endereco.js';
import { DocValido } from '../utils/utils.js';

document.addEventListener("DOMContentLoaded", () => {
  const solicitanteDoc = document.getElementById("solicitanteDoc");
  const remetenteDoc = document.getElementById("remetenteDoc");
  const destinatarioDoc = document.getElementById("destinatarioDoc");
  const grupoEscondidoSolicitante = document.getElementById('grupoEscondidoSolicitante');

  // Verifica se pode aparecer o campo que pergunta papel do solicitante
  solicitanteDoc.addEventListener('blur', () => {
    const cnpjSolicitante = state.maskSolicitante.unmaskedValue;

    // Aqui verifica se o cnpj tem 14 caracteres
    if (cnpjSolicitante.length !== 14) return;

    // Abre div escondida para selecionar o papel do solicitante
    grupoEscondidoSolicitante.classList.add('visivel');
  });

  // Consulta o endereço do remetente caso o documento seja digitado manualmente ("no pelo")
  remetenteDoc.addEventListener('blur', () => {
    const cnpjRemetente = state.maskRemetente.unmaskedValue;

    // Verifica se é um CNPJ (14 dígitos)
    if (cnpjRemetente.length !== 14) return;

    // Faz a consulta na API e exibe o popup de confirmação
    verificarEndRemetente();
  });

  // Lógica de alternância do papel do solicitante utilizando o evento 'change' nos rádios
  const radiosSolicitante = document.querySelectorAll('input[name="tipoSolicitante"]');
  radiosSolicitante.forEach(radio => {
    radio.addEventListener('change', (evento) => {
      const valor = evento.target.value;

      if (valor === 'destinatario') {
        // Verifica se o valor do remetente é igual a do solicitante
        if (state.maskRemetente.unmaskedValue === state.maskSolicitante.unmaskedValue) {
          state.maskRemetente.value = "";
        }

        // Ativa o campo remetente caso tiver desativado
        if (remetenteDoc.readOnly === true) {
          remetenteDoc.readOnly = false;
        }

        // Coloca o valor do solicitante no destinatario
        state.maskDestinatario.value = solicitanteDoc.value;

        // Desativa o campo destinatario
        destinatarioDoc.readOnly = true;

        limparEndColeta();
      }

      if (valor === 'remetente') {
        // Verifica se o valor do destinatario é igual a do solicitante
        if (state.maskDestinatario.unmaskedValue === state.maskSolicitante.unmaskedValue) {
          state.maskDestinatario.value = "";
        }

        // Ativa o campo destinatario caso tiver desativado
        if (destinatarioDoc.readOnly === true) {
          destinatarioDoc.readOnly = false;
        }

        // Coloca o valor do solicitante no remetente
        state.maskRemetente.value = solicitanteDoc.value;

        // Faz a requisição da api para preencher campo de endereço de coleta
        verificarEndRemetente();

        // Desativa o campo remetente
        remetenteDoc.readOnly = true;
      }

      if (valor === 'outros') {
        // Ativa o campo destinatario caso tiver desativado
        if (destinatarioDoc.readOnly === true) {
          destinatarioDoc.readOnly = false;
        }

        // Ativa o campo remetente caso tiver desativado
        if (remetenteDoc.readOnly === true) {
          remetenteDoc.readOnly = false;
        }

        // Confere o campo de coleta (especificamente pelo cep), e se tiver algo ele limpa tudo
        if (state.maskCep.unmaskedValue.trim() !== "" && state.maskCep.unmaskedValue.trim() === state.remetenteEndereco?.postalCode) {
          console.log("Vestigios de dados do remetente no campo de coleta, limpando...");
          limparEndColeta();
        }

        // Verifica se o valor do destinatario é igual a do solicitante
        if (state.maskDestinatario.unmaskedValue === state.maskSolicitante.unmaskedValue) {
          state.maskDestinatario.value = "";
        }

        // Verifica se o valor do remetente é igual a do solicitante
        if (state.maskRemetente.unmaskedValue === state.maskSolicitante.unmaskedValue) {
          state.maskRemetente.value = "";
        }
      }
    });
  });
});

// Executa as validações da seção do solicitante
export function validarSolicitante(marcarErro) {
  let valido = true;

  const solicitanteNome = document.getElementById("solicitanteNome");
  const solicitanteDoc = document.getElementById("solicitanteDoc");
  const remetenteDoc = document.getElementById("remetenteDoc");
  const destinatarioDoc = document.getElementById("destinatarioDoc");

  const cnpjSolicitante = state.maskSolicitante ? state.maskSolicitante.unmaskedValue : "";
  const documentoRemetente = state.maskRemetente ? state.maskRemetente.unmaskedValue : "";
  const documentoDestinatario = state.maskDestinatario ? state.maskDestinatario.unmaskedValue : "";

  // Regex que não permite números
  const regexNome = /^[a-zA-ZÀ-ÿ\s]+$/;

  if (solicitanteNome && (solicitanteNome.value.trim() === "" || !regexNome.test(solicitanteNome.value))) {
    marcarErro(solicitanteNome);
    valido = false;
  }

  if (!DocValido(cnpjSolicitante)) {
    marcarErro(solicitanteDoc);
    valido = false;
  }

  if (!DocValido(documentoRemetente)) {
    marcarErro(remetenteDoc);
    valido = false;
  }

  if (!DocValido(documentoDestinatario)) {
    marcarErro(destinatarioDoc);
    valido = false;
  }

  return valido;
}
