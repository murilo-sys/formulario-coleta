// js/endereco.js
// ================================================================================ //
// FUNÇÕES                                                                          //
// ================================================================================ //

function preencherEndColeta() {

  //Define os campos do endereço com o do Remetente
  maskCep.value = remetenteEndereco.postalCode || ""
  logradouro.value = remetenteEndereco.line1 || ""
  numero.value = remetenteEndereco.number || ""
  complemento.value = remetenteEndereco.line2 || ""
  bairro.value = remetenteEndereco.neighborhood || ""
  cidade.value = remetenteEndereco.city?.name || ""
  estado.value = remetenteEndereco.city?.state.code || ""
}

function limparEndColeta() {

  //limpa os campos do endereço
  const campos = [maskCep, logradouro, numero, complemento, bairro, cidade, estado]

  //entra em cada campo e não limpa caso tiver algo
  campos.forEach(campo => {
    if (campo) {
      campo.value = ""
    }
  });
}

//Função no qual verifica se o CNPJ é valido ou não.
function verificarCnpj(cnpj) {

  //Aqui verifica se o cnpj tem 14 caracteres
  if (cnpj && cnpj.length !== 14) return false

  return true
}

//Função de consultar dados do remetente de endereço
async function verificarEndRemetente() {

  const remetenteDocLimpo = maskRemetente.unmaskedValue

  if (!verificarCnpj(remetenteDocLimpo)) return

  // 1. Se este CNPJ específico já foi confirmado pelo usuário, preenche direto sem abrir o popup
  if (cnpjConfirmado && remetenteDocLimpo === cnpjConfirmado) {
    console.log("Endereço deste CNPJ já confirmado. Preenchendo diretamente...")
    preencherEndColeta()
    return
  }

  // 2. Se já buscamos da API, mas o usuário ainda não confirmou, exibe o popup com dados em cache
  if (remetenteVerificado && remetenteDocLimpo === remetenteCnpj) {
    console.log("Dados já salvos em cache, mas não confirmados. Exibindo popup...")
    abrirDialogConfirmacao(remetenteEndereco)
    return
  }

  console.log("Dados não encontrados, consultando na API")

  //Consulta os dados do solicitante.
  const endereco = await consultarEmpresaPorCnpj(remetenteDocLimpo)

  //Verifica se os dados existem
  if (!endereco) { return console.log("Endereço não encontrado e(ou) indisponivel") }

  //Define o endereço do remetente com o endereço obtido pela API
  remetenteEndereco = endereco

  //Salva o cnpj da consulta (cache temporário)
  remetenteCnpj = remetenteDocLimpo;
  remetenteVerificado = true;

  //Abre o modal de confirmação de endereço
  abrirDialogConfirmacao(endereco)
}

function abrirDialogConfirmacao(endereco) {
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

function recusarEndereco() {
  alert("Por favor, entre em contato conosco para atualizar os dados cadastrais antes de solicitar a coleta.");

  // Limpa o remetente
  if (maskRemetente) {
    maskRemetente.value = "";
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
      cnpjConfirmado = maskRemetente.unmaskedValue;
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
