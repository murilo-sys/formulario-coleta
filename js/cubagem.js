// js/cubagem.js
import { blindarInputCubagem } from './mascaras.js';

document.addEventListener("DOMContentLoaded", () => {
  const qtdVolumes = document.getElementById("qtdVolumes");

  // ========================================================================= //
  //             LÓGICA DINÂMICA: ADICIONAR/REMOVER LINHAS DE CUBAGEM          //
  // ========================================================================= //

  if (qtdVolumes) {
    // Bloqueia fisicamente as teclas indesejadas no campo de volumes no momento exato do clique
    qtdVolumes.addEventListener("keydown", (evento) => {
      if (evento.key === "-" || evento.key === "." || evento.key === ",") {
        evento.preventDefault(); // Impede o sinal de menos, ponto ou vírgula antes de aparecer
      }
    });

    // Quando digita algo dentro do input
    qtdVolumes.addEventListener("input", () => {
      // Regra de segurança: ignora se não for número ou se for maior/igual a 100
      if (isNaN(qtdVolumes.value) || qtdVolumes.value >= 100) return;

      const containerCubagem = document.getElementById("containerCubagem");
      let totalLinhas = containerCubagem.querySelectorAll(".coluna-cubagem");
      let totalLinhasInvertidas = Array.from(totalLinhas).reverse();

      // Adiciona linhas de cubagens caso a quantidade solicitada seja maior que as atuais
      if (qtdVolumes.value >= totalLinhas.length) {
        // CORREÇÃO LOGÍSTICA: Adiciona apenas a diferença exata para não multiplicar infinitamente
        const linhasQueFaltam = qtdVolumes.value - totalLinhas.length;
        const template = document.getElementById("template-cubagem");

        for (let i = 0; i < linhasQueFaltam; i++) {
          const clone = template.content.cloneNode(true);

          // Injeta o HTML novo no final da lista dentro do container
          containerCubagem.appendChild(clone);

          // BLINDAGEM AUTOMÁTICA: Aplica a máscara IMask na linha que ACABA de ser criada
          const linhasAgora = containerCubagem.querySelectorAll(".coluna-cubagem");
          const ultimaLinhaCriada = linhasAgora[linhasAgora.length - 1];

          blindarInputCubagem(ultimaLinhaCriada.querySelector(".input-comprimento"));
          blindarInputCubagem(ultimaLinhaCriada.querySelector(".input-largura"));
          blindarInputCubagem(ultimaLinhaCriada.querySelector(".input-altura"));
        }
      }

      // Atualiza a NodeList de linhas antes de tentar remover (necessário após adicionar)
      totalLinhas = containerCubagem.querySelectorAll(".coluna-cubagem");
      totalLinhasInvertidas = Array.from(totalLinhas).reverse();

      // Apaga as linhas (de baixo para cima) caso qtdVolumes for menor
      if (totalLinhas.length > qtdVolumes.value) {
        totalLinhasInvertidas.forEach((linha) => {
          // Garante que o formulário nunca fique com 0 linhas (preserva no mínimo 1)
          if (containerCubagem.querySelectorAll(".coluna-cubagem").length <= 1) return;

          // Se ainda tivermos mais linhas do que o número desejado, remove a linha atual
          if (containerCubagem.querySelectorAll(".coluna-cubagem").length > qtdVolumes.value) {
            linha.remove();
          }
        });
      }

      // Caso a qtd de volumes for apagada (ficar vazia), limpar tudo exceto a primeira linha
      if (qtdVolumes.value == "") {
        totalLinhas.forEach(linha => {
          if (containerCubagem.querySelectorAll(".coluna-cubagem").length <= 1) return;
          linha.remove();
        });
      }
    });
  }
});
