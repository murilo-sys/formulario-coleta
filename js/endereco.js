// js/endereco.js
// ================================================================================ //
// FUNÇÕES                                                                          //
// ================================================================================ //

//Função de "ativar" ou "desativar" EndColeta com readOnly
function readOnlyEndColeta(valor) {
  cep.readOnly = valor
  logradouro.readOnly = valor
  numero.readOnly = valor
  complemento.readOnly = valor
  bairro.readOnly = valor
  cidade.readOnly = valor
  estado.readOnly = valor
}

function preencherEndColeta() {

  readOnlyEndColeta(true)

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

  //Verifica se já não foi verificado a api no remetente antes 
  if (remetenteVerificado && maskRemetente.unmaskedValue == remetenteCnpj) {
    console.log("Dados já salvos anteriormente, buscando...")
    preencherEndColeta()
    return
  }

  if (await !verificarCnpj(remetenteDocLimpo)) return

  console.log("Dados não encontrados, consultando na API")

  //Consulta os dados do solicitante.
  const endereco = await consultarEmpresaPorCnpj(remetenteDocLimpo)

  //Verifica se os dados existem
  if (!endereco) { return console.log("Endereço não encontrado e(ou) indisponivel") }

  //Define o endereço do remetente com o endereço obtido pela API
  remetenteEndereco = endereco

  //Preenche o end de coleta
  preencherEndColeta()

  //Remetente já foi verificado marcar como true e guardar o cnpj que foi verificado
  remetenteVerificado = true
  remetenteCnpj = maskRemetente.unmaskedValue
}
