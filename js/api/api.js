// js/api/api.js
import { mostrarAlerta } from '../utils/utils.js';

const URL_API_LOCAL = "/api/consultar-cnpj";

const cacheCnpj = new Map(); // Cache centralizado na memória para evitar chamadas de API repetidas
let ultimoTimestampConsulta = 0; // Controle de tempo do cliente (cooldown de 2 segundos)

export async function consultarEmpresaPorCnpj(cnpjLimpo) {
  // 1. Se o CNPJ já foi pesquisado antes (seja sucesso ou falha), retorna o resultado em cache
  if (cacheCnpj.has(cnpjLimpo)) {
    return cacheCnpj.get(cnpjLimpo);
  }

  // 2. Cooldown de segurança do cliente: impede spam de requisições de rede
  const agora = Date.now();
  if (agora - ultimoTimestampConsulta < 3000) {
    mostrarAlerta("Por razões de segurança, aguarde pelo menos 3 segundos entre as consultas de CNPJ.", "Aviso de Segurança", "🛡️");
    return null;
  }
  ultimoTimestampConsulta = agora;

  console.log("Consultando CNPJ na API...");
  try {
    let recaptchaToken = "";
    if (typeof grecaptcha !== 'undefined' && typeof grecaptcha.execute === 'function') {
      try {
        recaptchaToken = await grecaptcha.execute('6LehugotAAAAAAKNMsMey-iHvpAbKNPDiDDFqEf4', { action: 'consultar_cnpj' });
      } catch (e) {
        console.error("Erro ao gerar token reCAPTCHA:", e);
      }
    }

    const resposta = await fetch(URL_API_LOCAL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cnpj: cnpjLimpo, recaptchaToken })
    });

    if (!resposta.ok) {
      const resultado = await resposta.json().catch(() => ({}));
      const msgErro = resultado.message || resultado.error || "Ocorreu um erro ao consultar o CNPJ.";
      mostrarAlerta(msgErro, "Aviso de Segurança", "🛡️");
      return null;
    }

    const resultado = await resposta.json();
    const empresas = resultado.data?.company?.edges;

    let endereco = null;
    if (empresas && empresas.length > 0) {
      endereco = empresas[0].node.mainAddress || null;
      if (endereco) {
        endereco.razaoSocial = empresas[0].node.name || "";
        endereco.email = empresas[0].node.email || "";
        endereco.phoneNumber = empresas[0].node.phoneNumber || "";
        endereco.mobileNumber = empresas[0].node.mobileNumber || "";
      }
    }

    // Salva no cache (salva inclusive null para evitar requisições de CNPJs inválidos)
    cacheCnpj.set(cnpjLimpo, endereco);
    return endereco;
  } catch (erro) {
    return null;
  }
}
