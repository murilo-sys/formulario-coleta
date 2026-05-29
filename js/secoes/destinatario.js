import { state } from '../state.js';
import { verificarCnpj } from '../utils/utils.js';
import { consultarEmpresaPorCnpj } from '../api/api.js';
import { avisoCadastro } from './avisoCadastro.js';

const destinatarioDoc = document.getElementById('destinatarioDoc');

destinatarioDoc.addEventListener('blur', async () => {
  try {
    const destinatarioDocLimpo = state.maskDestinatario.unmaskedValue;
    const cidadeEstadoDestinatario = document.getElementById('cidadeEstadoDestinatario');

    // Se o campo estiver vazio, apenas reseta os estados e limpa o campo de cidade/estado
    if (destinatarioDocLimpo === "") {
      state.destinatarioVerificado = false;
      state.destinatarioCnpjVerificado = "";
      state.destinatarioEndereco = null;
      if (cidadeEstadoDestinatario) {
        cidadeEstadoDestinatario.textContent = "";
        cidadeEstadoDestinatario.classList.add('oculto');
      }
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
      if (cidadeEstadoDestinatario && state.destinatarioEndereco?.city) {
        const cidadeNome = state.destinatarioEndereco.city.name || "-";
        const estadoSigla = state.destinatarioEndereco.city.state?.code || "-";
        const razaoSocial = state.destinatarioEndereco.razaoSocial || "";
        const prefixoNome = razaoSocial ? `${razaoSocial} | ` : "";
        cidadeEstadoDestinatario.innerHTML = `🏢 ${prefixoNome}${cidadeNome} / ${estadoSigla}`;
        cidadeEstadoDestinatario.classList.remove('oculto');
      }
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

    // Preenche cidade e estado no elemento HTML correspondente para feedback visual
    if (cidadeEstadoDestinatario && destinatarioInfos.city) {
      const cidadeNome = destinatarioInfos.city.name || "-";
      const estadoSigla = destinatarioInfos.city.state?.code || "-";
      const razaoSocial = destinatarioInfos.razaoSocial || "";
      const prefixoNome = razaoSocial ? `${razaoSocial} | ` : "";
      cidadeEstadoDestinatario.innerHTML = `🏢 ${prefixoNome}${cidadeNome} / ${estadoSigla}`;
      cidadeEstadoDestinatario.classList.remove('oculto');
    }

    state.destinatarioVerificado = true;
  } catch (error) {
    // Silencia o erro para manter console limpo
  }
});
