# Integração N8n - Viral Spy

## Webhook do Site

O site chama o webhook do n8n quando um novo scraping é iniciado:

**URL**: `https://n8n.srv1027542.hstgr.cloud/webhook/viralspy`

**Payload enviado**:
```json
{
  "scrapingId": 123,
  "userId": 456,
  "urls": ["https://www.instagram.com/username1/"],
  "resultsLimit": 200
}
```

## Nós de Notificação de Status

Para atualizar o status em tempo real no site, adicione nós **HTTP Request** ao longo do workflow n8n:

### Configuração do Nó HTTP Request

**Method**: `POST`  
**URL**: `https://3000-ioy2xdj3qla72palqkuh8-18318e58.manusvm.computer/api/trpc/scraping.updateStatus`  
**Body Content Type**: `JSON`

**Body**:
```json
{
  "scrapingId": "={{ $node['Webhook'].json.body.scrapingId }}",
  "status": "processing",
  "currentStep": "Descrição da etapa atual",
  "progress": 25
}
```

### Pontos de Inserção Sugeridos

#### 1. Após "Code in JavaScript" (Início)
```json
{
  "scrapingId": "={{ $node['Webhook'].json.body.scrapingId }}",
  "status": "processing",
  "currentStep": "Iniciando scraping...",
  "progress": 10
}
```

#### 2. Após Chamar Apify/Scraper
```json
{
  "scrapingId": "={{ $node['Webhook'].json.body.scrapingId }}",
  "status": "processing",
  "currentStep": "Capturando dados do perfil",
  "progress": 30
}
```

#### 3. Durante Loop de Vídeos
```json
{
  "scrapingId": "={{ $node['Webhook'].json.body.scrapingId }}",
  "status": "processing",
  "currentStep": "Processando vídeos ({{ $itemIndex + 1 }} de {{ $('Split Itens').context.itemsTotal }})",
  "progress": "={{ Math.round((($itemIndex + 1) / $('Split Itens').context.itemsTotal) * 40) + 30 }}"
}
```

#### 4. Antes do GPT-4
```json
{
  "scrapingId": "={{ $node['Webhook'].json.body.scrapingId }}",
  "status": "processing",
  "currentStep": "Gerando análise com IA",
  "progress": 80
}
```

#### 5. Após Criar Assistant
```json
{
  "scrapingId": "={{ $node['Webhook'].json.body.scrapingId }}",
  "status": "processing",
  "currentStep": "Criando assistente personalizado",
  "progress": 95
}
```

#### 6. Final (Sucesso)
```json
{
  "scrapingId": "={{ $node['Webhook'].json.body.scrapingId }}",
  "status": "completed",
  "currentStep": "Análise concluída!",
  "progress": 100,
  "spreadsheetUrl": "={{ $node['Criar Planilha'].json.spreadsheetUrl }}",
  "analysisUrl": "={{ $node['Criar Planilha Análise'].json.spreadsheetUrl }}",
  "assistantId": "={{ $node['Atualizar Assistant com Vector Store'].json.id }}",
  "assistantUrl": "=https://platform.openai.com/playground/assistants?assistant={{ $node['Atualizar Assistant com Vector Store'].json.id }}"
}
```

#### 7. Em Caso de Erro
```json
{
  "scrapingId": "={{ $node['Webhook'].json.body.scrapingId }}",
  "status": "error",
  "currentStep": "Erro durante processamento",
  "errorMessage": "={{ $json.error }}"
}
```

## Campos Disponíveis

- **scrapingId**: ID do scraping (obrigatório)
- **status**: `pending` | `processing` | `completed` | `error`
- **currentStep**: Descrição textual da etapa atual
- **progress**: Número de 0 a 100
- **spreadsheetUrl**: URL da planilha com dados
- **analysisUrl**: URL da planilha com análise
- **assistantId**: ID do Assistant da OpenAI
- **assistantUrl**: URL do playground do Assistant
- **errorMessage**: Mensagem de erro (quando status = error)

## Estrutura do Workflow Atualizado

```
Webhook
  ↓
Code in JavaScript
  ↓
[Notificar: Iniciando] ← ADICIONAR
  ↓
Criar Planilha
  ↓
Chamar Apify
  ↓
[Notificar: Capturando dados] ← ADICIONAR
  ↓
Split Itens (Loop)
  ↓
  [Notificar: Processando vídeo X] ← ADICIONAR
  ↓
  Processar Vídeo
  ↓
Loop Terminou?
  ↓
[Notificar: Gerando análise] ← ADICIONAR
  ↓
Analisar com GPT-4
  ↓
Criar Assistant
  ↓
[Notificar: Criando assistente] ← ADICIONAR
  ↓
[Notificar: Concluído] ← ADICIONAR
  ↓
Respond to Webhook
```

## Teste

1. Acesse o site: https://3000-ioy2xdj3qla72palqkuh8-18318e58.manusvm.computer
2. Faça login
3. Adicione URLs do Instagram
4. Clique em "Iniciar Análise"
5. Observe o status atualizando em tempo real no histórico
