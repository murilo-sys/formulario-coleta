const nodemailer = require('nodemailer');


function validarCPF(cpf) {
  const clean = String(cpf).replace(/\D/g, "");
  if (clean.length !== 11 || /^(\d)\1{10}$/.test(clean)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  let digito1 = resto > 9 ? 0 : resto;
  if (parseInt(clean.charAt(9), 10) !== digito1) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  resto = 11 - (soma % 11);
  let digito2 = resto > 9 ? 0 : resto;
  return parseInt(clean.charAt(10), 10) === digito2;
}

function validarCNPJ(cnpj) {
  const clean = String(cnpj).toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length !== 14) return false;

  // Evita sequências repetidas apenas se for totalmente numérico
  if (/^\d+$/.test(clean) && /^(\d)\1{13}$/.test(clean)) return false;

  const obterValorCaractere = (caractere) => {
    return caractere.charCodeAt(0) - 48;
  };

  // Validação do Primeiro Dígito Verificador (DV)
  let soma = 0;
  let peso = 5;
  for (let i = 0; i < 12; i++) {
    soma += obterValorCaractere(clean.charAt(i)) * peso;
    peso = (peso === 2) ? 9 : peso - 1;
  }
  let resto = soma % 11;
  let digito1 = resto < 2 ? 0 : 11 - resto;
  if (parseInt(clean.charAt(12), 10) !== digito1) return false;

  // Validação do Segundo Dígito Verificador (DV)
  soma = 0;
  peso = 6;
  for (let i = 0; i < 13; i++) {
    soma += obterValorCaractere(clean.charAt(i)) * peso;
    peso = (peso === 2) ? 9 : peso - 1;
  }
  resto = soma % 11;
  let digito2 = resto < 2 ? 0 : 11 - resto;

  return parseInt(clean.charAt(13), 10) === digito2;
}

const NATUREZAS_BLOQUEADAS = ["liquido", "quimica_diversos", "artigos_perigosos"];
const cooldowns = new Map(); // ip -> timestamp

// Helper simples para higienização contra XSS e injeção de HTML
const sanitizeInput = str => {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
};

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

  // Apenas aceita método POST
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não autorizado" });
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
        message: "Por razões de segurança, aguarde pelo menos 3 segundos entre as solicitações de coleta."
      });
    }
  }
  cooldowns.set(ip, agora);

  // Garante o parseamento do corpo da requisição
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ message: "Corpo da requisição inválido" });
    }
  }

  if (!body) {
    return res.status(400).json({ message: "Corpo da requisição vazio" });
  }

  // 1. Sanitização básica contra HTML/XSS nos inputs textuais livres (com coerção segura de tipo)
  body.solicitanteNome = sanitizeInput(body.solicitanteNome !== undefined && body.solicitanteNome !== null ? String(body.solicitanteNome) : "");
  body.solicitanteEmail = sanitizeInput(body.solicitanteEmail !== undefined && body.solicitanteEmail !== null ? String(body.solicitanteEmail) : "");
  body.solicitanteTelefone = sanitizeInput(body.solicitanteTelefone !== undefined && body.solicitanteTelefone !== null ? String(body.solicitanteTelefone) : "");
  body.solicitanteEmailAdicional = sanitizeInput(body.solicitanteEmailAdicional !== undefined && body.solicitanteEmailAdicional !== null ? String(body.solicitanteEmailAdicional) : "");
  body.solicitanteTelefoneAdicional = sanitizeInput(body.solicitanteTelefoneAdicional !== undefined && body.solicitanteTelefoneAdicional !== null ? String(body.solicitanteTelefoneAdicional) : "");
  body.observacoes = sanitizeInput(body.observacoes !== undefined && body.observacoes !== null ? String(body.observacoes) : "");

  // Validação opcional de Google reCAPTCHA v3 (Ativa apenas se a chave estiver configurada no .env)
  const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
  if (recaptchaSecret && !isLocal) {
    const token = body.recaptchaToken;
    if (!token) {
      return res.status(400).json({ message: "Validação de segurança (reCAPTCHA) ausente." });
    }
    try {
      const responseGoogle = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${recaptchaSecret}&response=${token}`
      });
      const googleResult = await responseGoogle.json();
      if (!googleResult.success || googleResult.score < 0.5) {
        return res.status(400).json({ message: "Validação de segurança falhou." });
      }
    } catch (e) {
      console.error("Erro na comunicação com a API do reCAPTCHA:", e);
    }
  }

  // 2. Validação de Pessoa Física (Bypass de segurança)
  const solicitanteDocLimpo = String(body.solicitanteDoc || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (solicitanteDocLimpo.length === 11) {
    return res.status(400).json({
      message: "A solicitação direta via formulário não é permitida para Pessoa Física. Entre em contato com nosso atendimento para suporte pelos telefones: (11) 3017-8990 ou (11) 2222-1260."
    });
  }

  // 3. Validação de Natureza Bloqueada
  const natureza = body.naturezaMercadoria;
  if (NATUREZAS_BLOQUEADAS.includes(natureza)) {
    return res.status(400).json({
      message: "Esta natureza de carga não é permitida para solicitação de coleta. Por favor, entre em contato direto com o nosso suporte para mercadorias restritas."
    });
  }

  // 4. Validação de Campos Obrigatórios
  const camposObrigatorios = [
    { campo: "solicitanteDoc", nome: "Documento do solicitante" },
    { campo: "solicitanteNome", nome: "Nome do solicitante" },
    { campo: "tipoSolicitante", nome: "Tipo do solicitante" },
    { campo: "remetenteDoc", nome: "Documento do remetente" },
    { campo: "destinatarioDoc", nome: "Documento do destinatário" },
    { campo: "cepColeta", nome: "CEP de coleta" },
    { campo: "ruaColeta", nome: "Rua de coleta" },
    { campo: "numeroColeta", nome: "Número de coleta" },
    { campo: "bairroColeta", nome: "Bairro de coleta" },
    { campo: "cidadeColeta", nome: "Cidade de coleta" },
    { campo: "ufColeta", nome: "Estado (UF) de coleta" },
    { campo: "naturezaMercadoria", nome: "Natureza da mercadoria" },
    { campo: "valorNf", nome: "Valor da NF" },
    { campo: "qtdVolumes", nome: "Quantidade de volumes" },
    { campo: "pesoReal", nome: "Peso real" },
    { campo: "horarioAbertura", nome: "Horário de abertura" },
    { campo: "horarioFechamento", nome: "Horário de fechamento" }
  ];

  for (const item of camposObrigatorios) {
    const valor = body[item.campo];
    if (valor === undefined || valor === null || String(valor).trim() === "") {
      return res.status(400).json({
        message: `O campo '${item.nome}' é obrigatório e deve ser preenchido.`
      });
    }
  }

  // Validação matemática rigorosa dos documentos (CPF/CNPJ) no Backend
  if (solicitanteDocLimpo.length !== 14 || !validarCNPJ(solicitanteDocLimpo)) {
    return res.status(400).json({ message: "O documento do solicitante (CNPJ) fornecido é inválido." });
  }

  const remetenteDocLimpo = String(body.remetenteDoc || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (remetenteDocLimpo.length === 11) {
    if (!validarCPF(remetenteDocLimpo)) {
      return res.status(400).json({ message: "O documento do remetente (CPF) fornecido é inválido." });
    }
  } else if (remetenteDocLimpo.length === 14) {
    if (!validarCNPJ(remetenteDocLimpo)) {
      return res.status(400).json({ message: "O documento do remetente (CNPJ) fornecido é inválido." });
    }
  } else {
    return res.status(400).json({ message: "O documento do remetente deve possuir 11 dígitos (CPF) ou 14 dígitos (CNPJ)." });
  }

  const destinatarioDocLimpo = String(body.destinatarioDoc || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (destinatarioDocLimpo.length === 11) {
    if (!validarCPF(destinatarioDocLimpo)) {
      return res.status(400).json({ message: "O documento do destinatário (CPF) fornecido é inválido." });
    }
  } else if (destinatarioDocLimpo.length === 14) {
    if (!validarCNPJ(destinatarioDocLimpo)) {
      return res.status(400).json({ message: "O documento do destinatário (CNPJ) fornecido é inválido." });
    }
  } else {
    return res.status(400).json({ message: "O documento do destinatário deve possuir 11 dígitos (CPF) ou 14 dígitos (CNPJ)." });
  }

  // Validação matemática do valor da NF, volumes e peso
  const valorNfNum = parseFloat(String(body.valorNf).replace(/\./g, "").replace(",", ".")) || 0;
  const qtdVolumesNum = parseInt(body.qtdVolumes, 10) || 0;
  const pesoRealNum = parseFloat(String(body.pesoReal).replace(/\./g, "").replace(",", ".")) || 0;

  if (valorNfNum <= 0) {
    return res.status(400).json({ message: "O valor da nota fiscal deve ser maior que zero." });
  }
  if (qtdVolumesNum <= 0) {
    return res.status(400).json({ message: "A quantidade de volumes deve ser maior que zero." });
  }
  if (pesoRealNum <= 0) {
    return res.status(400).json({ message: "O peso real deve ser maior que zero." });
  }

  // 5. Validação redundante do Array de Cubagem no Backend (Defense in Depth)
  const cubagem = body.cubagemItens;
  const totalVolumesPayload = parseInt(body.qtdVolumes, 10) || 0;

  if (cubagem !== undefined) {
    if (!Array.isArray(cubagem)) {
      return res.status(400).json({ message: "Os dados de cubagem fornecidos são inválidos." });
    }
    let somaVolumes = 0;
    for (let i = 0; i < cubagem.length; i++) {
      const item = cubagem[i];
      if (typeof item.volumes !== 'number' || item.volumes <= 0 ||
        typeof item.comprimento !== 'number' || item.comprimento <= 0 ||
        typeof item.largura !== 'number' || item.largura <= 0 ||
        typeof item.altura !== 'number' || item.altura <= 0) {
        return res.status(400).json({
          message: `O grupo de cubagem ${i + 1} deve possuir quantidade de volumes e dimensões válidas e maiores que zero.`
        });
      }
      somaVolumes += item.volumes;
    }

    if (somaVolumes !== totalVolumesPayload) {
      return res.status(400).json({
        message: `A soma das quantidades de volumes dos grupos de cubagem (${somaVolumes}) deve ser igual ao total de volumes informado (${totalVolumesPayload}).`
      });
    }
  }

  // ========================================================================= //
  //                    INTEGRAÇÃO COM A API GRAPHQL DA ESL CLOUD              //
  // ========================================================================= //

  const queryGraphQL = `
    mutation pickCreate($params: PickMutationInput!) {
      pickCreate(params: $params) {
        success
        errors
        resource {
          id
          sequenceCode
        }
      }
    }
  `;

  const now = new Date();
  const todayISO = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeISO = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

  // Processamento do fechamento para almoço
  let lunchStart = null;
  let lunchEnd = null;
  if (body.horarioAlmoco && body.horarioAlmoco.includes('-')) {
    const parts = body.horarioAlmoco.split('-');
    lunchStart = parts[0].trim();
    lunchEnd = parts[1].trim();
  }

  // Processamento do array de cubagem
  const cubages = (body.cubagemItens || []).map(item => ({
    volume: parseInt(item.volumes, 10) || 0,
    length: parseFloat(item.comprimento) || 0,
    width: parseFloat(item.largura) || 0,
    height: parseFloat(item.altura) || 0
  }));

  // Mapeamento das opções de natureza de mercadoria do formulário para IDs de classificação de produto na ESL Cloud
  // Sinta-se livre para ajustar estes IDs conforme a tabela de classificação do seu sistema ESL
  const MAPA_NATUREZAS = {
    "cosmetico_geral": 17602,     // Cosméticos em geral
    "material_eletrico": 21059,   // Equipamentos elétricos e eletrônicos
    "alimenticio_geral": 15582,   // Alimentos em geral
    "saude_correlato": 551,       // Produtos de saúde / correlatos
    "produto_saude": 551,         // Produtos de saúde
    "confeccoes_tecidos": 15566,  // Confecções e tecidos
    "autopecas": 15563,           // Autopeças
    "pecas_automotivas": 19423,   // Peças automotivas
    "brindes": 33531,             // Brindes
    "bijuterias": 19424,          // Bijuterias
    "livros": 15594,              // Livros
    "equip_protecao_epi": 33528,  // Equip. de Proteção EPI
    "propaganda_visual": 33748,   // Material de propaganda e visual
    "eletroeletronicos": 21059,   // Equipamentos elétricos e eletrônicos
    "informatica": 15581,         // Material de informática
    "pecas_geral": 16989          // Peças em geral
  };

  const productClassificationId = MAPA_NATUREZAS[body.naturezaMercadoria] || null;

  // Constrói observações dinamicamente com base nos contatos adicionais
  const partesComments = [];

  if (body.observacoes && body.observacoes.trim() !== "") {
    partesComments.push(body.observacoes.trim());
  } else {
    partesComments.push("Sem observações");
  }

  const numeroNfLimpo = body.numeroNf ? body.numeroNf.trim() : "";
  partesComments.push(`Numero da NF-e: ${numeroNfLimpo || "Não informada"}`);

  if (body.solicitanteTelefoneAdicional && body.solicitanteTelefoneAdicional.trim() !== "") {
    partesComments.push(`Telefone Adicional: ${body.solicitanteTelefoneAdicional.trim()}`);
  }

  if (body.solicitanteTelefone && body.solicitanteTelefone.trim() !== "") {
    partesComments.push(`Telefone Solicitante: ${body.solicitanteTelefone.trim()}`);
  }

  if (body.destinatarioNome && body.destinatarioNome.trim() !== "") {
    partesComments.push(`Destinatario Nome: ${body.destinatarioNome.trim()}`)
  }

  if (body.destinatarioCidade && body.destinatarioCidade.trim() !== "") {
    const uf = (body.destinatarioUf && body.destinatarioUf.trim() !== "") ? ` - ${body.destinatarioUf.trim()}` : "";
    partesComments.push(`Cidade Destino: ${body.destinatarioCidade.trim()}${uf}`);
  }


  const commentsString = partesComments.join(" | ");

  // Mapeia todas as variáveis do formulário para o padrão PickMutationInput da ESL
  const variables = {
    params: {
      corporationId: body.corporationId ? parseInt(body.corporationId, 10) : 107892,
      pickTypeId: body.pickTypeId ? parseInt(body.pickTypeId, 10) : 866,
      requester: body.solicitanteNome,
      notificationPhone: body.solicitanteTelefone || body.solicitanteTelefoneAdicional || null,
      notificationEmail: body.solicitanteEmail || body.solicitanteEmailAdicional || null,
      customer: {
        document: String(body.solicitanteDoc || "").replace(/\D/g, ""),
        name: body.solicitanteNome
      },
      pickupLocation: {
        document: String(body.remetenteDoc || "").replace(/\D/g, ""),
        name: body.remetenteNome || "Remetente da Coleta"
      },
      requestDate: todayISO,
      requestHour: timeISO,
      serviceDate: todayISO,
      serviceStartHour: body.horarioAbertura,
      serviceEndHour: body.horarioFechamento,
      lunchBreakStartHour: lunchStart,
      lunchBreakEndHour: lunchEnd,
      comments: commentsString,
      pickAddressAttributes: {
        postalCode: String(body.cepColeta || "").replace(/\D/g, ""),
        line1: body.ruaColeta,
        number: body.numeroColeta,
        line2: body.complementoColeta || "",
        neighborhood: body.bairroColeta,
        cityByName: {
          name: body.cidadeColeta,
          stateCode: body.ufColeta
        }
      },
      pickItemsAttributes: [
        {
          sender: {
            document: String(body.remetenteDoc || "").replace(/\D/g, ""),
            name: body.remetenteNome || "Remetente da Coleta"
          },
          senderCity: {
            name: body.cidadeColeta,
            stateCode: body.ufColeta
          },
          recipient: {
            document: String(body.destinatarioDoc || "").replace(/\D/g, ""),
            name: body.destinatarioNome || "Destinatário da Coleta"
          },
          recipientCity: (body.destinatarioCidade && body.destinatarioUf) ? {
            name: body.destinatarioCidade,
            stateCode: body.destinatarioUf
          } : undefined,
          invoicesValue: parseFloat(String(body.valorNf || "").replace(/\./g, "").replace(",", ".")) || 0,
          invoicesVolumes: parseInt(body.qtdVolumes, 10) || 0,
          invoicesRealWeight: parseFloat(String(body.pesoReal || "").replace(/\./g, "").replace(",", ".")) || 0,
          productClassificationId: productClassificationId,
          pickItemCubagesAttributes: cubages
        }
      ],
      referenceNumber: "Formulário de Coleta"
    }
  };

  // Se o Modo Simulação estiver ativo pelo painel de testes local (apenas em ambiente local)
  if (isLocal && body.debugSimulate) {
    return res.status(200).json({
      message: "Solicitação de coleta aberta com sucesso! (SIMULADO)",
      data: {
        protocolo: Math.floor(100000 + Math.random() * 900000),
        dataAbertura: new Date().toISOString()
      },
      debugInfo: body.debugMode ? { query: queryGraphQL, variables } : undefined
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // Timeout de 8 segundos

  try {
    const token = process.env.TOKEN_API;
    const endpoint = 'https://globalcargo.eslcloud.com.br/graphql';

    const respostaESL = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        query: queryGraphQL,
        variables
      }),
      signal: controller.signal
    });

    const resultado = await respostaESL.json();

    // Erros no nível de esquema/execução GraphQL
    if (resultado.errors && resultado.errors.length > 0) {
      return res.status(400).json({
        message: resultado.errors[0].message || "Erro retornado pela API da ESL Cloud",
        errors: resultado.errors,
        debugInfo: (isLocal && body.debugMode) ? { query: queryGraphQL, variables } : undefined
      });
    }

    const pickCreateResult = resultado.data?.pickCreate;

    if (pickCreateResult) {
      // Erros de negócio da plataforma (regras de transporte/cadastro)
      if (!pickCreateResult.success) {
        return res.status(400).json({
          message: pickCreateResult.errors?.join(", ") || "A API retornou falha na validação de negócio da coleta.",
          errors: pickCreateResult.errors,
          debugInfo: (isLocal && body.debugMode) ? { query: queryGraphQL, variables } : undefined
        });
      }

      // Sucesso na criação! Retorna o ID e o sequenceCode (protocolo da coleta)
      const seq = pickCreateResult.resource?.sequenceCode;

      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const listaEmail = [
        body.solicitanteEmail,
        body.solicitanteEmailAdicional
      ]
        .filter(Boolean)
        .flatMap(emailStr => emailStr.split(/[;,]/))
        .map(email => email.trim())
        .filter(Boolean);

      const mailOptions = {
        from: `"Global Cargo" <${process.env.SMTP_USER}>`,
        to: listaEmail.join(', '),
        bcc: 'coletas@globalcargo.com.br',
        subject: `Solicitação de Coleta - Nº O.C #${seq}`,
        html: `
        <div style="font-family: sans-serif; color: #333; line-height: 1.5; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
          <h2 style="color: #1a3a6b; margin-top: 0; margin-bottom: 16px; font-size: 20px; border-bottom: 2px solid #1a3a6b; padding-bottom: 8px;">Olá, ${body.solicitanteNome}!</h2>
          <p style="margin: 0 0 16px 0;">Recebemos com sucesso a sua solicitação de coleta nº <strong>${seq}</strong>.</p>
          <p style="margin: 0 0 16px 0;">Nossa equipe realizará a análise do pedido e retornará com a confirmação da coleta o mais breve possível.</p>
          <p style="margin: 0 0 16px 0;"><strong>Prazo de retorno:</strong> até <strong>60 minutos.</strong></p>
          <p style="margin: 0 0 24px 0;">Em caso de dúvidas, entre em contato com a equipe de suporte da Global informando o número da sua solicitação.</p>
          
          <p style="margin: 0; color: #555;">Atenciosamente,</p>
          <p style="margin: 4px 0 0 0; font-weight: bold; color: #1a3a6b; font-size: 16px;">Global Cargo</p>
          
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0 15px 0;">
          <p style="font-size: 12px; color: #777; margin: 0;">Esta é uma mensagem automática, por favor não responda.</p>
        </div>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log('E-mail enviado com sucesso.');
      } catch (emailError) {
        console.error('Erro no envio do e-mail de confirmação:', emailError);
      }

      return res.status(200).json({
        message: "Solicitação de coleta aberta com sucesso!",
        data: {
          protocolo: seq,
          dataAbertura: new Date().toISOString(),
          id: pickCreateResult.resource?.id
        },
        debugInfo: (isLocal && body.debugMode) ? { query: queryGraphQL, variables } : undefined
      });
    }

    throw new Error("Resposta da API ESL não continha dados de pickCreate.");

  } catch (erro) {
    let msgErro = erro.message;
    if (erro.name === 'AbortError') {
      msgErro = "Tempo limite de requisição excedido ao contatar a ESL Cloud (Timeout).";
    }
    return res.status(500).json({
      message: "Erro na comunicação com a ESL Cloud",
      details: msgErro,
      debugInfo: (isLocal && body.debugMode) ? { query: queryGraphQL, variables } : undefined
    });
  } finally {
    clearTimeout(timeoutId);
  }
};
