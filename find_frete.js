const fs = require('fs');
const json = JSON.parse(fs.readFileSync('postman.json', 'utf8'));

function findFrete(node, urls) {
    if (node.request) {
        if (node.name.toLowerCase().includes("frete") || node.name.toLowerCase().includes("calcul")) {
            urls.push({
                name: node.name, 
                url: typeof node.request.url === 'string' ? node.request.url : node.request.url?.raw, 
                method: node.request.method,
                body: node.request.body
            });
        }
    }
    if (node.item) {
        for (const child of node.item) {
            findFrete(child, urls);
        }
    }
}

const urls = [];
if (json.item) {
    for (const item of json.item) {
        findFrete(item, urls);
    }
}

console.log(JSON.stringify(urls, null, 2));
