// js/validacao.js
import { state } from './state.js';
import { DocValido } from './utils/utils.js';
import { validarSolicitante } from './secoes/solicitante.js';
import { validarEndereco } from './secoes/endereco.js';
import { validarMercadoria } from './secoes/mercadoria.js';
import { validarCubagem } from './secoes/cubagem.js';
import { validarFuncionamento } from './secoes/horarios.js';

document.addEventListener("DOMContentLoaded", () => {
  const formulario = document.querySelector(".formularioColeta");

  // ========================================================================= //
  //                           VALIDAÇÃO E ENVIO DO FORMULÁRIO                 //
  // ========================================================================= //

  if (formulario) {
    // Evento para limpar a classe de erro assim que o usuário começar a digitar/selecionar
    formulario.addEventListener("input", (evento) => {
      if (
        evento.target.tagName === "INPUT" ||
        evento.target.tagName === "SELECT"
      ) {
        evento.target.classList.remove("erro-input");
      }

      // Limpa o erro do container de rádio de almoço ao selecionar uma das opções
      if (evento.target.name === "horarioAlmoco") {
        const grupoRadioAlmoco = document.querySelector(".grupo-radio-almoco");
        if (grupoRadioAlmoco) {
          grupoRadioAlmoco.classList.remove("erro-input");
        }
      }
    });

    // Evento disparado ao tentar enviar o formulário
    formulario.addEventListener("submit", (evento) => {
      evento.preventDefault();

      // Função reutilizável para aplicar o estilo de erro com animação
      function marcarErro(elemento) {
        if (!elemento) return;
        void elemento.offsetWidth; // Força reflow para reiniciar animações CSS
        elemento.classList.add("erro-input");
      }

      // --- Execução das Validações Modulares ---
      let formValido = true;

      // 1. Valida Solicitante (Nome e Documentos)
      if (!validarSolicitante(marcarErro)) {
        formValido = false;
      }

      // 2. Valida Endereço da Coleta
      if (!validarEndereco(marcarErro)) {
        formValido = false;
      }

      // 3. Valida Mercadoria (Peso, Valor, Volumes e Natureza)
      if (!validarMercadoria(marcarErro)) {
        formValido = false;
      }

      // 4. Valida Horário de Funcionamento
      if (!validarFuncionamento(marcarErro)) {
        formValido = false;
      }

      // 5. Valida Cubagem das Caixas (Dimensões dinâmicas)
      if (!validarCubagem(marcarErro)) {
        formValido = false;
      }

      // 6. Verifica as observações (Geral)
      const observacoes = document.getElementById("observacoes");
      if (observacoes && observacoes.value.trim() === "") {
        marcarErro(observacoes);
        formValido = false;
      }

      // --- Tratamento de Erros e Submit Final ---

      // Se houver algum erro em qualquer seção
      if (!formValido) {
        const primeiroErro = document.querySelector(".erro-input");
        if (primeiroErro) {
          primeiroErro.scrollIntoView({ behavior: "smooth", block: "center" });
          primeiroErro.focus();
        }
        return; // Interrompe o envio do formulário
      }

      // Se passou por todas as validações com sucesso
      alert("Formulario enviado");
    });
  }
});
