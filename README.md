# Formulário de Coleta

Sistema de interface de usuário (frontend) e funções serverless (backend) para solicitação de coletas com validação inteligente de CNPJ e blindagem automatizada contra robôs e abusos.

## 🚀 Funcionalidades

- **Formulário Dinâmico**: Validação avançada em tempo real de contatos (e-mails/telefones adicionais), cubagem de itens e classificações de mercadorias.
- **Regras de Negócio Aplicadas**: Restrições de valores baseadas na natureza da mercadoria (Ex: Limite padrão de R$ 250.000,00, com restrição específica de R$ 50.000,00 para Materiais de Informática).
- **Consulta CNPJ Integrada**: Auto-preenchimento e validação de informações cadastrais via API de CNPJ integrada no backend.
- **Segurança e Blindagem**:
  - **Google reCAPTCHA v3 (Invisível)**: Protege as rotas de consulta de CNPJ e envio de formulário de forma transparente ao usuário.
  - **Rate Limiting por IP**: Limitação estrita de consultas de CNPJ por IP (cooldown de 3 segundos entre buscas e teto de requisições por janela temporal).
  - **Bloqueio Temporário (IP Ban)**: Ban automático temporário de 2 horas para IPs com comportamento suspeito de spam de consultas.
  - **CORS & Origens Seguras**: Restrição rígida de origens de requisição permitidas para impedir acessos cruzados não autorizados.

## 📁 Estrutura do Projeto

```text
formulario-coleta/
├── api/                       # Endpoints Serverless (Backend)
│   ├── _data/                 # Dados estáticos de apoio da API
│   │   └── linhasCepGeral.txt # Cache de CEPs para área de cobertura
│   ├── consultar-cnpj.js      # API de consulta de CNPJ com rate limit e ban por IP
│   ├── solicitar-coleta.js    # API de processamento do formulário de coleta
│   └── validar-cep.js         # API estática para validação de CEP e área de cobertura
├── assets/                    # Estilos globais e recursos visuais
├── js/                        # Scripts do Frontend (Lógica e Validações)
│   ├── api/                   # Integração e chamadas AJAX com o backend
│   │   └── api.js             # Chamada de consulta CNPJ no backend
│   ├── secoes/                # Comportamentos específicos de seções da tela
│   │   ├── avisoCadastro.js   # Controle de avisos sobre necessidade de cadastro
│   │   ├── cubagem.js         # Lógica e cálculos de cubagem de itens
│   │   ├── destinatario.js    # Fluxos de preenchimento do destinatário
│   │   ├── endereco.js        # Fluxos e validações de endereço de coleta
│   │   ├── horarios.js        # Seleção e validação de janelas de horários
│   │   ├── mercadoria.js      # Validações e dinâmica de mercadorias
│   │   └── solicitante.js     # Validações e dinâmica do solicitante
│   ├── utils/                 # Validadores auxiliares de documentos (CPF, CNPJ)
│   │   └── utils.js           # Funções utilitárias de validação de documentos
│   ├── index.js               # Inicialização do formulário e handlers de eventos
│   ├── masks.js               # Máscaras de entrada dinâmicas (IMask)
│   ├── state.js               # Gerenciamento de estado da aplicação
│   └── validacao.js           # Validação de formulários e submissão
├── index.html                 # Página HTML5 principal
└── README.md                  # Documentação técnica do projeto
```

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript moderno (ES6+), IMask.
- **Backend**: Node.js (Vercel Serverless Functions).

---

## 🔒 Licença e Termos de Uso

**PROPRIEDADE PRIVADA E USO RESTRITO**

O uso deste código-fonte é restrito e permitido exclusivamente sob autorização prévia por escrito do proprietário dos direitos autorais. 

- **Não é permitida a distribuição**, cópia, sublicenciamento, modificação para redistribuição ou comercialização não autorizada deste software.
- Todos os direitos reservados.
