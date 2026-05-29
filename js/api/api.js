// js/api/api.js

const URL_API_LOCAL = "/api/consultar-cnpj";

const cacheCnpj = new Map(); // Cache centralizado na memória para evitar chamadas de API repetidas

export async function consultarEmpresaPorCnpj(cnpjLimpo) {
  // 1. Se o CNPJ já foi pesquisado antes (seja sucesso ou falha), retorna o resultado em cache
  if (cacheCnpj.has(cnpjLimpo)) {
    return cacheCnpj.get(cnpjLimpo);
  }

  console.log("Consultando CNPJ na API...");
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

    let endereco = null;
    if (empresas && empresas.length > 0) {
      endereco = empresas[0].node.mainAddress || null;
      if (endereco) {
        endereco.razaoSocial = empresas[0].node.name || "";
      }
    }

    // Salva no cache (salva inclusive null para evitar requisições de CNPJs inválidos)
    cacheCnpj.set(cnpjLimpo, endereco);
    return endereco;
  } catch (erro) {
    return null;
  }
}
