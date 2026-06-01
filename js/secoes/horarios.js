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

  // Configuração de formatação automática de hora e foco consecutivo
  const horarioAbertura = document.getElementById("horarioAbertura");
  const horarioFechamento = document.getElementById("horarioFechamento");
  const observacoes = document.getElementById("observacoes");

  function blindarInputHora(input, nextInput) {
    if (!input) return;

    input.addEventListener('input', () => {
      let val = input.value.replace(/\D/g, '');
      
      if (val.length > 4) {
        val = val.substring(0, 4);
      }
      
      if (val.length >= 3) {
        const hh = val.substring(0, 2);
        const mm = val.substring(2);
        input.value = `${hh}:${mm}`;
      } else {
        input.value = val;
      }
      
      // Quando preenche os 4 dígitos corretos (ex: 1200)
      if (val.length === 4) {
        const hh = parseInt(val.substring(0, 2), 10);
        const mm = parseInt(val.substring(2), 10);
        
        if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) {
          if (nextInput) {
            nextInput.focus();
            if (nextInput.select && typeof nextInput.select === 'function') {
              nextInput.select();
            }
          }
        } else {
          // Limpa se a hora for inválida (ex: 25:00 ou 12:60)
          input.value = "";
        }
      }
    });

    // Permite que a tecla Backspace apague o separador de dois pontos de forma natural
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        const start = input.selectionStart;
        if (start === 3 && input.value.includes(':')) {
          e.preventDefault();
          input.value = input.value.replace(':', '').substring(0, 2);
        }
      }
    });

    // Auto-formata preenchimentos incompletos ao sair do campo (ex: "9" -> "09:00", "12" -> "12:00")
    input.addEventListener('blur', () => {
      let val = input.value.replace(/\D/g, '');
      if (val === "") return;
      
      if (val.length === 1) {
        val = "0" + val + "00";
      } else if (val.length === 2) {
        val = val + "00";
      } else if (val.length === 3) {
        val = "0" + val;
      }
      
      const hh = parseInt(val.substring(0, 2), 10);
      const mm = parseInt(val.substring(2), 10);
      
      if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) {
        input.value = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      } else {
        input.value = "";
      }
    });
  }

  blindarInputHora(horarioAbertura, horarioFechamento);
  blindarInputHora(horarioFechamento, observacoes);

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
