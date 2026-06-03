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

  // Rate Limiter de 3 segundos por IP (Gatilho de segurança backend)
  const ip = req.headers['x-real-ip'] || 
             (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) || 
             req.socket.remoteAddress || 
             'unknown';
  const agora = Date.now();
  
  // Limpeza preventiva otimizada (evita varredura O(N) em todas as requisições)
  if (cooldowns.size > 5000) {
    for (const [key, value] of cooldowns.entries()) {
      if (agora - value > 3000) {
        cooldowns.delete(key);
      }
    }
  }

  if (cooldowns.has(ip)) {
    const ultimoAcesso = cooldowns.get(ip);
    if (agora - ultimoAcesso < 3000) {
      return res.status(429).json({
        error: "Too Many Requests",
        message: "Por razões de segurança, aguarde pelo menos 3 segundos entre as consultas de CNPJ."
      });
    }
  }
  cooldowns.set(ip, agora);

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
