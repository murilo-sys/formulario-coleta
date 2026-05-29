// js/secoes/funcionamento.js

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
