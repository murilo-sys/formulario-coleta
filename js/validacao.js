// js/validacao.js
import { state } from './state.js';
import { DocValido, mostrarAlerta } from './utils/utils.js';
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
  const dialogSucesso = document.getElementById("dialogSucesso");
  const btnFecharSucesso = document.getElementById("btnFecharSucesso");
  const sucessoOrdemColeta = document.getElementById("sucessoOrdemColeta");
  const sucessoTelefoneContato = document.getElementById("sucessoTelefoneContato");
  const sucessoEmailContato = document.getElementById("sucessoEmailContato");
  const confirmacaoEmailContato = document.getElementById("confirmacaoEmailContato");
  const confirmacaoTelefoneContato = document.getElementById("confirmacaoTelefoneContato");

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

      // Limpa o erro do container do tipo de solicitante ao selecionar uma das opções
      if (evento.target.name === "tipoSolicitante") {
        const grupoOpcoesSolicitante = document.querySelector(".grupo-opcoes-solicitante");
        if (grupoOpcoesSolicitante) {
          grupoOpcoesSolicitante.classList.remove("erro-input");
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


        if (confirmacaoEmailContato) {
          confirmacaoEmailContato.textContent = state.solicitanteEndereco?.email || "Não cadastrado";
        }
        if (confirmacaoTelefoneContato) {
          const tel = state.solicitanteEndereco?.phoneNumber || state.solicitanteEndereco?.mobileNumber;
          confirmacaoTelefoneContato.textContent = tel ? tel.trim() : "Não cadastrado";
        }
        if (chkConfirmacaoFinal) {
          chkConfirmacaoFinal.checked = false;
          const containerConfirmacaoFinal = document.getElementById("containerConfirmacaoFinal");
          if (containerConfirmacaoFinal) {
            containerConfirmacaoFinal.classList.remove("erro-input");
          }
        }
        if (btnConfirmarEnvioFinal) {
          btnConfirmarEnvioFinal.disabled = false;
          btnConfirmarEnvioFinal.textContent = "Confirmar Coleta";
        }
        dialogConfirmacaoEnvio.showModal();
      }
    });

    // Controladores do Dialog de Confirmação de Envio (Requisito 1)
    if (chkConfirmacaoFinal) {
      chkConfirmacaoFinal.addEventListener("change", () => {
        const containerConfirmacaoFinal = document.getElementById("containerConfirmacaoFinal");
        if (chkConfirmacaoFinal.checked && containerConfirmacaoFinal) {
          containerConfirmacaoFinal.classList.remove("erro-input");
        }
      });
    }

    if (btnCancelarConfirmacao && dialogConfirmacaoEnvio) {
      btnCancelarConfirmacao.addEventListener("click", () => {
        dialogConfirmacaoEnvio.close();
      });
    }

    if (dialogConfirmacaoEnvio) {
      dialogConfirmacaoEnvio.addEventListener("input", (evento) => {
        if (evento.target.tagName === "INPUT") {
          evento.target.classList.remove("erro-input");
        }
      });
    }

    if (btnFecharSucesso && dialogSucesso) {
      btnFecharSucesso.addEventListener("click", () => {
        dialogSucesso.close();
      });
    }

    if (btnConfirmarEnvioFinal) {
      btnConfirmarEnvioFinal.addEventListener("click", async () => {
        btnConfirmarEnvioFinal.disabled = true;
        btnConfirmarEnvioFinal.textContent = "Enviando...";

        // Validação dos contatos adicionais dentro do dialog
        const solicitanteEmailAdicional = document.getElementById("solicitanteEmailAdicional");
        const solicitanteTelefoneAdicional = document.getElementById("solicitanteTelefoneAdicional");
        let adicionaisValidos = true;

        function marcarErroLocal(elemento) {
          if (!elemento) return;
          elemento.classList.remove("erro-input");
          void elemento.offsetWidth; // Força reflow para reiniciar animação
          elemento.classList.add("erro-input");
        }

        if (solicitanteEmailAdicional && solicitanteEmailAdicional.value.trim() !== "") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(solicitanteEmailAdicional.value.trim())) {
            marcarErroLocal(solicitanteEmailAdicional);
            adicionaisValidos = false;
          }
        }

        if (solicitanteTelefoneAdicional && solicitanteTelefoneAdicional.value.trim() !== "") {
          const phoneDigits = solicitanteTelefoneAdicional.value.replace(/\D/g, "");
          if (phoneDigits.length < 10) {
            marcarErroLocal(solicitanteTelefoneAdicional);
            adicionaisValidos = false;
          }
        }

        // Validação do checkbox de confirmação final
        if (chkConfirmacaoFinal && !chkConfirmacaoFinal.checked) {
          const containerConfirmacaoFinal = document.getElementById("containerConfirmacaoFinal");
          marcarErroLocal(containerConfirmacaoFinal);
          adicionaisValidos = false;
        }

        if (!adicionaisValidos) {
          btnConfirmarEnvioFinal.disabled = false;
          btnConfirmarEnvioFinal.textContent = "Confirmar Coleta";
          return;
        }

        // Captura itens de cubagem dinâmicos
        const cubagemItens = [];
        const containerCubagem = document.getElementById("containerCubagem");
        if (containerCubagem) {
          const linhas = containerCubagem.querySelectorAll(".coluna-cubagem");
          linhas.forEach(linha => {
            const volumesVal = linha.querySelector(".input-volumes")?.value || "";
            const comprimentoVal = linha.querySelector(".input-comprimento")?.value || "";
            const larguraVal = linha.querySelector(".input-largura")?.value || "";
            const alturaVal = linha.querySelector(".input-altura")?.value || "";

            // Substitui a vírgula decimal por ponto para converter em número flutuante
            const compLimpo = comprimentoVal.replace(",", ".");
            const largLimpo = larguraVal.replace(",", ".");
            const altLimpo = alturaVal.replace(",", ".");

            if (volumesVal || comprimentoVal || larguraVal || alturaVal) {
              cubagemItens.push({
                volumes: parseInt(volumesVal, 10) || 0,
                comprimento: parseFloat(compLimpo) || 0,
                largura: parseFloat(largLimpo) || 0,
                altura: parseFloat(altLimpo) || 0
              });
            }
          });
        }

        // Captura o token do Google reCAPTCHA v3 de forma invisível se a biblioteca estiver carregada
        let recaptchaToken = "";
        if (typeof grecaptcha !== 'undefined' && typeof grecaptcha.execute === 'function') {
          try {
            recaptchaToken = await grecaptcha.execute('6LehugotAAAAAAKNMsMey-iHvpAbKNPDiDDFqEf4', { action: 'solicitar_coleta' });
          } catch (e) {
            console.error("Erro ao gerar token reCAPTCHA:", e);
          }
        }

        const emailCadastro = state.solicitanteEndereco?.email || "";
        const emailAdicional = document.getElementById("solicitanteEmailAdicional")?.value.trim() || "";

        const telCadastro = (state.solicitanteEndereco?.phoneNumber || state.solicitanteEndereco?.mobileNumber || "").trim();
        const telAdicional = document.getElementById("solicitanteTelefoneAdicional")?.value.trim() || "";

        const payload = {
          solicitanteDoc: document.getElementById("solicitanteDoc")?.value || "",
          solicitanteNome: document.getElementById("solicitanteNome")?.value || "",
          solicitanteEmail: emailCadastro,
          solicitanteTelefone: telCadastro,
          solicitanteEmailAdicional: emailAdicional,
          solicitanteTelefoneAdicional: telAdicional,
          tipoSolicitante: document.querySelector('input[name="tipoSolicitante"]:checked')?.value || "",
          remetenteDoc: document.getElementById("remetenteDoc")?.value || "",
          remetenteNome: state.remetenteEndereco?.razaoSocial || "",
          destinatarioDoc: document.getElementById("destinatarioDoc")?.value || "",
          destinatarioNome: state.destinatarioEndereco?.razaoSocial || "",
          destinatarioCidade: state.destinatarioEndereco?.city?.name || "",
          destinatarioUf: state.destinatarioEndereco?.city?.state?.code || "",
          cepColeta: document.getElementById("cepInput")?.value || "",
          ruaColeta: document.getElementById("logradouroInput")?.value || "",
          numeroColeta: document.getElementById("numeroInput")?.value || "",
          complementoColeta: document.getElementById("complementoInput")?.value || "",
          bairroColeta: document.getElementById("bairroInput")?.value || "",
          cidadeColeta: document.getElementById("cidadeInput")?.value || "",
          ufColeta: document.getElementById("estadoInput")?.value || "",
          naturezaMercadoria: document.getElementById("naturezaMercadoria")?.value || "",
          numeroNf: document.getElementById("numeroNf")?.value || "",
          valorNf: document.getElementById("valorNf")?.value || "",
          qtdVolumes: document.getElementById("qtdVolumes")?.value || "",
          pesoReal: document.getElementById("pesoReal")?.value || "",
          cubagemItens, // Adicionado ao payload
          horarioAbertura: document.getElementById("horarioAbertura")?.value || "",
          horarioFechamento: document.getElementById("horarioFechamento")?.value || "",
          horarioAlmoco: document.querySelector('input[name="horarioAlmoco"]:checked')?.value || "",
          observacoes: document.getElementById("observacoes")?.value || "",
          recaptchaToken // Envia o token opcional de reCAPTCHA
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
            if (sucessoOrdemColeta) {
              sucessoOrdemColeta.textContent = result.data?.protocolo || "Sem Ordem de Coleta";
            }
            const emailCadastro = state.solicitanteEndereco?.email || "Não localizado";
            const emailAdicional = document.getElementById("solicitanteEmailAdicional")?.value.trim() || "";
            if (sucessoEmailContato) {
              sucessoEmailContato.textContent = emailAdicional
                ? `${emailCadastro} / ${emailAdicional}`
                : emailCadastro;
            }

            const telCadastro = (state.solicitanteEndereco?.phoneNumber || state.solicitanteEndereco?.mobileNumber || "").trim();
            const telAdicional = document.getElementById("solicitanteTelefoneAdicional")?.value.trim() || "";
            if (sucessoTelefoneContato) {
              const telCadastroTexto = telCadastro || "Não localizado";
              sucessoTelefoneContato.textContent = telAdicional
                ? `${telCadastroTexto} / ${telAdicional}`
                : telCadastroTexto;
            }
            if (dialogConfirmacaoEnvio) {
              dialogConfirmacaoEnvio.close();
            }
            if (dialogSucesso) {
              dialogSucesso.showModal();
            }
            formulario.reset();
          } else {
            mostrarAlerta(result.message || "Erro desconhecido", "Erro ao Solicitar Coleta", "❌");
            btnConfirmarEnvioFinal.disabled = false;
            btnConfirmarEnvioFinal.textContent = "Confirmar Coleta";
          }
        } catch (err) {
          mostrarAlerta("Erro de rede. Por favor, tente novamente.", "Erro de Rede", "🌐");
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
      if (state.maskTelefoneAdicional) state.maskTelefoneAdicional.value = "";

      // 5. Oculta o grupo de solicitante e as seções adicionais
      const grupoEscondidoSolicitante = document.getElementById("grupoEscondidoSolicitante");
      if (grupoEscondidoSolicitante) {
        grupoEscondidoSolicitante.classList.remove("visivel");
        grupoEscondidoSolicitante.classList.add("oculto");
      }
      const secoesFormularioAdicionais = document.getElementById("secoesFormularioAdicionais");
      if (secoesFormularioAdicionais) {
        secoesFormularioAdicionais.classList.remove("visivel");
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

      // Usamos setTimeout para rodar após o browser limpar os valores dos inputs nativos
      setTimeout(() => {
        // 8. Reseta os grupos de cubagem
        const containerCubagem = document.getElementById("containerCubagem");
        if (containerCubagem) {
          const linhas = containerCubagem.querySelectorAll(".coluna-cubagem");
          linhas.forEach((linha, index) => {
            if (index === 0) {
              const inputVol = linha.querySelector(".input-volumes");
              if (inputVol) inputVol.value = "1";
              const inputComp = linha.querySelector(".input-comprimento");
              if (inputComp) inputComp.value = "";
              const inputLarg = linha.querySelector(".input-largura");
              if (inputLarg) inputLarg.value = "";
              const inputAlt = linha.querySelector(".input-altura");
              if (inputAlt) inputAlt.value = "";
            } else {
              linha.remove();
            }
          });
        }
        const erroSomaCubagem = document.getElementById("erroSomaCubagem");
        if (erroSomaCubagem) {
          erroSomaCubagem.textContent = "";
          erroSomaCubagem.classList.add("oculto");
          erroSomaCubagem.classList.remove("visivel");
        }

        // Força a atualização reativa da UI de cubagem após o reset
        if (typeof window.recalcularCubagemTotal === "function") {
          window.recalcularCubagemTotal();
        }
      }, 0);
    });
  }
});
