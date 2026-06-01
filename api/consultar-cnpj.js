const cooldowns = new Map(); // ip -> timestamp

//Função dessa rota
module.exports = async function (req, res) {
  // CORS Headers para Vercel com restrição de origem (Secure by Default)
  if (res && typeof res.setHeader === 'function') {
    const origin = req.headers.origin;
    const isLocal = process.env.NODE_ENV === 'development' || process.env.IS_LOCAL === 'true';
    const allowedOrigin = process.env.ALLOWED_ORIGIN; // Sem fallback para '*'

    if (isLocal && origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (allowedOrigin && origin === allowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      // Bloqueia por padrão caso a origem não coincida ou ALLOWED_ORIGIN não esteja configurada
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin || 'https://blocked-by-cors.invalid');
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Verifica o metodo utilização na requisição -- Pode utilizar apenas POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo não autorizado" });
  }

  // Rate Limiter de 3 segundos por IP (Gatilho de segurança backend)
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
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
  if (!cnpjLimpo || cnpjLimpo.length !== 14 || isNaN(cnpjLimpo)) {
    return res.status(400).json({ error: "O Cnpj enviado é invalido ou está incompleto", body: cnpjLimpo })
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
