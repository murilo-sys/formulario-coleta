export function avisoCadastro(participante) {
  const dialog = document.getElementById('dialogAvisoCadastro')
  const subTitulo = dialog.querySelector('.dialog-titulo').firstChild

  subTitulo.textContent = ` ${participante} Não Encontrado`

  dialog.showModal()
}