import { state } from '../state.js';
import { verificarCnpj } from '../utils/utils.js';
import { consultarEmpresaPorCnpj } from '../api/api.js'
import { avisoCadastro } from './avisoCadastro.js'

const destinatarioDoc = document.getElementById('destinatarioDoc')

destinatarioDoc.addEventListener('blur', async () => {

  try {
    const destinatarioDocLimpo = state.maskDestinatario.unmaskedValue;

    // Se o campo estiver vazio, apenas reseta os estados e limpa o campo de cidade/estado
    if (destinatarioDocLimpo === "") {
      state.destinatarioVerificado = false;
      state.destinatarioCnpjVerificado = "";
      const cidadeEstadoDestinatario = document.getElementById('cidadeEstadoDestinatario');
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
        return;
      }
      return;
    }

    state.destinatarioVerificado = false;

    // Puxa as informações dele da API
    const destinatarioInfos = await consultarEmpresaPorCnpj(destinatarioDocLimpo);

    // Registra a verificação do CNPJ atual (mesmo que tenha falhado)
    state.destinatarioCnpjVerificado = destinatarioDocLimpo;

    if (!destinatarioInfos) {
      avisoCadastro("Destinatário");
      return;
    }

    state.destinatarioVerificado = true;
  } catch (error) {
    // Silencia o erro para manter console limpo
  }

})
