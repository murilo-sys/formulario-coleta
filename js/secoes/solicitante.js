// js/secoes/solicitante.js
import { state } from '../state.js';
import { DocValido } from '../utils/utils.js';
import { consultarEmpresaPorCnpj } from '../api/api.js';
import { avisoCadastro } from './avisoCadastro.js';

document.addEventListener("DOMContentLoaded", () => {
  const solicitanteDoc = document.getElementById("solicitanteDoc");
  const remetenteDoc = document.getElementById("remetenteDoc");
  const grupoEscondidoSolicitante = document.getElementById('grupoEscondidoSolicitante');

  // Helper para resetar os campos dependentes na falha/mudança de solicitante
  function resetaCamposDependentes() {
    const radios = document.querySelectorAll('input[name="tipoSolicitante"]');
    radios.forEach(r => r.checked = false);

    // Reseta flags de verificação relacionadas ao solicitante
    state.cnpjRemetenteConfirmado = "";
    state.cnpjRemetenteConsultado = "";
    state.remetenteEndereco = null;
    state.remetenteVerificado = false;

    state.destinatarioVerificado = false;
    state.destinatarioCnpjVerificado = "";
    state.destinatarioEndereco = null;

    // Dispara evento de reset para que as outras seções limpem seus DOMs e máscaras
    document.dispatchEvent(new CustomEvent('solicitante:reset'));
  }

  // Helper para disparar alteração de papel ativo
  function aplicarPapelSolicitante(valor) {
    const docSolicitante = state.maskSolicitante.value;
    const docSolicitanteLimpo = state.maskSolicitante.unmaskedValue;

    // Dispara evento customizado para que destinatario e endereco escutem e atualizem a UI
    document.dispatchEvent(new CustomEvent('solicitante:papel-alterado', {
      detail: {
        papel: valor,
        doc: docSolicitante,
        docLimpo: docSolicitanteLimpo,
        endereco: state.solicitanteEndereco
      }
    }));
  }

  // Evento Blur do Solicitante para validar na hora
  solicitanteDoc.addEventListener('blur', async () => {
    const docSolicitante = state.maskSolicitante ? state.maskSolicitante.unmaskedValue : "";

    // Se o documento estiver vazio ou com tamanho inválido (nem 11 nem 14), limpa tudo
    if (docSolicitante === "" || (docSolicitante.length !== 11 && docSolicitante.length !== 14)) {
      state.solicitanteVerificado = false;
      state.cnpjSolicitanteConsultado = "";
      state.solicitanteEndereco = null;
      grupoEscondidoSolicitante.classList.remove('visivel');
      resetaCamposDependentes();
      return;
    }

    // Se o documento já foi consultado e deu certo, apenas exibe a div de opções e retorna
    if (state.solicitanteVerificado && state.cnpjSolicitanteConsultado === docSolicitante) {
      grupoEscondidoSolicitante.classList.add('visivel');
      return;
    }

    // Se for Pessoa Física (CPF), abre o aviso de suporte e bloqueia o fluxo
    if (docSolicitante.length === 11) {
      avisoCadastro("Pessoa Física");
      if (state.maskSolicitante) {
        state.maskSolicitante.value = "";
      }

      state.solicitanteVerificado = false;
      state.cnpjSolicitanteConsultado = "";
      state.solicitanteEndereco = null;
      grupoEscondidoSolicitante.classList.remove('visivel');

      resetaCamposDependentes();
      return;
    }

    // Se for CNPJ, faz a busca na API
    try {
      const endereco = await consultarEmpresaPorCnpj(docSolicitante);

      state.cnpjSolicitanteConsultado = docSolicitante;
      state.solicitanteEndereco = endereco;

      if (!endereco) {
        avisoCadastro("Solicitante");
        if (state.maskSolicitante) {
          state.maskSolicitante.value = "";
        }
        
        state.solicitanteVerificado = false;
        state.cnpjSolicitanteConsultado = "";
        grupoEscondidoSolicitante.classList.remove('visivel');
        
        resetaCamposDependentes();
        return;
      }

      // Validação com sucesso
      state.solicitanteVerificado = true;
      grupoEscondidoSolicitante.classList.add('visivel');

      // Se já houver um rádio ativado, aplica a sobreposição
      const radioAtivo = document.querySelector('input[name="tipoSolicitante"]:checked');
      if (radioAtivo) {
        aplicarPapelSolicitante(radioAtivo.value);
      }

    } catch (error) {
      // Silencia o erro para manter console limpo
    }
  });

  // Consulta o endereço do remetente caso o documento seja digitado manualmente
  remetenteDoc.addEventListener('blur', () => {
    const cnpjRemetente = state.maskRemetente.unmaskedValue;

    if (cnpjRemetente.length !== 14) return;

    // Dispara evento para o endereço verificar o CNPJ remetente
    document.dispatchEvent(new CustomEvent('remetente:cnpj-blur'));
  });

  // Lógica de alternância do papel do solicitante utilizando o evento 'change' nos rádios
  const radiosSolicitante = document.querySelectorAll('input[name="tipoSolicitante"]');
  radiosSolicitante.forEach(radio => {
    radio.addEventListener('change', (evento) => {
      aplicarPapelSolicitante(evento.target.value);
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

  const regexNome = /^[a-zA-ZÀ-ÿ\s]+$/;

  if (solicitanteNome && (solicitanteNome.value.trim() === "" || !regexNome.test(solicitanteNome.value))) {
    marcarErro(solicitanteNome);
    valido = false;
  }

  if (!DocValido(cnpjSolicitante) || state.solicitanteVerificado !== true) {
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

  // BLINDAGEM DE SEGURANÇA:
  // Se o remetente for CNPJ, ele deve estar verificado e o CNPJ atual no input deve corresponder ao confirmado
  if (documentoRemetente.length === 14) {
    if (state.cnpjRemetenteConfirmado !== documentoRemetente) {
      marcarErro(remetenteDoc);
      valido = false;
    }
  }

  // Se o destinatário for CNPJ, ele deve estar verificado
  if (documentoDestinatario.length === 14) {
    if (state.destinatarioVerificado !== true || state.destinatarioCnpjVerificado !== documentoDestinatario) {
      marcarErro(destinatarioDoc);
      valido = false;
    }
  }

  return valido;
}
