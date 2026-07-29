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
