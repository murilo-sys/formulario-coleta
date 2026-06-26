// js/secoes/endereco.js
import { state } from '../state.js';
import { consultarEmpresaPorCnpj } from '../api/api.js';
import { verificarCnpj } from '../utils/utils.js';
import { avisoCadastro } from './avisoCadastro.js'

const remetenteDoc = document.getElementById("remetenteDoc");

export function preencherResumoRemetente() {
  const elCidadeEstado = document.getElementById("cidadeEstadoRemetente");
  const elRazaoSocial = document.getElementById("razaoSolicitanteRemetente");
  if (state.remetenteEndereco) {
    if (elRazaoSocial) {
      const razaoSocial = state.remetenteEndereco.razaoSocial || "";
      if (razaoSocial) {
        elRazaoSocial.innerHTML = `🏢 ${razaoSocial}`;
        elRazaoSocial.classList.remove("oculto");
      } else {
        elRazaoSocial.classList.add("oculto");
      }
    }
    if (elCidadeEstado && state.remetenteEndereco.city) {
      const cidadeNome = state.remetenteEndereco.city.name || "-";
      const estadoSigla = state.remetenteEndereco.city.state?.code || "-";
      elCidadeEstado.innerHTML = `📍 ${cidadeNome} / ${estadoSigla}`;
      elCidadeEstado.classList.remove("oculto");
    }
  }
}

export async function preencherEndColeta() {
  const cepDoRemetente = state.remetenteEndereco.postalCode || "";
  const cepSomenteNumeros = cepDoRemetente.replace(/\D/g, "");

  if (cepSomenteNumeros.length === 8) {
    try {
      const resValida = await fetch(`/api/validar-cep?cep=${cepSomenteNumeros}`);
      const jsonValida = await resValida.json();
      
      if (jsonValida.valido === false) {
        limparEndColeta(false);
        const dialogCep = document.getElementById("dialogCepNaoAtendido");
        if (dialogCep) dialogCep.showModal();
        return;
      }
    } catch (e) {
      console.error("Erro ao validar CEP do remetente", e);
    }
  }

  // Preenche dados do remetente no destino
  state.maskCep.value = cepDoRemetente;
  state.logradouro.value = state.remetenteEndereco.line1 || "";
  state.numero.value = state.remetenteEndereco.number || "";
  state.complemento.value = state.remetenteEndereco.line2 || "";
  state.bairro.value = state.remetenteEndereco.neighborhood || "";
  state.cidade.value = state.remetenteEndereco.city?.name || "";
  state.estado.value = state.remetenteEndereco.city?.state.code || "";

  // Preenche a cidade e estado resumidos abaixo do CNPJ do remetente
  preencherResumoRemetente();
}

export function limparEndColeta(limparResumo = true) {
  // limpa os campos do endereço
  const campos = [state.maskCep, state.logradouro, state.numero, state.complemento, state.bairro, state.cidade, state.estado];

  // entra em cada campo e não limpa caso tiver algo
  campos.forEach(campo => {
    if (campo) {
      campo.value = "";
    }
  });

  if (limparResumo) {
    // Limpa também o texto resumido de cidade/estado do remetente
    const elCidadeEstado = document.getElementById("cidadeEstadoRemetente");
    const elRazao = document.getElementById("razaoSolicitanteRemetente");
    if (elCidadeEstado) {
      elCidadeEstado.textContent = "";
      elCidadeEstado.classList.add("oculto");
    }
    if (elRazao) {
      elRazao.textContent = "";
      elRazao.classList.add("oculto");
    }
  }
}

// Função de consultar dados do remetente de endereço
export async function verificarEndRemetente() {
  const remetenteDocLimpo = state.maskRemetente.unmaskedValue;

  if (!verificarCnpj(remetenteDocLimpo)) return;

  // 1. Se este CNPJ específico já foi confirmado pelo usuário, preenche direto sem abrir o popup
  if (state.cnpjRemetenteConfirmado && remetenteDocLimpo === state.cnpjRemetenteConfirmado) {
    preencherEndColeta();
    return;
  }

  // 2. Se já buscamos da API, mas o usuário ainda não confirmou, exibe o popup ou o aviso com dados em cache
  if (state.remetenteVerificado && remetenteDocLimpo === state.cnpjRemetenteConsultado) {
    if (state.remetenteEndereco === null) {
      avisoCadastro("Remetente");
      if (state.maskRemetente) {
        state.maskRemetente.value = "";
      }
      state.cnpjRemetenteConsultado = "";
      return;
    }
    abrirDialogConfirmacao(state.remetenteEndereco);
    return;
  }

  try {
    // Consulta os dados do solicitante.
    const endereco = await consultarEmpresaPorCnpj(remetenteDocLimpo);

    // Salva no cache a consulta, mesmo se o resultado for nulo (não cadastrado)
    state.cnpjRemetenteConsultado = remetenteDocLimpo;
    state.remetenteVerificado = true;
    state.remetenteEndereco = endereco;

    // Verifica se os dados existem
    if (!endereco) {
      avisoCadastro("Remetente");
      if (state.maskRemetente) {
        state.maskRemetente.value = "";
      }
      state.cnpjRemetenteConsultado = "";
      return;
    }

    // Abre o modal de confirmação de endereço
    abrirDialogConfirmacao(endereco);
  } catch (error) {
    // Silencia o erro para manter console limpo
  }
}

export function abrirDialogConfirmacao(endereco) {
  const dialog = document.getElementById("dialogConfirmacao");
  if (!dialog) return;

  document.getElementById("dialogLogradouro").textContent = endereco.line1 || "-";
  document.getElementById("dialogNumero").textContent = endereco.number || "-";

  const complemento = endereco.line2;
  const compContainer = document.getElementById("dialogComplementoContainer");
  if (complemento && complemento.trim() !== "") {
    document.getElementById("dialogComplemento").textContent = complemento;
    compContainer.style.display = "flex";
  } else {
    compContainer.style.display = "none";
  }

  document.getElementById("dialogBairro").textContent = endereco.neighborhood || "-";

  const cidadeNome = endereco.city?.name || "-";
  const estadoSigla = endereco.city?.state?.code || "-";
  document.getElementById("dialogCidadeEstado").textContent = `${cidadeNome} / ${estadoSigla}`;

  document.getElementById("dialogCep").textContent = endereco.postalCode || "-";

  dialog.showModal();
}

export function recusarEndereco() {
  // Muda o rádio do solicitante para "Outros" para restaurar os campos
  const radioOutros = document.getElementById("solicitanteOutros");
  if (radioOutros) {
    radioOutros.click();
  }

  // Limpa o remetente
  if (state.maskRemetente) {
    state.maskRemetente.value = "";
  }
  if (remetenteDoc) {
    remetenteDoc.readOnly = false;
  }

  limparEndColeta();
}

// Executa as validações da seção do endereço de coleta
export function validarEndereco(marcarErro) {
  let valido = true;
  const cepLimpo = state.maskCep ? state.maskCep.unmaskedValue : "";

  if (state.cep && (state.cep.value.trim() === "" || cepLimpo.length !== 8)) {
    marcarErro(state.cep);
    valido = false;
  }
  if (state.logradouro && state.logradouro.value.trim() === "") {
    marcarErro(state.logradouro);
    valido = false;
  }
  if (state.numero && state.numero.value.trim() === "") {
    marcarErro(state.numero);
    valido = false;
  }
  if (state.bairro && state.bairro.value.trim() === "") {
    marcarErro(state.bairro);
    valido = false;
  }
  if (state.cidade && state.cidade.value.trim() === "") {
    marcarErro(state.cidade);
    valido = false;
  }
  if (state.estado && state.estado.value.trim() === "") {
    marcarErro(state.estado);
    valido = false;
  }

  return valido;
}

// Configura os escutadores do Dialog de Confirmação e Eventos Customizados
document.addEventListener("DOMContentLoaded", () => {
  const dialog = document.getElementById("dialogConfirmacao");
  const btnConfirmar = document.getElementById("btnDialogConfirmar");
  const btnRecusar = document.getElementById("btnDialogRecusar");

  if (btnConfirmar && dialog) {
    btnConfirmar.addEventListener("click", () => {
      dialog.close();
      preencherEndColeta();

      // Salva o CNPJ que o usuário efetivamente confirmou
      state.cnpjRemetenteConfirmado = state.maskRemetente.unmaskedValue;
    });
  }

  if (btnRecusar && dialog) {
    btnRecusar.addEventListener("click", () => {
      dialog.close();
      
      // Salva o CNPJ como confirmado, mostra o resumo visual (razao/cidade/estado),
      // mas limpa os campos de endereço para o cliente digitar.
      state.cnpjRemetenteConfirmado = state.maskRemetente.unmaskedValue;
      preencherResumoRemetente();
      limparEndColeta(false);
      
      // Foca no CEP para ele iniciar a digitação
      const cepInput = document.getElementById('cepInput');
      if (cepInput) {
        setTimeout(() => cepInput.focus(), 50);
      }
    });
  }

  if (dialog) {
    dialog.addEventListener("cancel", (evento) => {
      // Tratar o ESC no teclado como recusa do endereço para manter o formulário consistente
      recusarEndereco();
    });
  }

  // Listener para evento customizado de alteração de papel do solicitante
  document.addEventListener('solicitante:papel-alterado', (e) => {
    const { papel, doc, docLimpo, endereco } = e.detail;

    if (papel === 'remetente') {
      state.maskRemetente.value = doc;
      remetenteDoc.readOnly = true;

      state.cnpjRemetenteConsultado = docLimpo;
      state.remetenteEndereco = endereco;
      state.remetenteVerificado = true;

      if (state.cnpjRemetenteConfirmado && docLimpo === state.cnpjRemetenteConfirmado) {
        preencherEndColeta();
      } else {
        abrirDialogConfirmacao(endereco);
      }
    } else {
      // Se mudou para destinatario ou outros, e o remetente era o solicitante, limpa o remetente
      if (state.maskRemetente.unmaskedValue === docLimpo) {
        state.maskRemetente.value = "";
        limparEndColeta();
      }
      remetenteDoc.readOnly = false;
    }
  });

  // Listener para evento customizado de reset do solicitante
  document.addEventListener('solicitante:reset', () => {
    remetenteDoc.readOnly = true;
    state.maskRemetente.value = "";
    limparEndColeta();
  });

  // Listener para evento de desfazer/verificar remetente manualmente via blur
  document.addEventListener('remetente:cnpj-blur', () => {
    verificarEndRemetente();
  });

  // Busca automática de endereço via ViaCEP
  const cepInput = document.getElementById('cepInput');
  if (cepInput) {
    cepInput.addEventListener('blur', async () => {
      const cep = state.maskCep ? state.maskCep.unmaskedValue : cepInput.value.replace(/\D/g, '');
      if (cep.length === 8) {
        try {
          // Validação de cobertura do CEP
          const resValida = await fetch(`/api/validar-cep?cep=${cep}`);
          const jsonValida = await resValida.json();
          
          if (jsonValida.valido === false) {
            if (state.maskCep) state.maskCep.value = "";
            cepInput.value = "";
            const dialogCep = document.getElementById("dialogCepNaoAtendido");
            if (dialogCep) dialogCep.showModal();
            return;
          }

          // Preenchimento automático via ViaCEP
          const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
          const data = await response.json();
          if (!data.erro) {
            if (state.logradouro) state.logradouro.value = data.logradouro || state.logradouro.value;
            if (state.bairro) state.bairro.value = data.bairro || state.bairro.value;
            if (state.cidade) state.cidade.value = data.localidade || state.cidade.value;
            if (state.estado) state.estado.value = data.uf || state.estado.value;
          }
        } catch (error) {
          // Falha silenciosa, o usuário pode continuar digitando manualmente
        }
      }
    });
  }
});
