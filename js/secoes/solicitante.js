// js/secoes/solicitante.js
import { state } from '../state.js';
import { verificarEndRemetente, limparEndColeta, preencherEndColeta, abrirDialogConfirmacao } from './endereco.js';
import { DocValido } from '../utils/utils.js';
import { consultarEmpresaPorCnpj } from '../api/api.js';
import { avisoCadastro } from './avisoCadastro.js';

document.addEventListener("DOMContentLoaded", () => {
  const solicitanteDoc = document.getElementById("solicitanteDoc");
  const remetenteDoc = document.getElementById("remetenteDoc");
  const destinatarioDoc = document.getElementById("destinatarioDoc");
  const grupoEscondidoSolicitante = document.getElementById('grupoEscondidoSolicitante');

  // Helper para resetar os campos dependentes na falha/mudança de solicitante (Furo 5)
  function resetaCamposDependentes() {
    const radios = document.querySelectorAll('input[name="tipoSolicitante"]');
    radios.forEach(r => r.checked = false);

    remetenteDoc.readOnly = true;
    destinatarioDoc.readOnly = true;

    state.maskRemetente.value = "";
    state.maskDestinatario.value = "";

    limparEndColeta();

    // Reseta flags de verificação
    state.cnpjRemetenteConfirmado = "";
    state.cnpjRemetenteConsultado = "";
    state.remetenteEndereco = null;
    state.remetenteVerificado = false;

    state.destinatarioVerificado = false;
    state.destinatarioCnpjVerificado = "";
    state.destinatarioEndereco = null;

    // Limpa a tag de cidade/estado do Destinatário
    const elCidadeEstadoDest = document.getElementById("cidadeEstadoDestinatario");
    if (elCidadeEstadoDest) {
      elCidadeEstadoDest.textContent = "";
      elCidadeEstadoDest.classList.add("oculto");
    }
  }

  // Helper para sobrepor e preencher os dados dependendo do papel ativo (Furo 2, 5 e 6)
  // NOTA: Não limpamos a confirmação em cache (state.cnpjRemetenteConfirmado) ao alternar para evitar re-confirmações repetitivas.
  function aplicarPapelSolicitante(valor) {
    const docSolicitante = state.maskSolicitante.value;
    const docSolicitanteLimpo = state.maskSolicitante.unmaskedValue;

    if (valor === 'destinatario') {
      if (state.maskRemetente.unmaskedValue === docSolicitanteLimpo) {
        state.maskRemetente.value = "";
        limparEndColeta();
      }

      remetenteDoc.readOnly = false;

      state.maskDestinatario.value = docSolicitante;
      destinatarioDoc.readOnly = true;

      state.destinatarioVerificado = true;
      state.destinatarioCnpjVerificado = docSolicitanteLimpo;
      state.destinatarioEndereco = state.solicitanteEndereco;

      // Mostra a tag de cidade/estado do Destinatário
      const elCidadeEstado = document.getElementById("cidadeEstadoDestinatario");
      if (elCidadeEstado && state.solicitanteEndereco?.city) {
        const cidadeNome = state.solicitanteEndereco.city.name || "-";
        const estadoSigla = state.solicitanteEndereco.city.state?.code || "-";
        elCidadeEstado.innerHTML = `🏢 ${cidadeNome} / ${estadoSigla}`;
        elCidadeEstado.classList.remove("oculto");
      }
    }

    if (valor === 'remetente') {
      if (state.maskDestinatario.unmaskedValue === docSolicitanteLimpo) {
        state.maskDestinatario.value = "";
        state.destinatarioVerificado = false;
        state.destinatarioCnpjVerificado = "";
        state.destinatarioEndereco = null;

        const elCidadeEstado = document.getElementById("cidadeEstadoDestinatario");
        if (elCidadeEstado) {
          elCidadeEstado.textContent = "";
          elCidadeEstado.classList.add("oculto");
        }
      }

      destinatarioDoc.readOnly = false;

      state.maskRemetente.value = docSolicitante;
      remetenteDoc.readOnly = true;

      state.cnpjRemetenteConsultado = docSolicitanteLimpo;
      state.remetenteEndereco = state.solicitanteEndereco;
      state.remetenteVerificado = true;

      // Furo 6: Exibe modal de confirmação para o novo endereço do Solicitante que virou Remetente
      if (state.cnpjRemetenteConfirmado && docSolicitanteLimpo === state.cnpjRemetenteConfirmado) {
        preencherEndColeta();
      } else {
        abrirDialogConfirmacao(state.solicitanteEndereco);
      }
    }

    if (valor === 'outros') {
      destinatarioDoc.readOnly = false;
      remetenteDoc.readOnly = false;

      if (state.maskDestinatario.unmaskedValue === docSolicitanteLimpo) {
        state.maskDestinatario.value = "";
        state.destinatarioVerificado = false;
        state.destinatarioCnpjVerificado = "";
        state.destinatarioEndereco = null;

        const elCidadeEstado = document.getElementById("cidadeEstadoDestinatario");
        if (elCidadeEstado) {
          elCidadeEstado.textContent = "";
          elCidadeEstado.classList.add("oculto");
        }
      }

      if (state.maskRemetente.unmaskedValue === docSolicitanteLimpo) {
        state.maskRemetente.value = "";
        limparEndColeta();
      }
    }
  }

  // Evento Blur do Solicitante para validar na hora (Furo 3, 4, 5 e 6)
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

    // Furo 3: Se for Pessoa Física (CPF), abre o aviso de suporte e bloqueia o fluxo
    if (docSolicitante.length === 11) {
      avisoCadastro("Pessoa Física");

      state.solicitanteVerificado = false;
      state.cnpjSolicitanteConsultado = docSolicitante;
      state.solicitanteEndereco = null;
      grupoEscondidoSolicitante.classList.remove('visivel');

      resetaCamposDependentes();
      return;
    }

    // Furo 4: Se for CNPJ, faz a busca na API
    try {
      const endereco = await consultarEmpresaPorCnpj(docSolicitante);

      state.cnpjSolicitanteConsultado = docSolicitante;
      state.solicitanteEndereco = endereco;

      if (!endereco) {
        avisoCadastro("Solicitante");
        
        state.solicitanteVerificado = false;
        grupoEscondidoSolicitante.classList.remove('visivel');
        
        resetaCamposDependentes();
        return;
      }

      // Validação com sucesso
      state.solicitanteVerificado = true;
      grupoEscondidoSolicitante.classList.add('visivel');

      // Se já houver um rádio ativado, aplica a sobreposição (Furo 2 e 5)
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

    verificarEndRemetente();
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
