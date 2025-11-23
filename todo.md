# Viral Spy - TODO

## Fase 1: Schema do Banco de Dados
- [x] Criar tabela de scrapings
- [x] Criar tabela de status de scraping
- [x] Criar tabela de assistants
- [x] Push do schema para o banco

## Fase 2: Backend
- [x] Endpoint para iniciar scraping (chama webhook n8n)
- [x] Endpoint para atualizar status do scraping
- [x] Endpoint para listar histórico de scrapings
- [x] Endpoint para obter detalhes de um scraping
- [x] Endpoint para chat com Assistant
- [x] Endpoint para obter mensagens do chat

## Fase 3: Frontend - Dashboard
- [x] Página de login (já existe via Manus)
- [x] Dashboard com formulário de scraping
- [x] Lista de histórico de scrapings
- [x] Card de scraping com status em tempo real
- [x] Indicador visual de progresso

## Fase 4: Frontend - Chat
- [x] Página de chat com Assistant
- [x] Interface de mensagens
- [x] Envio e recebimento de mensagens
- [x] Histórico de conversas

## Fase 5: Integração N8n
- [x] Configurar webhook do n8n
- [x] Adicionar nós de notificação no workflow n8n
- [x] Testar atualização de status em tempo real

## Fase 6: Testes e Deploy
- [x] Testar fluxo completo de scraping
- [x] Testar chat com Assistant
- [x] Criar checkpoint
- [x] Documentar instruções de uso
