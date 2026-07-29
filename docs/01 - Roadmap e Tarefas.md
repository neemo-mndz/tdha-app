# 🗺️ Roadmap e Tarefas

Aqui acompanhamos o que precisa ser feito. Dividimos o roadmap em 3 Fases com base na última auditoria técnica.

## 🏁 Fase 1: Correções Críticas (UX e Performance)
- [ ] **Mobile UX (CSS):** Tornar botões de edit/delete do log sempre visíveis no mobile (via media query `hover: none`) e adicionar `font-size: 16px` nos inputs de time para evitar o zoom automático no iOS.
- [ ] **Desacoplamento de Relatórios:** Aplicar `dynamic import()` no `jspdf` e `exceljs` na página de Profile para reduzir o bundle inicial.
- [ ] **Sincronização de Estado:** Refatorar a página Home para unificar o `useOptimistic` entre o `DailyLogPanel` e o `TodayLogsCard`.

## 🏗️ Fase 2: Refatoração Estrutural
- [ ] **Modularização do CSS:** Migrar progressivamente o `globals.css` para **CSS Modules** (`.module.css`), agrupando estilos por componente.
- [ ] **Limpeza de Schema DB:** Decidir a regra de negócios para o campo `mood` (Dias vs Logs) e dropar o campo não utilizado.
- [ ] **Error Boundaries:** Criar arquivos `error.tsx` em rotas aninhadas e adicionar *Spinners/Loading States* para as Server Actions de salvamento.

## 🚀 Fase 3: Escala e Funcionalidades PWA
- [ ] **PWA Integration:** Instalar `@serwist/next` (ou `next-pwa`) para registrar um Service Worker e permitir *offline caching* estático.
- [ ] **Indexação Otimizada DB:** Adicionar índices compostos nas tabelas mais acessadas, como buscas de `logs` por `(userId, date)` para acelerar a inicialização.

## ✅ Tarefas Concluídas Anteriores
- [x] **Integração Obsidian:** Exportar logs diários para notas no Obsidian.
- [x] **Corrigir bug de Timezone** (salvava logs 3h mais cedo).
- [x] **Editar e Excluir na Home** (TodayLogsCard não permitia interações).
- [x] **Atualizar cache do Next.js** (revalidatePath) na página inicial após salvar um log.
