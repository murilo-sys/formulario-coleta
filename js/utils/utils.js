// js/utils/utils.js

// Verifica se o CNPJ tem tamanho básico válido (14 dígitos)
export function verificarCnpj(cnpj) {
  if (cnpj && cnpj.length !== 14) return false;
  return true;
}

// Verifica se o tamanho do documento corresponde a CPF (11) ou CNPJ (14)
export function DocValido(doc) {
  if (doc.length !== 11 && doc.length !== 14) {
    return false;
  }
  return true;
}

// Exibe um modal dialog customizado e bonito no lugar do alert() nativo
export function mostrarAlerta(mensagem, titulo = "Atenção", icone = "⚠️") {
  const dialog = document.getElementById("dialogAlertaMensagem");
  if (!dialog) {
    console.warn("Alerta:", mensagem);
    return;
  }
  const iconeEl = document.getElementById("dialogAlertaIcone");
  const tituloEl = document.getElementById("dialogAlertaTitulo");
  const subtituloEl = document.getElementById("dialogAlertaSubtitulo");

  if (iconeEl) iconeEl.textContent = icone;
  if (tituloEl) tituloEl.textContent = titulo;
  if (subtituloEl) {
    // Permite quebra de linha simples na mensagem de alerta
    subtituloEl.innerHTML = mensagem.replace(/\n/g, "<br>");
  }

  // Define cores de texto específicas para cada tipo de diálogo
  if (titulo === "Erro" || titulo.toLowerCase().includes("erro") || icone === "❌") {
    if (tituloEl) tituloEl.style.color = "#dc2626"; // Vermelho
  } else if (titulo === "Sucesso" || icone === "✅") {
    if (tituloEl) tituloEl.style.color = "#16a34a"; // Verde
  } else {
    if (tituloEl) tituloEl.style.color = "#9a3412"; // Amber/Laranja
  }

  dialog.showModal();
}
