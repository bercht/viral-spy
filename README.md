# 🕵️ Viral Spy

Instagram Scraper com análise de IA e chat interativo com Assistant da OpenAI.

## 📋 Funcionalidades

- **Scraping de perfis do Instagram** via integração com workflow n8n
- **Dashboard intuitivo** com histórico de análises
- **Status em tempo real** com atualizações de progresso
- **Chat com IA** usando OpenAI Assistants API
- **Análise automática** de conteúdo viral
- **Autenticação** via Manus OAuth

## 🚀 Tecnologias

- **Frontend**: React 19 + Tailwind CSS 4 + Vite
- **Backend**: Express 4 + tRPC 11
- **Database**: MySQL/TiDB (via Drizzle ORM)
- **Auth**: Manus OAuth
- **AI**: OpenAI Assistants API
- **Automation**: n8n workflow

## 📦 Instalação

### Pré-requisitos

- Node.js 22+
- pnpm
- Banco de dados MySQL/TiDB
- Conta OpenAI com API key
- Workflow n8n configurado

### Passos

1. Clone o repositório:
```bash
git clone https://github.com/bercht/viral-spy.git
cd viral-spy
```

2. Instale as dependências:
```bash
pnpm install
```

3. Configure as variáveis de ambiente:

Crie um arquivo `.env` na raiz do projeto com:

```env
# Database
DATABASE_URL=mysql://user:password@host:port/database

# OpenAI
OPENAI_API_KEY=sk-...

# Manus OAuth (fornecido pela plataforma)
JWT_SECRET=...
OAUTH_SERVER_URL=...
VITE_APP_ID=...
VITE_OAUTH_PORTAL_URL=...
OWNER_OPEN_ID=...
OWNER_NAME=...

# App Config
VITE_APP_TITLE="Viral Spy"
VITE_APP_LOGO=/logo.svg
```

4. Execute as migrações do banco:
```bash
pnpm db:push
```

5. Inicie o servidor de desenvolvimento:
```bash
pnpm dev
```

O site estará disponível em `http://localhost:3000`

## 🔧 Integração com n8n

O sistema se integra com um workflow n8n para realizar o scraping do Instagram.

### Configuração do Webhook

O webhook do n8n deve estar configurado em:
```
https://n8n.srv1027542.hstgr.cloud/webhook/viralspy
```

### Payload do Webhook

Quando um scraping é iniciado, o site envia:
```json
{
  "scrapingId": 123,
  "userId": 456,
  "urls": ["https://www.instagram.com/username/"],
  "resultsLimit": 200
}
```

### Notificações de Status

O workflow n8n deve enviar atualizações de status para:
```
POST /api/trpc/scraping.updateStatus
```

Com o payload:
```json
{
  "scrapingId": 123,
  "status": "processing",
  "currentStep": "Capturando dados do perfil",
  "progress": 30,
  "spreadsheetUrl": "...",
  "analysisUrl": "...",
  "assistantId": "asst_...",
  "assistantUrl": "..."
}
```

Consulte `N8N_INTEGRATION.md` para instruções detalhadas sobre onde inserir os nós de notificação no workflow.

## 🗄️ Estrutura do Banco de Dados

### Tabela `scrapings`
- Armazena informações sobre cada análise
- Campos: urls, status, progress, spreadsheetUrl, analysisUrl, assistantId, threadId

### Tabela `chatMessages`
- Armazena mensagens do chat com o Assistant
- Campos: scrapingId, role, content, createdAt

### Tabela `users`
- Gerenciada automaticamente pelo sistema de autenticação Manus

## 🤖 Chat com OpenAI Assistant

O sistema cria automaticamente uma thread para cada scraping e permite conversas com o Assistant criado pelo workflow n8n.

**Fluxo**:
1. Workflow n8n cria um Assistant com os dados da análise
2. Site recebe o `assistantId` via webhook de status
3. Usuário acessa a página de chat
4. Sistema cria uma thread automaticamente
5. Mensagens são enviadas e respostas são recebidas via polling

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Testes
pnpm test

# Migrations
pnpm db:push
```

## 🔐 Segurança

- Todas as rotas de API são protegidas por autenticação
- API keys são armazenadas como variáveis de ambiente
- Sessões gerenciadas via cookies HTTP-only
- CORS configurado adequadamente

## 📄 Licença

MIT

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## 📞 Suporte

Para dúvidas ou problemas, abra uma issue no GitHub.

---

Desenvolvido com ❤️ usando [Manus](https://manus.im)
