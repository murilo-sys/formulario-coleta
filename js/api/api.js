// js/api/api.js
import { mostrarAlerta } from '../utils/utils.js';

const URL_API_LOCAL = "/api/consultar-cnpj";
const URL_API_CPF = "/api/consultar-cpf";

const cacheCnpj = new Map(); // Cache centralizado na memória para evitar chamadas de API repetidas
const cacheCpf = new Map(); // Cache para CPF
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

export async function consultarPessoaPorCpf(cpfLimpo) {
  if (cacheCpf.has(cpfLimpo)) {
    return cacheCpf.get(cpfLimpo);
  }

  const agora = Date.now();
  if (agora - ultimoTimestampConsulta < 3000) {
    mostrarAlerta("Por razões de segurança, aguarde pelo menos 3 segundos entre as consultas de CPF.", "Aviso de Segurança", "🛡️");
    return null;
  }
  ultimoTimestampConsulta = agora;

  try {
    let recaptchaToken = "";
    if (typeof grecaptcha !== 'undefined' && typeof grecaptcha.execute === 'function') {
      try {
        recaptchaToken = await grecaptcha.execute('6LehugotAAAAAAKNMsMey-iHvpAbKNPDiDDFqEf4', { action: 'consultar_cpf' });
      } catch (e) {
        console.error("Erro ao gerar token reCAPTCHA:", e);
      }
    }

    const resposta = await fetch(URL_API_CPF, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cpf: cpfLimpo, recaptchaToken })
    });

    if (!resposta.ok) {
      const resultado = await resposta.json().catch(() => ({}));
      const msgErro = resultado.message || resultado.error || "Ocorreu um erro ao consultar o CPF.";
      mostrarAlerta(msgErro, "Aviso de Segurança", "🛡️");
      return null;
    }

    const resultado = await resposta.json();
    const pessoas = resultado.data?.individual?.edges;

    let pessoaExiste = false;
    if (pessoas && pessoas.length > 0) {
      pessoaExiste = true;
    } else {
      mostrarAlerta("Não encontramos seu CPF cadastrado no sistema. Para continuar, acione o nosso suporte.", "Cadastro Não Localizado", "❌");
      return null;
    }

    cacheCpf.set(cpfLimpo, pessoaExiste);
    return pessoaExiste;

  } catch (erro) {
    console.error("Erro ao consultar CPF localmente:", erro);
    mostrarAlerta("Ocorreu um erro de rede ao tentar consultar o seu CPF. Tente novamente.", "Erro de Conexão", "📶");
    return null;
  }
}
