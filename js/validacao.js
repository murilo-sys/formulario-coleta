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
  const dialogConfirmacaoEnvio = document.getElementById("dialogConfirmacaoEnvio");
  const chkConfirmacaoFinal = document.getElementById("chkConfirmacaoFinal");
  const btnConfirmarEnvioFinal = document.getElementById("btnConfirmarEnvioFinal");
  const btnCancelarConfirmacao = document.getElementById("btnCancelarConfirmacao");

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
        elemento.classList.remove("erro-input");
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

      // Se passou por todas as validações com sucesso, abre modal de confirmação (Requisito 1)
      if (dialogConfirmacaoEnvio) {
        if (chkConfirmacaoFinal) chkConfirmacaoFinal.checked = false;
        if (btnConfirmarEnvioFinal) {
          btnConfirmarEnvioFinal.disabled = true;
          btnConfirmarEnvioFinal.textContent = "Confirmar Coleta";
        }
        dialogConfirmacaoEnvio.showModal();
      }
    });

    // Controladores do Dialog de Confirmação de Envio (Requisito 1)
    if (chkConfirmacaoFinal && btnConfirmarEnvioFinal) {
      chkConfirmacaoFinal.addEventListener("change", () => {
        btnConfirmarEnvioFinal.disabled = !chkConfirmacaoFinal.checked;
      });
    }

    if (btnCancelarConfirmacao && dialogConfirmacaoEnvio) {
      btnCancelarConfirmacao.addEventListener("click", () => {
        dialogConfirmacaoEnvio.close();
      });
    }

    if (btnConfirmarEnvioFinal) {
      btnConfirmarEnvioFinal.addEventListener("click", async () => {
        btnConfirmarEnvioFinal.disabled = true;
        btnConfirmarEnvioFinal.textContent = "Enviando...";

        const payload = {
          solicitanteDoc: document.getElementById("solicitanteDoc")?.value || "",
          solicitanteNome: document.getElementById("solicitanteNome")?.value || "",
          tipoSolicitante: document.querySelector('input[name="tipoSolicitante"]:checked')?.value || "",
          remetenteDoc: document.getElementById("remetenteDoc")?.value || "",
          destinatarioDoc: document.getElementById("destinatarioDoc")?.value || "",
          cepColeta: document.getElementById("cepInput")?.value || "",
          ruaColeta: document.getElementById("logradouroInput")?.value || "",
          numeroColeta: document.getElementById("numeroInput")?.value || "",
          complementoColeta: document.getElementById("complementoInput")?.value || "",
          bairroColeta: document.getElementById("bairroInput")?.value || "",
          cidadeColeta: document.getElementById("cidadeInput")?.value || "",
          ufColeta: document.getElementById("estadoInput")?.value || "",
          naturezaMercadoria: document.getElementById("naturezaMercadoria")?.value || "",
          valorNf: document.getElementById("valorNf")?.value || "",
          qtdVolumes: document.getElementById("qtdVolumes")?.value || "",
          pesoReal: document.getElementById("pesoReal")?.value || "",
          horarioAbertura: document.getElementById("horarioAbertura")?.value || "",
          horarioFechamento: document.getElementById("horarioFechamento")?.value || "",
          horarioAlmoco: document.querySelector('input[name="horarioAlmoco"]:checked')?.value || "",
          observacoes: document.getElementById("observacoes")?.value || ""
        };

        try {
          const response = await fetch("/api/solicitar-coleta", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });

          const result = await response.json();

          if (response.ok) {
            alert("Solicitação de coleta aberta com sucesso!");
            if (dialogConfirmacaoEnvio) {
              dialogConfirmacaoEnvio.close();
            }
            formulario.reset();
          } else {
            alert(`Erro ao solicitar coleta: ${result.message || "Erro desconhecido"}`);
            btnConfirmarEnvioFinal.disabled = false;
            btnConfirmarEnvioFinal.textContent = "Confirmar Coleta";
          }
        } catch (err) {
          alert("Erro de rede. Por favor, tente novamente.");
          btnConfirmarEnvioFinal.disabled = false;
          btnConfirmarEnvioFinal.textContent = "Confirmar Coleta";
        }
      });
    }

    // Gerencia o reset do formulário limpando estados, erros e tags
    formulario.addEventListener("reset", () => {
      // 1. Remove classes de erro
      const erros = formulario.querySelectorAll(".erro-input");
      erros.forEach(el => el.classList.remove("erro-input"));

      // 2. Limpa tags cidade/estado
      const tags = document.querySelectorAll(".cidade-estado");
      tags.forEach(tag => {
        tag.textContent = "";
        tag.classList.add("oculto");
      });

      // 3. Reseta readOnly
      const remetenteDoc = document.getElementById("remetenteDoc");
      const destinatarioDoc = document.getElementById("destinatarioDoc");
      if (remetenteDoc) remetenteDoc.readOnly = true;
      if (destinatarioDoc) destinatarioDoc.readOnly = true;

      // 4. Limpa valores nas máscaras
      if (state.maskSolicitante) state.maskSolicitante.value = "";
      if (state.maskRemetente) state.maskRemetente.value = "";
      if (state.maskDestinatario) state.maskDestinatario.value = "";
      if (state.maskCep) state.maskCep.value = "";
      if (state.maskPeso) state.maskPeso.value = "";
      if (state.maskValor) state.maskValor.value = "";

      // 5. Oculta o grupo de solicitante
      const grupoEscondidoSolicitante = document.getElementById("grupoEscondidoSolicitante");
      if (grupoEscondidoSolicitante) {
        grupoEscondidoSolicitante.classList.add("oculto");
      }

      // 6. Garante que o botão Solicitar Coleta não permaneça desabilitado
      const buttonSolicitarColeta = document.getElementById("buttonSolicitarColeta");
      if (buttonSolicitarColeta) {
        buttonSolicitarColeta.disabled = false;
      }

      // 7. Reseta estado central
      state.cnpjRemetenteConfirmado = "";
      state.cnpjRemetenteConsultado = "";
      state.remetenteEndereco = null;
      state.remetenteVerificado = false;
      state.destinatarioVerificado = false;
      state.destinatarioCnpjVerificado = "";
      state.destinatarioEndereco = null;
    });
  }
});
