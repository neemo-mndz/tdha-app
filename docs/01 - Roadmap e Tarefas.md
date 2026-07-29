# 🗺️ Roadmap e Tarefas

Aqui acompanhamos o que precisa ser feito. Dividimos o roadmap em 3 Fases com base na última auditoria técnica.

## 🏁 Fase 1: Correções Críticas (UX e Performance)
- [x] **Mobile UX (CSS):** Tornar botões de edit/delete do log sempre visíveis no mobile (via media query `hover: none`) e adicionar `font-size: 16px` nos inputs de time para evitar o zoom automático no iOS.
- [ ] **Desacoplamento de Relatórios:** Aplicar `dynamic import()` no `jspdf` e `exceljs` na página de Profile para reduzir o bundle inicial.
- [x] **Sincronização de Estado:** Refatorar a página Home para unificar o `useOptimistic` e sincronizar via `LogsProvider` entre o `DailyLogPanel` e o `TodayLogsCard`.

## 🏗️ Fase 2: Refatoração Estrutural
- [ ] **Modularização do CSS:** Migrar progressivamente o `globals.css` para **CSS Modules** (`.module.css`), agrupando estilos por componente.
- [x] **Limpeza de Schema DB:** Regra de negócios alinhada para o campo `mood` (Dias vs Logs) e coluna desnecessária removida dos logs.
- [ ] **Error Boundaries:** Criar arquivos `error.tsx` em rotas aninhadas e adicionar *Spinners/Loading States* para as Server Actions de salvamento.

## 🚀 Fase 3: Escala e Funcionalidades PWA
- [x] **PWA Integration:** Instalação de `@serwist/next` e Service Worker para permitir *offline caching* estático e instalação PWA.
- [x] **Indexação Otimizada DB:** Adicionado índice na tabela `logs` por `day_id` para acelerar buscas de registros por dia.

## ✅ Tarefas Concluídas Anteriores e Recentes
- [x] **Redesign Completo do Histórico (`/history`):** Estilos SaaS modernos (Notion/Stripe style), agrupamento cronológico por semana com sticky headers e filtro por tags.
- [x] **Edição de Data em Registros:** Permitir alteração da data do log no formulário inline de edição com remanejamento automático de `dayId` via `upsertDay`.
- [x] **Reorganização de Layout da Home:** Estrutura vertical padronizada (Calendário colapsável → Painel de Registro → Humor → Lista de Registros de Hoje).
- [x] **Sincronização do Banco Cloud (Neon DB):** Migração do schema com `drizzle-kit push --force` e queries com tratamento seguro para filtros por array.
- [x] **Integração Obsidian:** Exportar logs diários para notas no Obsidian.
- [x] **Corrigir bug de Timezone** (salvava logs 3h mais cedo).
- [x] **Editar e Excluir na Home** (TodayLogsCard com interações em tempo real).
- [x] **Atualizar cache do Next.js** (`revalidatePath`) nas páginas de dia, histórico e home após salvar/editar logs.

---

## 💡 Ideias para Futuras Implementações (Backlog de Produto & UX)

### 📊 1. Resumo Semanal Visual & Reflexão ("Weekly Reflection")
- **Síntese de Fechamento de Semana:** Gerar um card visual de fechamento aos domingos com:
  - Total de registros e distribuição por tags.
  - Variação do humor predominante na semana.
  - Tarefas da biblioteca concluídas.
- **Relatório em PDF / Imagem Exportável:** Opção de gerar relatório simples e limpo para compartilhar com terapeuta, psiquiatra ou guardar em PDF/Notion.
- **Zero Pressão:** O resumo nunca foca no que "faltou fazer", mas sim no que foi registrado e vivido.

### 🔍 2. Busca Avançada e Filtros Inteligentes
- **Busca Sem Acento & Typo-tolerant:** Implementar busca case-insensitive e accent-insensitive (`unaccent`/fuzzy search) para não exigir digitação exata.
- **Seletor de Intervalo de Datas (Date Range Picker):** Permitir filtrar o histórico por um período específico (ex: "últimos 30 dias", "Mês passado", ou datas personalizadas).
- **Modos de Agrupamento Alternativos:** Alternar a exibição do Histórico entre:
  - *Visão por Semana* (padrão TDAH).
  - *Visão por Tag/Categoria* (todos os registros de uma determinada tag reunidos).
  - *Visão por Humor* (registros associados a dias de alta/baixa energia).

### 🏷️ 3. Personalização Visual & Tags Inteligentes
- **Cores Customizadas por Tag:** Permitir atribuir cores suaves a cada tag criada para identificação visual imediata no feed.
- **Tags Aninhadas ou Hierárquicas:** Suporte a submódulos de tags (ex: `#trabalho/projeto-a`, `#saude/treino`).
- **Auto-sugestão Contextual de Tags:** Ao digitar `#` no campo de registro, exibir popover rápido com tags existentes.

### 📅 4. Heatmap & Consciência Temporal no Histórico
- **Mini Matriz de Atividade Semanal:** Um mapa de calor discreto (estilo GitHub/SaaS, mas em tons pastel neutros) no topo da página de histórico, mostrando a frequência de registros sem métrica punitiva de streak.
- **Linha do Tempo Visual (Timeline Format):** Formato alternativo de feed com marcadores temporais visuais conectando os registros da semana.

### ⚡ 5. Entrada Sem Fricção & Ditado (Voice-to-Text)
- **Captura por Voz (Ditado Local):** Botão de microfone na captura rápida usando a Web Speech API para transcrição instantânea sem precisar digitar (ideal para momentos de hiperfoco ou desatenção).
- **Command Palette (`Cmd/Ctrl + K`):** Menu rápido de navegação global para buscar logs, trocar de semana ou criar nota instantânea de qualquer lugar do app.

### 📱 6. Modo Offline Avançado (IndexedDB + Sync Queue) [x]
- **Fila de Sincronização em Background:** Salvar registros offline no `IndexedDB` caso a conexão caia e sincronizar silenciosamente quando a internet retornar.
- **Notificações Gentis Locais & Banner Offline:** Banner de status offline (`OfflineBanner.tsx`) integrado ao layout da aplicação informando alterações salvas no dispositivo.

