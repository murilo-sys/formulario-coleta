// js/secoes/endereco.js
import { state } from '../state.js';
import { consultarEmpresaPorCnpj } from '../api/api.js';
import { verificarCnpj } from '../utils/utils.js';
import { avisoCadastro } from './avisoCadastro.js'

export function preencherEndColeta() {
  // Define os campos do endereço com o do Remetente
  state.maskCep.value = state.remetenteEndereco.postalCode || "";
  state.logradouro.value = state.remetenteEndereco.line1 || "";
  state.numero.value = state.remetenteEndereco.number || "";
  state.complemento.value = state.remetenteEndereco.line2 || "";
  state.bairro.value = state.remetenteEndereco.neighborhood || "";
  state.cidade.value = state.remetenteEndereco.city?.name || "";
  state.estado.value = state.remetenteEndereco.city?.state.code || "";

  // Preenche a cidade e estado resumidos abaixo do CNPJ do remetente
  const elCidadeEstado = document.getElementById("cidadeEstadoRemetente");
  if (elCidadeEstado && state.remetenteEndereco?.city) {
    const cidadeNome = state.remetenteEndereco.city.name || "-";
    const estadoSigla = state.remetenteEndereco.city.state?.code || "-";
    elCidadeEstado.innerHTML = `🏢 ${cidadeNome} / ${estadoSigla}`;
    elCidadeEstado.classList.remove("oculto");
  }
}

export function limparEndColeta() {
  // limpa os campos do endereço
  const campos = [state.maskCep, state.logradouro, state.numero, state.complemento, state.bairro, state.cidade, state.estado];

  // entra em cada campo e não limpa caso tiver algo
  campos.forEach(campo => {
    if (campo) {
      campo.value = "";
    }
  });

  // Limpa também o texto resumido de cidade/estado do remetente
  const elCidadeEstado = document.getElementById("cidadeEstadoRemetente");
  if (elCidadeEstado) {
    elCidadeEstado.textContent = "";
    elCidadeEstado.classList.add("oculto");
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
  avisoCadastro("Remetente", "editar");

  // Muda o rádio do solicitante para "Outros" para restaurar os campos
  const radioOutros = document.getElementById("solicitanteOutros");
  if (radioOutros) {
    radioOutros.click();
  }

  // Limpa o remetente
  if (state.maskRemetente) {
    state.maskRemetente.value = "";
  }
  const remetenteDoc = document.getElementById("remetenteDoc");
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

// Configura os escutadores do Dialog de Confirmação
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
      recusarEndereco();
    });
  }

  if (dialog) {
    dialog.addEventListener("cancel", (evento) => {
      // Tratar o ESC no teclado como recusa do endereço para manter o formulário consistente
      recusarEndereco();
    });
  }
});
