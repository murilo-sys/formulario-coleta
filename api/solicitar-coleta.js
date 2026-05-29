// api/solicitar-coleta.js

const NATUREZAS_BLOQUEADAS = ["liquido", "quimica_diversos", "artigos_perigosos"];

// Helper simples para higienização contra XSS e injeção de HTML
const sanitizeInput = str => {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
};

module.exports = async function (req, res) {
  // Apenas aceita método POST
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não autorizado" });
  }

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

  // 1. Sanitização básica contra HTML/XSS nos inputs textuais livres
  body.solicitanteNome = sanitizeInput(body.solicitanteNome);
  body.observacoes = sanitizeInput(body.observacoes);

  // 2. Validação de Pessoa Física (Bypass de segurança)
  const solicitanteDocLimpo = String(body.solicitanteDoc || "").replace(/\D/g, "");
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
    { campo: "horarioFechamento", nome: "Horário de fechamento" },
    { campo: "observacoes", nome: "Observações da coleta" }
  ];

  for (const item of camposObrigatorios) {
    const valor = body[item.campo];
    if (valor === undefined || valor === null || String(valor).trim() === "") {
      return res.status(400).json({
        message: `O campo '${item.nome}' é obrigatório e deve ser preenchido.`
      });
    }
  }

  // 5. Validação redundante do Array de Cubagem no Backend (Defense in Depth)
  const cubagem = body.cubagemItens;
  if (cubagem !== undefined) {
    if (!Array.isArray(cubagem)) {
      return res.status(400).json({ message: "Os dados de cubagem fornecidos são inválidos." });
    }
    for (let i = 0; i < cubagem.length; i++) {
      const item = cubagem[i];
      if (typeof item.comprimento !== 'number' || item.comprimento <= 0 ||
          typeof item.largura !== 'number' || item.largura <= 0 ||
          typeof item.altura !== 'number' || item.altura <= 0) {
        return res.status(400).json({
          message: `As dimensões da cubagem no volume ${i + 1} devem ser números válidos maiores que zero.`
        });
      }
    }
  }

  // Se tudo estiver correto, simula abertura da coleta com sucesso
  return res.status(200).json({
    message: "Solicitação de coleta aberta com sucesso!",
    data: {
      protocolo: Math.floor(100000 + Math.random() * 900000),
      dataAbertura: new Date().toISOString()
    }
  });
};
