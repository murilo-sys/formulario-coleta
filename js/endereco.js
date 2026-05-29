// js/endereco.js
import { state } from './estado.js';
import { consultarEmpresaPorCnpj } from './api.js';

export function preencherEndColeta() {
  // Define os campos do endereço com o do Remetente
  state.maskCep.value = state.remetenteEndereco.postalCode || "";
  state.logradouro.value = state.remetenteEndereco.line1 || "";
  state.numero.value = state.remetenteEndereco.number || "";
  state.complemento.value = state.remetenteEndereco.line2 || "";
  state.bairro.value = state.remetenteEndereco.neighborhood || "";
  state.cidade.value = state.remetenteEndereco.city?.name || "";
  state.estado.value = state.remetenteEndereco.city?.state.code || "";
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
}

// Função na qual verifica se o CNPJ é valido ou não.
export function verificarCnpj(cnpj) {
  if (cnpj && cnpj.length !== 14) return false;
  return true;
}

// Função de consultar dados do remetente de endereço
export async function verificarEndRemetente() {
  const remetenteDocLimpo = state.maskRemetente.unmaskedValue;

  if (!verificarCnpj(remetenteDocLimpo)) return;

  // 1. Se este CNPJ específico já foi confirmado pelo usuário, preenche direto sem abrir o popup
  if (state.cnpjConfirmado && remetenteDocLimpo === state.cnpjConfirmado) {
    console.log("Endereço deste CNPJ já confirmado. Preenchendo diretamente...");
    preencherEndColeta();
    return;
  }

  // 2. Se já buscamos da API, mas o usuário ainda não confirmou, exibe o popup com dados em cache
  if (state.remetenteVerificado && remetenteDocLimpo === state.remetenteCnpj) {
    console.log("Dados já salvos em cache, mas não confirmados. Exibindo popup...");
    abrirDialogConfirmacao(state.remetenteEndereco);
    return;
  }

  console.log("Dados não encontrados, consultando na API");

  // Consulta os dados do solicitante.
  const endereco = await consultarEmpresaPorCnpj(remetenteDocLimpo);

  // Verifica se os dados existem
  if (!endereco) {
    return console.log("Endereço não encontrado e(ou) indisponivel");
  }

  // Define o endereço do remetente com o endereço obtido pela API
  state.remetenteEndereco = endereco;

  // Salva o cnpj da consulta (cache temporário)
  state.remetenteCnpj = remetenteDocLimpo;
  state.remetenteVerificado = true;

  // Abre o modal de confirmação de endereço
  abrirDialogConfirmacao(endereco);
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
  alert("Por favor, entre em contato conosco para atualizar os dados cadastrais antes de solicitar a coleta.");

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
      state.cnpjConfirmado = state.maskRemetente.unmaskedValue;
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
