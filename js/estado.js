// js/estado.js
// ========================================================================= //
//                          VARIÁVEIS GLOBAIS DE MÁSCARAS                    //
// ========================================================================= //

//Endereços
var cep, logradouro, numero, complemento, bairro, cidade, estado;

//Mascaras do IMASK
var maskSolicitante,
  maskRemetente,
  maskDestinatario,
  maskCep,
  maskPeso,
  maskValor,
  maskVolumes;

//Endereço & cnpj remetente
var remetenteEndereco, remetenteCnpj;

//Verificadores
var solicitanteVerificado,
  remetenteVerificado,
  destinatarioVerificado;
