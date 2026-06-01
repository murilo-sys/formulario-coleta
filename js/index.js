// js/index.js
// Ponto de entrada que importa e executa todos os módulos da aplicação.

import './state.js';
import './utils/utils.js';
import './api/api.js';
import './masks.js';
import './secoes/endereco.js';
import './secoes/solicitante.js';
import './secoes/destinatario.js';
import './secoes/mercadoria.js';
import './secoes/cubagem.js';
import './secoes/horarios.js';
import './validacao.js';

// Gerenciamento dinâmico de tabindex para campos readonly
document.addEventListener("DOMContentLoaded", () => {
  const inputs = document.querySelectorAll("input");
  const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'readOnly');
  
  if (!desc) return;

  const originalGet = desc.get;
  const originalSet = desc.set;

  inputs.forEach((input) => {
    // 1. Sobrescreve o descriptor de readOnly para capturar alterações programáticas (ex: input.readOnly = true)
    Object.defineProperty(input, 'readOnly', {
      get() {
        return originalGet.call(this);
      },
      set(novoValor) {
        originalSet.call(this, novoValor);
        if (novoValor) {
          this.tabIndex = -1;
        } else {
          this.removeAttribute("tabindex");
        }
      },
      configurable: true
    });

    // 2. Sincroniza o estado inicial (caso o HTML já comece com readonly estático)
    if (input.readOnly || input.hasAttribute("readonly")) {
      input.tabIndex = -1;
    }
  });

  // 3. MutationObserver de backup para alterações feitas diretamente por atributos (ex: setAttribute('readonly', ''))
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "attributes" && mutation.attributeName === "readonly") {
        const target = mutation.target;
        if (target.hasAttribute("readonly")) {
          target.tabIndex = -1;
        } else {
          target.removeAttribute("tabindex");
        }
      }
    });
  });

  inputs.forEach((input) => {
    observer.observe(input, { attributes: true, attributeFilter: ["readonly"] });
  });

  // Carrega o painel de debug apenas no desenvolvimento local (localhost / 127.0.0.1)
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    const script = document.createElement("script");
    script.src = "/js/debug-panel.js";
    script.type = "module";
    document.body.appendChild(script);
  }
});
