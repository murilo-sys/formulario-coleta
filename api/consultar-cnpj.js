function validarCNPJ(cnpj) {
  const clean = String(cnpj).replace(/\D/g, "");
  if (clean.length !== 14 || /^(\d)\1{13}$/.test(clean)) return false;

  let tamanho = clean.length - 2;
  let numeros = clean.substring(0, tamanho);
  let digitos = clean.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0), 10)) return false;

  tamanho = tamanho + 1;
  numeros = clean.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return resultado === parseInt(digitos.charAt(1), 10);
}

const cooldowns = new Map(); // ip -> timestamp

//Função dessa rota
module.exports = async function (req, res) {
  const isLocal = process.env.NODE_ENV === 'development' || process.env.IS_LOCAL === 'true';
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  const origin = req.headers.origin;

  // CORS Headers para Vercel com restrição de origem (Secure by Default)
  if (res && typeof res.setHeader === 'function') {
    if (isLocal && origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (allowedOrigin && origin === allowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin || 'https://blocked-by-cors.invalid');
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // SEC-03: Bloqueio estrito de origens não autorizadas no backend em produção
  if (!isLocal && allowedOrigin) {
    if (!origin) {
      return res.status(403).json({ error: "Acesso Proibido: Origem ausente." });
    }
    const normOrigin = origin.replace(/\/+$/, "").trim();
    const normAllowed = allowedOrigin.replace(/\/+$/, "").trim();
    const isVercelPreview = normOrigin.endsWith('.vercel.app');
    if (normOrigin !== normAllowed && !isVercelPreview) {
      return res.status(403).json({ error: "Acesso Proibido: Origem não autorizada." });
    }
  }

  // Verifica o metodo utilização na requisição -- Pode utilizar apenas POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo não autorizado" });
  }

  // Rate Limiter com Punição: Máximo de 50 consultas em 10 minutos (bloqueio de 2 horas se violado)
  const ip = req.headers['x-real-ip'] || 
             (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) || 
             req.socket.remoteAddress || 
             'unknown';
  const agora = Date.now();
  
  // Limpeza preventiva periódica do Map (evita vazamento de memória)
  if (cooldowns.size > 5000) {
    for (const [key, record] of cooldowns.entries()) {
      const banExpirou = !record.bannedUntil || agora > record.bannedUntil;
      const historyFiltrado = (record.history || []).filter(time => agora - time <= 600000);
      
      if (banExpirou && historyFiltrado.length === 0) {
        cooldowns.delete(key);
      } else {
        cooldowns.set(key, {
          history: historyFiltrado,
          bannedUntil: record.bannedUntil
        });
      }
    }
  }

  let record = cooldowns.get(ip) || { history: [], bannedUntil: 0 };

  // 1. Verifica se o IP está sob banimento ativo (2 horas = 7.200.000 ms)
  if (record.bannedUntil && agora < record.bannedUntil) {
    return res.status(429).json({
      error: "Too Many Requests",
      message: "Acesso bloqueado temporariamente por suspeita de comportamento automatizado (limite de buscas excedido)."
    });
  }

  // Filtra apenas requisições dos últimos 10 minutos (600.000 ms)
  let history = (record.history || []).filter(time => agora - time <= 600000);

  // 2. Validação de clique rápido (3 segundos)
  if (history.length > 0) {
    const ultimoAcesso = history[history.length - 1];
    if (agora - ultimoAcesso < 3000) {
      return res.status(429).json({
        error: "Too Many Requests",
        message: "Por razões de segurança, aguarde pelo menos 3 segundos entre as consultas de CNPJ."
      });
    }
  }

  // 3. Validação do limite de 50 consultas na janela de 10 minutos -> Bloqueio de 2 horas (7.200.000 ms)
  if (history.length >= 50) {
    record.bannedUntil = agora + 7200000; // 2 horas de punição
    cooldowns.set(ip, record);
    return res.status(429).json({
      error: "Too Many Requests",
      message: "Limite de segurança atingido. Seu acesso foi bloqueado temporariamente devido ao excesso de consultas realizadas (limite de buscas excedido)."
    });
  }

  // Registra o acesso atual e atualiza no Map
  history.push(agora);
  cooldowns.set(ip, {
    history: history,
    bannedUntil: record.bannedUntil
  });

  // Garante que o corpo está em formato de objeto mesmo se não vier pré-parseado
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      // Ignora erro de parsing
    }
  }

  //Verifica se o objeto existe
  if (!body) {
    return res.status(400).json({ error: "Corpo da requisição inválido ou vazio" });
  }

  // Validação opcional de Google reCAPTCHA v3 (Ativa apenas se a chave estiver configurada no .env)
  const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
  if (recaptchaSecret && !isLocal) {
    const token = body.recaptchaToken;
    if (!token) {
      return res.status(400).json({ error: "Validação de segurança (reCAPTCHA) ausente." });
    }
    try {
      const responseGoogle = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${recaptchaSecret}&response=${token}`
      });
      const googleResult = await responseGoogle.json();
      if (!googleResult.success || (googleResult.score !== undefined && googleResult.score < 0.5)) {
        return res.status(400).json({ error: "Validação de segurança falhou (reCAPTCHA suspeito)." });
      }
    } catch (e) {
      console.error("Erro na validação do reCAPTCHA:", e);
    }
  }

  //Coloca o body.cnpj em uma variavel
  const cnpj = body ? body.cnpj : undefined;

  //Verifica se a variavel cnpj existe
  if (cnpj === undefined || cnpj === null) { return res.status(400).json({ error: "Cnpj inválido ou está incompleto" }) }

  //Garante que o CNPJ seja uma string antes de formatar
  const cnpjString = String(cnpj);

  //Limpa a variavel deixando apenas os numeros
  const cnpjLimpo = cnpjString.replace(/\D/g, "")

  //Verifica se o cnpj está limpo e valido
  if (!cnpjLimpo || cnpjLimpo.length !== 14 || isNaN(cnpjLimpo) || !validarCNPJ(cnpjLimpo)) {
    return res.status(400).json({ error: "O CNPJ enviado é inválido ou está incompleto.", body: cnpjLimpo })
  }

  //Corpo da requisição
  const corpoGraphQL = {
    query: `
      query company($params: CompanyInput!) {
      company(params: $params) {
        edges {
          node {
            name
            cnpj
            email
            phoneNumber
            mobileNumber
            mainAddress {
              postalCode
              line1
              line2
              neighborhood
              number
              city {
                name
                state {
                  code
                }
              }
            }
          }
        }
      }
    }
    `,
    variables: { params: { cnpj: cnpjLimpo } }
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // Timeout de 8 segundos

  try {
    const token = process.env.TOKEN_API;

    const respostaESL = await fetch('https://globalcargo.eslcloud.com.br/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(corpoGraphQL),
      signal: controller.signal
    });

    const rawText = await respostaESL.text();
    let dados;
    try {
      dados = JSON.parse(rawText);
    } catch (e) {
      throw new Error(`ESL retornou um formato não-JSON: ${rawText}`);
    }

    // Devolve a resposta da ESL de volta para a sua tela
    return res.status(200).json(dados);

  } catch (erro) {
    let msgErro = erro.message;
    if (erro.name === 'AbortError') {
      msgErro = "Tempo limite de requisição excedido ao contatar a ESL (Timeout).";
    }
    return res.status(500).json({ error: "Erro na comunicação com a ESL", details: msgErro });
  } finally {
    clearTimeout(timeoutId);
  }
}
