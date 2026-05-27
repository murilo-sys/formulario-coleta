// api/consultar-cnpj.js

module.exports = async function (req, res) {
  // Garante que o corpo está em formato de objeto mesmo se não vier pré-parseado
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      // Ignora erro de parsing
    }
  }

  if (!body) {
    return res.status(400).json({ error: "Corpo da requisição inválido ou vazio" });
  }

  const { cnpj } = body;

  if (!cnpj || cnpj.length !== 14) {
    return res.status(400).json({ error: "O Cnpj enviado é invalido ou está incompleto" })
  }

  const corpoGraphQL = {
    query: `
      query company($params: CompanyInput!) {
        company(params: $params) {
          edges {
            node {
              name
              cnpj
              mainAddress { postalCode line1 neighborhood }
            }
          }
        }
      }
    `,
    variables: { params: { cnpj: cnpj } }
  };

  try {
    const token = process.env.TOKEN_API;

    const respostaESL = await fetch('https://globalcargo.eslcloud.com.br/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(corpoGraphQL)
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
    return res.status(500).json({ error: "Erro na comunicação com a ESL", details: erro.message });
  }
}