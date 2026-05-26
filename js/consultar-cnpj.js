// api/consultar-cnpj.js

export default async function handler(req, res) {
  // Captura o CNPJ enviado pelo seu formulário
  const { cnpj } = req.body;

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
    // A Vercel faz o envio para a ESL em total segredo, lendo o token do painel
    const respostaESL = await fetch('https://globalcargo.eslcloud.com.br/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TOKEN_API}` // Lê com segurança na nuvem
      },
      body: JSON.stringify(corpoGraphQL)
    });

    const dados = await respostaESL.json();

    // Devolve a resposta da ESL de volta para a sua tela
    return res.status(200).json(dados);

  } catch (erro) {
    return res.status(500).json({ error: "Erro na comunicação com a ESL" });
  }
}