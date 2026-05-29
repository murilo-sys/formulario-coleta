// js/secoes/horarios.js

// Listener para desmarcar rádio de almoço ao clicar novamente (Requisito adicional)
document.addEventListener("DOMContentLoaded", () => {
  const radios = document.querySelectorAll('input[name="horarioAlmoco"]');
  
  radios.forEach(radio => {
    if (radio.checked) {
      radio.dataset.wasChecked = 'true';
    } else {
      radio.dataset.wasChecked = 'false';
    }

    radio.addEventListener('click', () => {
      if (radio.dataset.wasChecked === 'true') {
        radio.checked = false;
        radio.dataset.wasChecked = 'false';
        radio.dispatchEvent(new Event('change'));
      } else {
        radios.forEach(r => r.dataset.wasChecked = 'false');
        radio.dataset.wasChecked = 'true';
      }
    });
  });

  // Garante o reset do estado das flags no reset do formulário
  const formulario = document.querySelector(".formularioColeta");
  if (formulario) {
    formulario.addEventListener("reset", () => {
      radios.forEach(r => {
        r.dataset.wasChecked = 'false';
      });
    });
  }
});

// Executa as validações da seção de horário de funcionamento
export function validarFuncionamento(marcarErro) {
  let valido = true;

  const horarioAbertura = document.getElementById("horarioAbertura");
  const horarioFechamento = document.getElementById("horarioFechamento");

  // Valida o preenchimento dos horários
  if (horarioAbertura && horarioAbertura.value === "") {
    marcarErro(horarioAbertura);
    valido = false;
  }
  if (horarioFechamento && horarioFechamento.value === "") {
    marcarErro(horarioFechamento);
    valido = false;
  }

  // Validação cronológica (Abertura não pode ser posterior ou igual ao fechamento)
  if (horarioAbertura && horarioFechamento && horarioAbertura.value !== "" && horarioFechamento.value !== "") {
    if (horarioAbertura.value >= horarioFechamento.value) {
      marcarErro(horarioAbertura);
      marcarErro(horarioFechamento);
      valido = false;
    }
  }

  return valido;
}
