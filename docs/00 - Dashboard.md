# 🧠 Dashboard do Projeto "semana."

Bem-vindo ao centro de controle do seu app! 
Esta pasta serve como o **Cérebro do Projeto**.

## 📍 Navegação Rápida
- [[01 - Roadmap e Tarefas]] — *O que estamos fazendo agora, backlog e bugs.*
- [[02 - Decisões de Design]] — *Por que escolhemos as cores, as fontes e a arquitetura atual.*
- [[../ANALISE-APP|Análise Inicial do App]] — *Documento de análise técnica (clique para abrir a análise que está na raiz).*

## 📊 Status Resumido (Hoje)
- **Fase Atual:** Polimento da Rota de Histórico, Usabilidade de Logs e Estabilidade DB.
- **Entregas Recentes (Hoje):**
  - 🎨 **Redesign Completo da Rota `/history`:** CSS SaaS estilo Notion/Stripe, agrupamento inteligente por semana (sticky headers), modal genérico e gerenciamento visual de tags.
  - 📅 **Edição de Data em Registros:** Permite alterar tanto o horário quanto a data de um log existente no componente `LogItem`, reatribuindo para o dia correto no banco (`upsertDay`).
  - 📐 **Reestruturação da Tela Home (`page.tsx`):** Ordem dos cards alinhada (Calendário colapsável → Painel de Log → Humor Diário → Registros de Hoje).
  - 🗄️ **Sincronização & Resiliência DB (Neon/Drizzle):** Migração forçada do schema (tabelas `tags` e `log_tags`), prevenção de erros de array sintático com Drizzle e 360 testes unitários/integração passando.
- **Maior Desafio Atual:** Modularização progressiva do `globals.css` (CSS Modules).

---
*Dica: Aperte `Ctrl+O` no Obsidian para abrir a busca rápida e pular entre estas notas.*
