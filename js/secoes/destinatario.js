import { state } from '../state.js';
import { verificarCnpj } from '../utils/utils.js';
import { consultarEmpresaPorCnpj } from '../api/api.js';
import { avisoCadastro } from './avisoCadastro.js';

const destinatarioDoc = document.getElementById('destinatarioDoc');

function exibirCidadeEstadoDestinatario(endereco) {
  const cidadeEstadoDestinatario = document.getElementById('cidadeEstadoDestinatario');
  const elRazaoSocial = document.getElementById("razaoSolicitanteDestinatario");
  if (elRazaoSocial) {
    const razaoSocial = endereco?.razaoSocial || "";
    if (razaoSocial) {
      elRazaoSocial.innerHTML = `🏢 ${razaoSocial}`;
      elRazaoSocial.classList.remove("oculto");
    } else {
      elRazaoSocial.classList.add("oculto");
    }
  }
  if (cidadeEstadoDestinatario && endereco?.city) {
    const cidadeNome = endereco.city.name || "-";
    const estadoSigla = endereco.city.state?.code || "-";
    cidadeEstadoDestinatario.innerHTML = `📍 ${cidadeNome} / ${estadoSigla}`;
    cidadeEstadoDestinatario.classList.remove('oculto');
  }
}

function limparCidadeEstadoDestinatario() {
  const cidadeEstadoDestinatario = document.getElementById('cidadeEstadoDestinatario');
  const elRazaoSocial = document.getElementById("razaoSolicitanteDestinatario");
  if (cidadeEstadoDestinatario) {
    cidadeEstadoDestinatario.textContent = "";
    cidadeEstadoDestinatario.classList.add('oculto');
  }
  if (elRazaoSocial) {
    elRazaoSocial.textContent = "";
    elRazaoSocial.classList.add('oculto');
  }
}

destinatarioDoc.addEventListener('blur', async () => {
  try {
    const destinatarioDocLimpo = state.maskDestinatario.unmaskedValue;

    // Se o campo estiver vazio, apenas reseta os estados e limpa o campo de cidade/estado
    if (destinatarioDocLimpo === "") {
      state.destinatarioVerificado = false;
      state.destinatarioCnpjVerificado = "";
      state.destinatarioEndereco = null;
      limparCidadeEstadoDestinatario();
      return;
    }

    // 1. Verifica se é um CNPJ válido (14 dígitos) antes de qualquer outra lógica
    if (!verificarCnpj(destinatarioDocLimpo)) {
      return;
    }

    // 2. Certifica que ele não foi verificado antes (seja com sucesso ou com falha)
    if (state.destinatarioCnpjVerificado === destinatarioDocLimpo) {
      if (state.destinatarioVerificado === false) {
        avisoCadastro("Destinatário");
        if (state.maskDestinatario) {
          state.maskDestinatario.value = "";
        }
        state.destinatarioCnpjVerificado = "";
        return;
      }
      // Restaura a exibição visual da tag se estiver preenchido com sucesso
      exibirCidadeEstadoDestinatario(state.destinatarioEndereco);
      return;
    }

    state.destinatarioVerificado = false;
    state.destinatarioEndereco = null;

    // Puxa as informações dele da API
    const destinatarioInfos = await consultarEmpresaPorCnpj(destinatarioDocLimpo);

    // Registra a verificação do CNPJ atual (mesmo que tenha falhado)
    state.destinatarioCnpjVerificado = destinatarioDocLimpo;
    state.destinatarioEndereco = destinatarioInfos;

    if (!destinatarioInfos) {
      avisoCadastro("Destinatário");
      if (state.maskDestinatario) {
        state.maskDestinatario.value = "";
      }
      state.destinatarioCnpjVerificado = "";
      return;
    }

    exibirCidadeEstadoDestinatario(destinatarioInfos);
    state.destinatarioVerificado = true;
  } catch (error) {
    // Silencia o erro para manter console limpo
  }
});

// Listener do Evento de Alteração de Papel do Solicitante
document.addEventListener('solicitante:papel-alterado', (e) => {
  const { papel, doc, docLimpo, endereco } = e.detail;

  if (papel === 'destinatario') {
    state.maskDestinatario.value = doc;
    destinatarioDoc.readOnly = true;

    state.destinatarioVerificado = true;
    state.destinatarioCnpjVerificado = docLimpo;
    state.destinatarioEndereco = endereco;

    exibirCidadeEstadoDestinatario(endereco);
  } else {
    // Se mudou para remetente ou outros, e o destinatario era o solicitante, limpa o destinatário
    if (state.maskDestinatario.unmaskedValue === docLimpo) {
      state.maskDestinatario.value = "";
      state.destinatarioVerificado = false;
      state.destinatarioCnpjVerificado = "";
      state.destinatarioEndereco = null;
      limparCidadeEstadoDestinatario();
    }
    destinatarioDoc.readOnly = false;
  }
});

// Listener do Evento de Reset do Solicitante
document.addEventListener('solicitante:reset', () => {
  destinatarioDoc.readOnly = true;
  state.maskDestinatario.value = "";
  state.destinatarioVerificado = false;
  state.destinatarioCnpjVerificado = "";
  state.destinatarioEndereco = null;
  limparCidadeEstadoDestinatario();
});
