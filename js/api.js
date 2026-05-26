// js/api.js

const URL_API_LOCAL = "/api-esl";

async function consultarEmpresaPorCnpj(cnpjLimpo) {
  // 1. Montamos a estrutura da Query exata que você descobriu e testou no Insomnia
  const corpoRequisicao = {
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
                neighborhood
              }
            }
          }
        }
      }
    `,
    variables: {
      params: {
        cnpj: cnpjLimpo
      }
    }
  };

  try {
    // 2. O 'fetch' faz a viagem física até o servidor da ESL levando a nossa Query
    const resposta = await fetch(URL_API_ESL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN_API}`
      },
      body: JSON.stringify(corpoRequisicao)
    });

    // 3. Transformamos a resposta crua do servidor em um objeto legível (JSON)
    const resultado = await resposta.json();

    // 4. Navegamos pelos nós do objeto para extrair a lista de empresas encontradas
    const empresas = resultado.data?.company?.edges;

    // 5. Se encontramos alguma empresa, devolvemos apenas o endereço principal dela.
    // Se não encontramos nada, devolvemos 'null' (nada).
    if (empresas && empresas.length > 0) {
      return empresas[0].node.mainAddress || null;
    }
    return null;

  } catch (erro) {
    // Se a internet cair ou o servidor estiver fora do ar, esse bloco captura o erro
    console.error("Erro crítico na comunicação com a API da ESL:", erro);
    return null;
  }
}