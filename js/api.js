// js/api.js
// Aponta direto para a pasta da função serverless que criamos
const URL_API_LOCAL = "/api/consultar-cnpj";

async function consultarEmpresaPorCnpj(cnpjLimpo) {
  try {
    const resposta = await fetch(URL_API_LOCAL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      // Enviamos um objeto simples com o CNPJ que a função lá em cima está esperando
      body: JSON.stringify({ cnpj: cnpjLimpo })
    });

    const resultado = await resposta.json();
    const empresas = resultado.data?.company?.edges;

    if (empresas && empresas.length > 0) {
      return empresas[0].node.mainAddress || null;
    }
    return null;
  } catch (erro) {
    console.error("Erro na comunicação:", erro);
    return null;
  }
}