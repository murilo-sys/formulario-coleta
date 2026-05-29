// api/consultar-cnpj.js

//Função dessa rota
module.exports = async function (req, res) {
  // CORS Headers para Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Verifica o metodo utilização na requisição -- Pode utilizar apenas POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo não autorizado" });
  }

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
  const { cnpj } = body;

  //Verifica se a variavel cnpj existe
  if (!cnpj) { return res.status(400).json({ error: "Cnpj inválido ou está incompleto" }) }

  //Limpa a variavel deixando apenas os numeros
  const cnpjLimpo = cnpj.replace(/\D/g, "")

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
