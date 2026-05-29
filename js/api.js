// js/api.js

const URL_API_LOCAL = "/api/consultar-cnpj";

export async function consultarEmpresaPorCnpj(cnpjLimpo) {
  try {
    const resposta = await fetch(URL_API_LOCAL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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