// js/estado.js

// Centralized state object to manage shared properties and elements across modules
export const state = {
  // DOM Elements (evaluated on access to ensure availability and avoid manual initialization)
  get cep() { return document.getElementById('cepInput'); },
  get logradouro() { return document.getElementById('logradouroInput'); },
  get numero() { return document.getElementById('numeroInput'); },
  get complemento() { return document.getElementById('complementoInput'); },
  get bairro() { return document.getElementById('bairroInput'); },
  get cidade() { return document.getElementById('cidadeInput'); },
  get estado() { return document.getElementById('estadoInput'); },

  // IMask Instances
  maskSolicitante: null,
  maskRemetente: null,
  maskDestinatario: null,
  maskCep: null,
  maskPeso: null,
  maskValor: null,
  maskVolumes: null,

  // Business fields
  remetenteEndereco: null,
  remetenteCnpj: "",
  cnpjConfirmado: "",
  remetenteVerificado: false
};
