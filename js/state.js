// js/state.js

// Objeto de estado centralizado para gerenciar propriedades e elementos entre os módulos
export const state = {
  // Elementos do DOM (avaliados ao acessar para garantir que já existam na tela)
  get cep() { return document.getElementById('cepInput'); },
  get logradouro() { return document.getElementById('logradouroInput'); },
  get numero() { return document.getElementById('numeroInput'); },
  get complemento() { return document.getElementById('complementoInput'); },
  get bairro() { return document.getElementById('bairroInput'); },
  get cidade() { return document.getElementById('cidadeInput'); },
  get estado() { return document.getElementById('estadoInput'); },

  // Instâncias de máscaras do IMask
  maskSolicitante: null,
  maskRemetente: null,
  maskDestinatario: null,
  maskCep: null,
  maskPeso: null,
  maskValor: null,
  maskVolumes: null,

  // Campos de controle de dados
  remetenteEndereco: null,
  remetenteCnpj: "",
  cnpjConfirmado: "",
  remetenteVerificado: false
};
