export function avisoCadastro(participante, tipoErro = "nao_encontrado") {
  const dialog = document.getElementById('dialogAvisoCadastro');
  if (!dialog) return;

  const titulo = dialog.querySelector('.dialog-titulo');
  const subtitulo = dialog.querySelector('.dialog-subtitulo');

  if (tipoErro === "editar") {
    if (titulo) titulo.textContent = "Editar Cadastro";
    if (subtitulo) {
      subtitulo.textContent = "Para alterar ou editar seus dados cadastrais, entre em contato conosco.";
    }
  } else {
    if (titulo) titulo.textContent = `${participante} Não Encontrado`;
    if (subtitulo) {
      subtitulo.textContent = "O documento informado não está registrado em nosso sistema.";
    }
  }

  dialog.showModal();
}