---
tipo: feature
status: ideia
data: 2026-07-28
---

# Análise Completa — App "semana." (TDAH Daily)

**Data:** 18 de julho de 2026  
**Escopo:** Código, design, versão mobile, testes

---

## 1. Resultados dos Testes

| Métrica | Valor |
|---------|-------|
| Total de arquivos de teste | 19 |
| Testes passando | 308 |
| Testes falhando | 1 (pré-existente, não-crítico) |
| Build Next.js | ✅ Sucesso |

**Teste falhando:**
- `WeeklyCalendar.test.tsx` → Assertiva de CSS selector `.day-cell__log-indicator` retorna 0 elementos quando esperava 4. Causa: o componente `DayCell` não está renderizando o indicador de log (provavelmente removido/alterado durante refactoring do design).

---

## 2. Problemas Encontrados

### 2.1 Críticos

| # | Problema | Impacto | Arquivo(s) |
|---|----------|---------|------------|
| 1 | **Timezone no horário do log (corrigido nesta sessão)** — Ao editar para 07:00, salvava como 04:00 (3h de diferença = UTC offset do Brasil) | Dados incorretos | `lib/actions/logs.ts`, `LogItem.tsx` |
| 2 | **Logs não apareciam imediatamente após salvar (corrigido nesta sessão)** — `revalidatePath` só invalidava `/day/[date]`, não `/` | UX quebrada na home | `lib/actions/logs.ts` |
| 3 | **Edit/delete indisponível na home (corrigido nesta sessão)** — `TodayLogsCard` era read-only | Funcionalidade inacessível | `TodayLogsCard.tsx` |
| 4 | **Vercel CLI desautenticado** — Token expirado impede deploy via CLI | Bloqueio de deploy | Ambiente local |

### 2.2 Moderados

| # | Problema | Impacto | Arquivo(s) |
|---|----------|---------|------------|
| 5 | **Página Profile enorme (388 kB)** — Provavelmente importa `jspdf` e `exceljs` no client-side bundle | Performance móvel | `app/(app)/profile/page.tsx`, `lib/report/` |
| 6 | **Ações de editar/excluir invisíveis em mobile** — Usam `opacity: 0` + `:hover` para revelar, mas mobile não tem hover | Funcionalidade inacessível em touch | `globals.css` (`.log-item__actions`) |
| 7 | **`useOptimistic` no DailyLogPanel inicia com `[]`** — Logs criados na sessão aparecem duplicados momentaneamente quando server revalida | UX confusa: flash de itens | `DailyLogPanel.tsx` |
| 8 | **Teste WeeklyCalendar falhando** — Selector `.day-cell__log-indicator` desatualizado | Cobertura de teste reduzida | `WeeklyCalendar.test.tsx` |
| 9 | **Warning de `act(...)` em LogForm.test** — State update fora de `act()` | Console poluído em testes | `LogForm.test.tsx` |

### 2.3 Baixa Prioridade / Melhorias

| # | Problema | Impacto | Arquivo(s) |
|---|----------|---------|------------|
| 10 | **Sem meta `viewport` para evitar zoom involuntário no iOS** — `maximumScale: 1, userScalable: false` está setado (ok), mas `<input type="time">` com font-size < 16px causa zoom no iOS Safari | UX mobile irritante | `globals.css` |
| 11 | **FAB (botão +) pode sobrepor conteúdo** — `position: fixed` com `z-index: 50` sem padding-bottom correspondente no conteúdo abaixo | Conteúdo cortado | `globals.css` |
| 12 | **Sem service worker ou offline support** — `manifest.json` referenciado mas sem SW real | PWA incompleto | `app/layout.tsx` |
| 13 | **CSS não minificado / sem purge de classes não usadas** — 2910 linhas de CSS global | Performance | `globals.css` |
| 14 | **Sem loading state no TodayLogsCard ao editar/excluir** — Operações otimísticas não mostram spinner | Feedback visual | `TodayLogsCard.tsx` |

---

## 3. Análise de Design & UI

### Pontos Positivos
- Paleta sóbria e coerente (verde/terracota), boa legibilidade
- Tipografia bem hierarquizada (Outfit/Inter/IBM Plex Mono)
- Cards com border-radius generoso (18px) dão sensação "soft" adequada para app TDAH
- Layout mobile-first com `max-width: 960px` e responsive breakpoints

### Problemas de Design Mobile

1. **Ações de log não aparecem** — `.log-item__actions { opacity: 0 }` + `.log-item:hover .log-item__actions { opacity: 1 }` não funciona em dispositivos touch. Usuário precisa tocar para editar/excluir mas não vê os botões.

2. **Grid semanal apertado em < 360px** — 7 colunas com gap cria cells muito estreitas em telas pequenas (iPhone SE). Texto fica truncado.

3. **Inputs de horário (type="time")** — No iOS, inputs com font-size < 16px ativam zoom automático. A classe `.log-item-card__time-input` não tem font-size definido (herda 14px do body).

4. **Header com muitos ícones** — Em telas < 375px, os links 📖⚙👤 + LogoutButton podem quebrar em duas linhas. Falta `overflow: hidden` ou menu hambúrguer.

---

## 4. Análise de Código

### Arquitetura (Boa)
- Next.js 15 App Router com Server Components e Server Actions
- Validação Zod client + server (boa separação de concerns)
- Drizzle ORM + Neon PostgreSQL
- Otimistic UI via `useOptimistic` (pattern correto)
- Autenticação session-based sem dependência de terceiros

### Problemas de Código

1. **Bundle bloat no Profile** — `jspdf` (238 KB) e `exceljs` (grande) são importados. Devem ser dynamic imports com `next/dynamic` ou `import()` lazy.

2. **Componente LogItem aceita `LogWithTask` mas cria `originalTime` a cada render** — `format(new Date(log.createdAt), ...)` é recomputado em cada re-render. Deveria ser `useMemo` ou variável derivada fora do component body.

3. **`DailyLogPanel` optimistic state desconectado do `TodayLogsCard`** — Dois sistemas de estado separados para a mesma lista de logs na home page. Quando o server revalida, `TodayLogsCard` atualiza mas `DailyLogPanel` mantém seus optimistic logs causando duplicatas visuais momentâneas.

4. **Falta de error boundary** — `error.tsx` existe mas é genérico. Erros em componentes individuais (como falha de fetch) propagam para o boundary da página inteira.

---

## 5. Plano de Resolução

### Prioridade Alta (corrigir imediatamente)

| # | Ação | Esforço |
|---|------|---------|
| 6 | **Tornar botões edit/delete sempre visíveis em mobile** — Adicionar media query `@media (hover: none) { .log-item__actions { opacity: 1; } }` ou usar swipe-to-reveal | 15 min |
| 5 | **Lazy load jspdf/exceljs** — Converter imports em `lib/report/pdf.ts` e `lib/report/xls.ts` para `dynamic import()` chamados apenas no handler de click | 30 min |
| 10 | **Evitar zoom no iOS** — Adicionar `font-size: 16px` nos inputs de time e text dentro de `@media (max-width: 640px)` | 10 min |
| 4 | **Autenticar Vercel CLI** — Rodar `vercel login` no terminal local | 2 min |

### Prioridade Média (próximo sprint)

| # | Ação | Esforço |
|---|------|---------|
| 7 | **Unificar estado otimístico na home** — Remover duplicação: `DailyLogPanel` cria o log, `TodayLogsCard` exibe com optimistic add via context compartilhado ou lifting state | 1-2h |
| 8 | **Corrigir teste WeeklyCalendar** — Atualizar selector ou componente DayCell para renderizar `.day-cell__log-indicator` quando `logCount > 0` | 20 min |
| 9 | **Wraper act() em LogForm.test** — Envolver `fireEvent.submit` em `act(async () => {...})` | 10 min |
| 11 | **Padding-bottom para FAB** — Adicionar `padding-bottom: 80px` ao `.shell` e `.day-view` | 5 min |
| 14 | **Loading state em operações** — Adicionar `disabled` + spinner no botão Salvar do LogItem durante request | 20 min |

### Prioridade Baixa (backlog)

| # | Ação | Esforço |
|---|------|---------|
| 12 | **Implementar Service Worker** — Usar `next-pwa` ou `@serwist/next` para offline básico | 2-4h |
| 13 | **Purge CSS** — Migrar para CSS Modules ou Tailwind para tree-shaking automático | 4-8h |
| — | **Header responsivo** — Colapsar nav icons em menu hamburger em < 375px | 1-2h |
| — | **Feedback háptico** — Adicionar `navigator.vibrate()` no FAB e confirmações | 15 min |

---

## 6. Resumo

O app está funcional com boa arquitetura. Os bugs críticos de timezone, atualização de lista e edição na home foram corrigidos nesta sessão. Os maiores problemas restantes são:

1. **Mobile UX** — Botões de ação invisíveis em touch (urgente)
2. **Performance** — Profile page com 388 KB de JS (jspdf/exceljs no bundle)
3. **Duplicação de estado** — DailyLogPanel vs TodayLogsCard na home

Recomendo priorizar os itens de "Prioridade Alta" antes do próximo deploy em produção.

---

# 🔍 Auditoria Técnica do Sistema (Atualização - Fase de Escala)

**Data:** 28 de julho de 2026

## 1. Diagnóstico Geral (Resumo Executivo)
A aplicação possui uma fundação sólida e moderna, utilizando **Next.js 15 (App Router)** com **Server Actions**, banco de dados serverless (**Neon Postgres**) e ORM *type-safe* (**Drizzle**). A arquitetura atual de separar Server Actions em `lib/actions/` e queries em `lib/db/queries/` demonstra uma boa maturidade na camada de dados.

No entanto, o projeto sofre de **"dores de crescimento rápido"** no frontend. Há gargalos significativos de performance devido ao *bundle size* no *client-side* (importação de bibliotecas pesadas), duplicação de estados (Optimistic UI desalinhados) e um monolito de CSS (Vanilla CSS com quase 3.000 linhas) que dificulta a manutenção e escalabilidade.

O banco de dados está bem modelado, mas já apresenta alguns campos redundantes ("para uso futuro") que podem gerar confusão arquitetural se não padronizados.

## 2. Lista de Problemas por Prioridade

### 🔴 Críticos (Afetam estabilidade, UX base ou regras de negócio)
- **Duplicação de Estado (Optimistic UI):** `DailyLogPanel` e `TodayLogsCard` renderizam os mesmos logs na mesma página, mas não compartilham o mesmo provedor de estado otimista. Adicionar um log causa "flashes" de duplicação até a revalidação completa do servidor voltar.
- **Botões Ocultos em Mobile (CSS):** Ações de editar/excluir nos logs utilizam `opacity: 0` e só aparecem no `:hover`. Dispositivos *touch* (mobile) não possuem *hover*, tornando a funcionalidade inacessível para o usuário final no celular.
- **Gargalo de Performance (Client-side Bloat):** A página de Profile (`app/(app)/profile/page.tsx`) carrega `jspdf` e `exceljs` diretamente no bundle do cliente, aumentando o tamanho de download em quase ~400KB e prejudicando o *Time to Interactive* (TTI).

### 🟠 Médios (Manutenção, integrações e bugs menores)
- **Campos Redundantes no BD:** A tabela `days` tem um campo `mood`, mas a tabela `logs` também tem um campo `mood` (anotado como *nullable, para uso futuro*). Isso vai gerar inconsistência de fonte de verdade (SSOT). O humor é atrelado ao dia inteiro ou a cada log específico?
- **Monolito de Estilos (`globals.css`):** Um único arquivo CSS de ~58KB e quase 3000 linhas é insustentável. Há classes globais não utilizadas e alto risco de sobrescritas conflitantes (CSS clash).
- **Sem Tratamento Global de Erros:** Existe um `error.tsx` genérico, mas erros de *fetch* ou de *actions* dentro dos Server Components vão derrubar a renderização da página toda ao invés de usar Error Boundaries localizados.

### 🟢 Baixos (Melhorias contínuas)
- **Acessibilidade de Inputs (iOS):** Inputs de horário `<input type="time">` não têm `font-size: 16px` explícito, causando *zoom-in* involuntário em iPhones.
- **Falta de Suporte Offline (PWA):** Como é um app de registro rápido para TDAH, a falta de um Service Worker torna o app dependente de conexão contínua. 
- **Warnings em Testes:** `act(...)` warnings no Vitest/RTL poluem os logs durante o desenvolvimento (`LogForm.test.tsx`).

## 3. Sugestões Práticas de Implementação

### A. Resolver Gargalo de Performance (Lazy Loading de PDFs)
Em vez de importar as bibliotecas no topo do arquivo na página de Profile, importe-as dinamicamente apenas quando o usuário clicar no botão de exportar:

```tsx
// lib/report/pdf.ts (exemplo de mudança)
export async function generatePDFReport(data) {
  // O import dinâmico impede que a lib trave o carregamento da página
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  // ... resto da lógica
}
```

### B. Unificar o Estado Otimista (Lifting State Up)
Atualmente, se você tiver dois componentes renderizando logs na Home, crie um **Provider** ou suba o estado otimista para o componente pai (`HomeCalendarSection`).

```tsx
// Exemplo estrutural
export function HomeClientWrapper({ initialLogs }) {
  const [optimisticLogs, addOptimisticLog] = useOptimistic(initialLogs, logsReducer);

  return (
    <>
      {/* Ambos agora leem da mesma fonte otimista */}
      <TodayLogsCard logs={optimisticLogs} />
      <DailyLogPanel onAdd={addOptimisticLog} />
    </>
  );
}
```

### C. Consertar os Botões Mobile via Media Queries
No seu arquivo `globals.css`, adicione uma regra garantindo que se o dispositivo não tem hover (telas touch), a opacidade é sempre visível:

```css
@media (hover: none) {
  .log-item__actions {
    opacity: 1; /* Sempre visível em celulares */
  }
}
```
