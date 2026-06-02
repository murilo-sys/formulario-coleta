import { blindarInputCubagem, blindarInputMetro } from '../masks.js';

document.addEventListener("DOMContentLoaded", () => {
  const containerCubagem = document.getElementById("containerCubagem");
  const erroSomaCubagem = document.getElementById("erroSomaCubagem");
  const qtdVolumes = document.getElementById("qtdVolumes");
  const statusAlocacao = document.getElementById("statusAlocacaoVolumes");

  // ========================================================================= //
  //                       CÁLCULO E ATUALIZAÇÃO REATIVA DE UI                 //
  // ========================================================================= //

  function recalcularTudo() {
    if (!containerCubagem) return;

    const linhas = containerCubagem.querySelectorAll(".coluna-cubagem:not(.animacao-saida)");
    const totalVolumesDoc = parseInt(qtdVolumes?.value, 10) || 0;

    let somaVolumesGrupos = 0;

    linhas.forEach(linha => {
      const volInput = linha.querySelector(".input-volumes");
      const vol = parseInt(volInput?.value, 10) || 0;
      somaVolumesGrupos += vol;
    });

    // 1. Atualiza o painel de status de alocação de volumes (Badge Premium)
    if (statusAlocacao) {
      if (totalVolumesDoc <= 0) {
        statusAlocacao.innerHTML = "";
      } else if (somaVolumesGrupos === totalVolumesDoc) {
        statusAlocacao.innerHTML = `
          <span class="badge-status sucesso">
            <span>✓ ${somaVolumesGrupos} de ${totalVolumesDoc} volumes alocados</span>
          </span>
        `;
        if (erroSomaCubagem) {
          erroSomaCubagem.textContent = "";
          erroSomaCubagem.classList.add("oculto");
        }
      } else if (somaVolumesGrupos < totalVolumesDoc) {
        const falta = totalVolumesDoc - somaVolumesGrupos;
        statusAlocacao.innerHTML = `
          <span class="badge-status pendente">
            <span>⏳ Alocados ${somaVolumesGrupos} de ${totalVolumesDoc} (${falta} restante${falta > 1 ? 's' : ''})</span>
          </span>
        `;
      } else {
        const excesso = somaVolumesGrupos - totalVolumesDoc;
        statusAlocacao.innerHTML = `
          <span class="badge-status excedido">
            <span>⚠️ Excedido: ${somaVolumesGrupos} de ${totalVolumesDoc} (+${excesso} volume${excesso > 1 ? 's' : ''})</span>
          </span>
        `;
      }
    }
  }

  // ========================================================================= //
  //               GERENCIAMENTO DE LINHAS TOTALMENTE AUTOMATIZADO             //
  // ========================================================================= //

  function ajustarLinhasCubagem() {
    if (!containerCubagem) return;

    const totalVolumesDoc = parseInt(qtdVolumes?.value, 10) || 0;

    // Se o total de volumes do formulário for inválido ou zero, remove as linhas extras e encerra
    if (totalVolumesDoc <= 0) {
      const linhas = containerCubagem.querySelectorAll(".coluna-cubagem:not(.animacao-saida)");
      linhas.forEach((linha, index) => {
        if (index > 0) {
          removerLinhaComAnimacao(linha);
        } else {
          const volInput = linha.querySelector(".input-volumes");
          if (volInput) volInput.value = "1";
        }
      });
      recalcularTudo();
      return;
    }

    // Varre as linhas ativas e calcula a soma acumulada de volumes
    const linhas = Array.from(containerCubagem.querySelectorAll(".coluna-cubagem:not(.animacao-saida)"));
    let somaAcumulada = 0;
    let indexAtingiuTotal = -1;

    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];
      const volInput = linha.querySelector(".input-volumes");
      let vol = parseInt(volInput?.value, 10) || 0;

      // Impede que o volume deste grupo ultrapasse o limite restante disponível para o total geral
      const maxPermitido = totalVolumesDoc - somaAcumulada;
      if (vol > maxPermitido) {
        vol = maxPermitido;
        if (volInput) volInput.value = vol;
      }

      somaAcumulada += vol;

      // Se a soma acumulada até esta linha atingir ou ultrapassar o total de volumes pretendido
      if (somaAcumulada >= totalVolumesDoc) {
        indexAtingiuTotal = i;
        break;
      }
    }

    // Se a soma acumulada atingiu ou superou o total em um ponto intermediário, remove as linhas extras seguintes
    if (indexAtingiuTotal !== -1 && indexAtingiuTotal < linhas.length - 1) {
      for (let j = indexAtingiuTotal + 1; j < linhas.length; j++) {
        removerLinhaComAnimacao(linhas[j]);
      }
    }
    // Se percorremos todas as linhas e ainda não atingimos o total de volumes, adiciona linhas com 1 volume padrão até completar o total
    else if (somaAcumulada < totalVolumesDoc) {
      while (somaAcumulada < totalVolumesDoc) {
        adicionarLinhaComRestante(1);
        somaAcumulada += 1;
      }
    }

    recalcularTudo();
  }

  function removerLinhaComAnimacao(linha) {
    if (linha.classList.contains("animacao-saida")) return;
    linha.classList.remove("animacao-entrada");
    linha.classList.add("animacao-saida");
    setTimeout(() => {
      linha.remove();
      recalcularTudo();
    }, 300);
  }

  function adicionarLinhaComRestante(restante) {
    const template = document.getElementById("template-cubagem");
    if (!template) return;

    const clone = template.content.cloneNode(true);
    const novaLinha = clone.querySelector(".coluna-cubagem");

    // Inicia com animação suave de entrada
    novaLinha.classList.add("animacao-entrada");

    const inputVol = novaLinha.querySelector(".input-volumes");
    if (inputVol) {
      inputVol.value = "1"; // 1 volume padrão por linha
    }

    containerCubagem.appendChild(novaLinha);

    // Bindagem de máscaras e listeners
    const inputComp = novaLinha.querySelector(".input-comprimento");
    const inputLarg = novaLinha.querySelector(".input-largura");
    const inputAlt = novaLinha.querySelector(".input-altura");

    blindarInputCubagem(inputVol);
    blindarInputMetro(inputComp);
    blindarInputMetro(inputLarg);
    blindarInputMetro(inputAlt);
  }

  // ========================================================================= //
  //                                LISTENERS                                  //
  // ========================================================================= //

  if (qtdVolumes) {
    qtdVolumes.addEventListener("input", () => {
      const v = parseInt(qtdVolumes.value, 10);
      if (v <= 0) {
        qtdVolumes.value = ""; // Limpa se for zero ou negativo
      }
      if (v > 200) {
        qtdVolumes.value = 200;
      }
      qtdVolumes.classList.remove("erro-input");
      ajustarLinhasCubagem();
    });

    qtdVolumes.addEventListener("keydown", (evento) => {
      if (evento.key === "-" || evento.key === "." || evento.key === ",") {
        evento.preventDefault();
      }
    });
  }

  if (containerCubagem) {
    // Detecta edições em qualquer input do container para atualizar em tempo real
    containerCubagem.addEventListener("input", (evento) => {
      if (erroSomaCubagem) {
        erroSomaCubagem.textContent = "";
        erroSomaCubagem.classList.add("oculto");
      }

      // Se editou a quantidade de volumes de algum grupo, rodamos o reajuste dinâmico de linhas
      if (evento.target.classList.contains("input-volumes")) {
        const valueStr = evento.target.value.trim();
        if (valueStr === "") {
          evento.target.classList.remove("erro-input");
          recalcularTudo();
          return; // Permite apagar sem bugar ou redefinir imediatamente
        }

        let volVal = parseInt(valueStr, 10);
        if (isNaN(volVal) || volVal <= 0) {
          volVal = 1;
          evento.target.value = "1";
        }

        const totalVolumesDoc = parseInt(qtdVolumes?.value, 10) || 0;
        if (totalVolumesDoc > 0 && volVal > totalVolumesDoc) {
          volVal = totalVolumesDoc;
          evento.target.value = totalVolumesDoc;
        }

        evento.target.classList.remove("erro-input");
        if (qtdVolumes) qtdVolumes.classList.remove("erro-input");
        ajustarLinhasCubagem();
      } else {
        recalcularTudo();
      }
    });
  }

  // Inicialização reativa no carregamento da página
  ajustarLinhasCubagem();

  // Expõe a função de recalcular e ajustar globalmente para sincronização com o reset
  window.recalcularCubagemTotal = () => {
    ajustarLinhasCubagem();
  };
});

// Executa as validações das dimensões de cubagem dinâmicas e da soma agrupada
export function validarCubagem(marcarErro) {
  let valido = true;
  const containerCubagem = document.getElementById("containerCubagem");
  const erroSomaCubagem = document.getElementById("erroSomaCubagem");
  const qtdVolumesInput = document.getElementById("qtdVolumes");

  if (!containerCubagem) return true;

  const totalLinhas = containerCubagem.querySelectorAll(".coluna-cubagem:not(.animacao-saida)");
  let somaVolumesGrupos = 0;

  totalLinhas.forEach((linha) => {
    const volumes = linha.querySelector(".input-volumes");
    const comprimento = linha.querySelector(".input-comprimento");
    const largura = linha.querySelector(".input-largura");
    const altura = linha.querySelector(".input-altura");

    // Valida se o número de volumes do grupo está vazio ou <= 0
    if (volumes) {
      const volumesVal = parseInt(volumes.value, 10);
      if (isNaN(volumesVal) || volumesVal <= 0) {
        marcarErro(volumes);
        valido = false;
      } else {
        somaVolumesGrupos += volumesVal;
      }
    }

    if (comprimento) {
      const compVal = parseFloat(comprimento.value.replace(",", "."));
      if (isNaN(compVal) || compVal <= 0 || comprimento.value.trim() === "") {
        marcarErro(comprimento);
        valido = false;
      }
    }
    if (largura) {
      const largVal = parseFloat(largura.value.replace(",", "."));
      if (isNaN(largVal) || largVal <= 0 || largura.value.trim() === "") {
        marcarErro(largura);
        valido = false;
      }
    }
    if (altura) {
      const altVal = parseFloat(altura.value.replace(",", "."));
      if (isNaN(altVal) || altVal <= 0 || altura.value.trim() === "") {
        marcarErro(altura);
        valido = false;
      }
    }
  });

  // Se já há erros de digitação/campos vazios, não valida a soma de volumes ainda
  if (!valido) return false;

  // Valida a consistência de negócio entre a soma dos volumes agrupados e o total do formulário
  if (qtdVolumesInput) {
    const totalVolumesFomulario = parseInt(qtdVolumesInput.value, 10) || 0;

    if (somaVolumesGrupos !== totalVolumesFomulario) {
      valido = false;

      // UX Premium: Marca todos os inputs envolvidos para indicar a divergência
      marcarErro(qtdVolumesInput);
      totalLinhas.forEach((linha) => {
        const volumes = linha.querySelector(".input-volumes");
        if (volumes) marcarErro(volumes);
      });

      // Exibe mensagem de erro de soma
      if (erroSomaCubagem) {
        erroSomaCubagem.textContent = `A soma das quantidades dos grupos de cubagem (${somaVolumesGrupos}) deve ser exatamente igual ao total de volumes informado (${totalVolumesFomulario}).`;
        erroSomaCubagem.classList.remove("oculto");
        erroSomaCubagem.classList.add("visivel");
      }
    } else {
      if (erroSomaCubagem) {
        erroSomaCubagem.textContent = "";
        erroSomaCubagem.classList.add("oculto");
      }
    }
  }

  return valido;
}
