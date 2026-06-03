# Formulário de Coleta

Sistema de interface de usuário (frontend) e funções serveless (backend) para solicitação de coletas com validação inteligente de CNPJ e blindagem automatizada contra robôs e abusos.

## 🚀 Funcionalidades

- **Formulário Dinâmico**: Validação avançada em tempo real de contatos (e-mails/telefones adicionais), cubagem de itens e classificações de mercadorias.
- **Consulta CNPJ Integrada**: Auto-preenchimento e validação de informações cadastrais via API de CNPJ integrada no backend.
- **Segurança e Blindagem**:
  - **Google reCAPTCHA v3 (Invisível)**: Protege as rotas de consulta de CNPJ e envio de formulário de forma transparente ao usuário.
  - **Rate Limiting por IP**: Limitação estrita de consultas de CNPJ por IP (cooldown de 3 segundos entre buscas e teto de requisições por janela temporal).
  - **Bloqueio Temporário (IP Ban)**: Ban automático temporário de 2 horas para IPs com comportamento suspeito de spam de consultas.
  - **CORS & Origens Seguras**: Restrição rígida de origens de requisição permitidas para impedir acessos cruzados não autorizados.

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript moderno (ES6+), biblioteca IMask.
- **Backend**: Node.js rodando em Vercel Serverless Functions.

## 🔧 Configuração e Instalação

### Pré-requisitos
- Node.js instalado localmente.
- Vercel CLI (opcional para simulação local de Serverless Functions).

### Instalação
1. Clone o repositório.
2. Instale as dependências (se houver/necessário):
   ```bash
   npm install
   ```

### Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto contendo as variáveis necessárias (não cometa este arquivo para o Git):
```env
# URL da Origem Permitida (ex: https://seu-dominio.com)
ALLOWED_ORIGIN=http://localhost:3000

# Chave secreta do Google reCAPTCHA v3
RECAPTCHA_SECRET_KEY=sua_chave_secreta_aqui
```

---

## 🔒 Licença e Termos de Uso

**PROPRIEDADE PRIVADA E USO RESTRITO**

O uso deste código-fonte é restrito e permitido exclusivamente sob autorização prévia por escrito do proprietário dos direitos autorais. 

- **Não é permitida a distribuição**, cópia, sublicenciamento, modificação para redistribuição ou comercialização não autorizada deste software.
- Todos os direitos reservados.
