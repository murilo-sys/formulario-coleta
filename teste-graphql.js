const fs = require('fs');

function loadEnv(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.substring(1, value.length - 1);
        else if (value.startsWith("'") && value.endsWith("'")) value = value.substring(1, value.length - 1);
        process.env[match[1]] = value.trim();
      }
    });
  }
}

loadEnv('.env');
loadEnv('.env.local');

const corpoGraphQL = {
  query: `
    query individual($params: IndividualInput!, $after: String, $before: String, $first: Int, $last: Int){
      individual(params: $params, after: $after, before: $before, first: $first, last: $last){
        edges{
          node{
            cpf
            name
            email
            phoneNumber
            mobileNumber
          }
        }
      }
    }
  `,
  variables: { params: { cpf: '12345678909' } } // fake CPF
};

fetch('https://globalcargo.eslcloud.com.br/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.TOKEN_API}`
  },
  body: JSON.stringify(corpoGraphQL)
})
.then(res => res.text())
.then(console.log)
.catch(console.error);
