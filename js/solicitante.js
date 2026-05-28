// js/solicitante.js
document.addEventListener("DOMContentLoaded", () => {
  const solicitanteDoc = document.getElementById("solicitanteDoc");
  const remetenteDoc = document.getElementById("remetenteDoc");
  const destinatarioDoc = document.getElementById("destinatarioDoc");
  const grupoEscondidoSolicitante = document.getElementById('grupoEscondidoSolicitante')

  // ================================================================================ //
  // CAMPO DINAMICO QUE FICA OCULTO E APARECEM EM SEGUIDA                             //
  // ================================================================================ //

  //Verifica se pode aparecer o campo que pergunta papel do solicitante
  solicitanteDoc.addEventListener('blur', () => {
    const cnpjSolicitante = maskSolicitante.unmaskedValue

    //Aqui verifica se o cnpj tem 14 caracteres
    if (cnpjSolicitante.length !== 14) return

    //Abre div escondida para selecionar o papel do solicitante
    grupoEscondidoSolicitante.classList.add('visivel')
  })

  // ================================================================================ //
  // CLIQUE ONDE É DEFINIDO O PAPEL DO SOLICITANTE                                    //
  // ================================================================================ //

  //Verifica o botão clicado no grupo que solicita o papel do solicitante
  grupoEscondidoSolicitante.addEventListener('click', (evento) => {

    //Se clicou no destinatario
    if (evento.target.value == 'destinatario') {

      //Verifica se o valor do remetente é igual a do solicitante
      if (maskRemetente.unmaskedValue == maskSolicitante.unmaskedValue) {

        //se for igual ele vai limpar
        maskRemetente.value = ""
      }

      //Ativa o campo remetente caso tiver desativado
      if (remetenteDoc.readOnly == true) {
        remetenteDoc.readOnly = false
      }

      //Coloca o valor do solicitante no destinatario
      maskDestinatario.value = solicitanteDoc.value

      //Desativa o campo destinatario
      destinatarioDoc.readOnly = true

      limparEndColeta()

      readOnlyEndColeta(false)
    }


    //Se clicou no remetente
    if (evento.target.value == 'remetente') {

      //Verifica se o valor do destinatario é igual a do solicitante
      if (maskDestinatario.unmaskedValue == maskSolicitante.unmaskedValue) {

        //se for igual ele vai limpar
        maskDestinatario.value = ""
      }

      //Ativa o campo destinatario caso tiver desativado
      if (destinatarioDoc.readOnly == true) {
        destinatarioDoc.readOnly = false
      }

      //Coloca o valor do solicitante no remetente
      maskRemetente.value = solicitanteDoc.value

      //Faz a requisição da api para preencher campo de endereço de coleta
      verificarEndRemetente()

      //Desativa o campo remetente
      remetenteDoc.readOnly = true

    }

    if (evento.target.value == 'outros') {

      //Ativa o campo destinatario caso tiver desativado
      if (destinatarioDoc.readOnly == true) {
        destinatarioDoc.readOnly = false
      }

      //Ativa o campo remetente caso tiver desativado
      if (remetenteDoc.readOnly == true) {
        remetenteDoc.readOnly = false
      }

      //Confere o campo de coleta (especificamente pelo cep), e se tiver algo ele limpa tudo
      if (maskCep.unmaskedValue.trim() != "" && maskCep.unmaskedValue.trim() == remetenteEndereco?.postalCode && cep.readOnly == true) {

        console.log("Vestigios de dados do remetente no campo de coleta, limpando...")

        readOnlyEndColeta(false)
        limparEndColeta()
      }

      //Verifica se o valor do destinatario é igual a do solicitante
      if (maskDestinatario.unmaskedValue == maskSolicitante.unmaskedValue) {

        //se for igual ele vai limpar
        maskDestinatario.value = ""
      }

      //Verifica se o valor do remetente é igual a do solicitante
      if (maskRemetente.unmaskedValue == maskSolicitante.unmaskedValue) {

        //se for igual ele vai limpar
        maskRemetente.value = ""
      }


    }
  })
});
