const fs = require('fs');
const path = require('path');

/**
 * Inicialização de cache do sistema de arquivos
 */
const filePath = path.join(process.cwd(), 'api', '_data', 'linhasCepGeral.txt');
let rawData = '';

try {
  rawData = fs.readFileSync(filePath, 'utf8');
} catch (err) {
  console.warn("Aviso: Arquivo linhasCepGeral.txt não encontrado ou vazio.", err.message);
}

const validCepsCache = new Set(
  rawData
    .split(/\r|\n/)
    .map(line => line.replace(/\D/g, '').trim())
    .filter(line => line !== '')
);

/**
 * Valida se o CEP informado pertence à área de cobertura
 * @param {string} cep - Código postal bruto
 * @returns {boolean} - Resultado da validação
 */
function procurarCep(cep) {
  try {
    const cleanCep = cep.replace(/\D/g, '').trim();

    if (validCepsCache.has(cleanCep)) {
      return true;
    }

    const cepNumber = Number(cleanCep);

    //Zona ABC
    if (cepNumber >= 9000000 && cepNumber <= 9999999) {
      return true;
    }

    //Zona cotia
    if (cepNumber >= 6700000 && cepNumber <= 6729999) {
      return true;
    }

    return false;
  } catch (err) {
    console.error("Erro durante a validação do CEP:", err);
    return false;
  }
}

/**
 * Handler HTTP Serverless (Vercel)
 */
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { cep } = req.query;

  if (!cep) {
    return res.status(400).json({ error: 'Parâmetro CEP ausente' });
  }

  const isValid = procurarCep(cep);

  return res.status(200).json({ valido: isValid });
};

module.exports.procurarCep = procurarCep;
