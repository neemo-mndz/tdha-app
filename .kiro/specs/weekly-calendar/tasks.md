# Implementation Plan: Weekly Calendar

## Overview

Implementação da tela principal do Weekly Companion: calendário semanal com grade de 7 dias, navegação entre semanas, deep-linking via URL e indicadores visuais de status por dia. A implementação segue a arquitetura Server/Client Component do Next.js App Router, com query única ao banco via `generate_series` e 11 propriedades de corretude validadas por property-based tests com `fast-check`.

---

## Tasks

- [x] 1. Criar tipos compartilhados e helpers de data
  - [x] 1.1 Criar `lib/types/calendar.ts` com `MoodValue` e `DayStatus`
    - Definir `type MoodValue = 'great' | 'good' | 'neutral' | 'bad' | 'awful'`
    - Definir `interface DayStatus { date: Date; logCount: number; mood: MoodValue | null }`
    - _Requisitos: 3.1, 3.2, 3.3_

  - [x] 1.2 Criar `lib/utils/date.ts` com todos os helpers de data
    - Implementar `currentWeekStart(from?)`, `formatWeekParam`, `formatDateParam`, `weekPath`, `isToday`, `isCurrentWeek`, `weekLabel` com `date-fns` e `ptBR` locale
    - Usar `WEEK_START_DAY = 1` (segunda-feira) como constante não configurável
    - _Requisitos: 1.4, 2.1, 2.2_

  - [x] 1.3 Escrever testes de propriedade para helpers de data (Property 4 e 5)
    - **Property 4: Navegação prev/next move a semana em exatamente ±7 dias**
    - **Valida: Requisito 2.1**
    - **Property 5: Round-trip URL ↔ weekStart**
    - **Valida: Requisito 2.2**
    - Usar `arbWeekStart` gerado via `fc.date().map(d => currentWeekStart(d))`
    - _Arquivo: `lib/utils/__tests__/date.test.ts`_

  - [x] 1.4 Escrever testes de exemplo para `currentWeekStart`
    - Verificar que retorna segunda-feira para qualquer data da semana
    - _Arquivo: `lib/utils/__tests__/date.test.ts`_
    - _Requisito: 1.4_

- [x] 2. Implementar query de banco `getWeekStatus`
  - [x] 2.1 Criar `lib/db/queries/weeks.ts` com a função `getWeekStatus`
    - Usar `generate_series` para garantir retorno de exatamente 7 linhas
    - `LEFT JOIN` em `days` e `logs` para agregar `logCount` e `mood`
    - Mapear valores de `mood` desconhecidos para `null` com `VALID_MOODS` set
    - Retornar `DayStatus[]` com 7 itens ordenados seg→dom
    - _Requisitos: 3.4_

  - [x] 2.2 Escrever teste de integração para `getWeekStatus`
    - Verificar que semana sem nenhum registro retorna 7 itens com `logCount: 0` e `mood: null`
    - Verificar que mood inválido no banco é mapeado para `null`
    - _Arquivo: `lib/db/queries/__tests__/weeks.test.ts`_
    - _Requisitos: 3.4, 2.3_

- [x] 3. Criar componente `DayCell`
  - [x] 3.1 Criar `components/calendar/DayCell.tsx` como Client Component
    - Definir `DayCellProps` com `date`, `logCount`, `mood`, `isToday`, `isFuture`
    - Renderizar como `<Link href={/day/${formatDateParam(date)}}>` (sempre navegável)
    - Exibir indicador de presença de log somente se `logCount > 0`
    - Exibir indicador de humor somente se `mood !== null`
    - Exibir `logCount` numérico; para `logCount >= 100` exibir `"99+"`
    - Aplicar `aria-current="date"` e estilo de destaque quando `isToday = true`
    - Nunca renderizar `aria-disabled` nem bloquear navegação em dias futuros
    - Nunca exibir métricas de streak ou contadores de culpa
    - _Requisitos: 1.3, 3.1, 3.2, 3.3, 4.1, 4.3_

  - [x] 3.2 Escrever testes de propriedade para `DayCell` (Properties 7, 8, 9, 10, 11)
    - **Property 7: Indicador de log aparece se e somente se logCount > 0**
    - **Valida: Requisito 3.1**
    - **Property 8: Indicador de humor aparece se e somente se mood não é null**
    - **Valida: Requisito 3.2**
    - **Property 9: Contagem de logs exibida corretamente**
    - **Valida: Requisito 3.3**
    - **Property 10: DayCell sempre renderiza link para /day/[date]**
    - **Valida: Requisito 4.1**
    - **Property 11: Dias futuros são navegáveis (não bloqueados)**
    - **Valida: Requisito 4.3**
    - Usar `arbDayCellProps` com `fc.record(...)` cobrindo todos os campos
    - _Arquivo: `components/calendar/__tests__/DayCell.test.tsx`_

  - [x] 3.3 Escrever testes de exemplo para `DayCell`
    - `logCount = 0` → sem dot de log
    - `logCount = 99` → exibe "99"
    - `logCount = 100` → exibe "99+"
    - `mood = null` → sem indicador de humor
    - `isToday = true` → possui `aria-current="date"`
    - `isFuture = true` → link funcional sem `aria-disabled`
    - _Arquivo: `components/calendar/__tests__/DayCell.test.tsx`_
    - _Requisitos: 3.1, 3.2, 3.3, 4.1, 4.3_

- [x] 4. Criar componente `WeekNavigator`
  - [x] 4.1 Criar `components/calendar/WeekNavigator.tsx` como Client Component
    - Definir `WeekNavigatorProps` com `weekStart` e `today`
    - Botão "← semana anterior" → `router.push(weekPath(subWeeks(weekStart, 1)))`
    - Botão "próxima semana →" → `router.push(weekPath(addWeeks(weekStart, 1)))`
    - Botão/link "hoje" → visível **somente** quando `weekStart !== currentWeekStart(today)`, navega para `/`
    - Exibir label da semana via `weekLabel(weekStart)`
    - Usar `router.push` (não `router.replace`) para empilhar histórico
    - _Requisitos: 1.5, 2.1, 2.2, 2.5_

  - [ ]* 4.2 Escrever testes de propriedade para `WeekNavigator` (Properties 3 e 4)
    - **Property 3: Controle "hoje" aparece se e somente se a semana não é a atual**
    - **Valida: Requisito 1.5**
    - **Property 4: Navegação prev/next move a semana em exatamente ±7 dias**
    - **Valida: Requisito 2.1**
    - Usar `arbWeekStart` para cobrir semanas passadas, futuras e a atual
    - _Arquivo: `components/calendar/__tests__/WeekNavigator.test.tsx`_

  - [ ]* 4.3 Escrever testes de exemplo para `WeekNavigator`
    - Semana atual → botão "hoje" não está presente no DOM
    - Semana diferente → botão "hoje" está presente e aponta para `/`
    - _Arquivo: `components/calendar/__tests__/WeekNavigator.test.tsx`_
    - _Requisitos: 1.5_

- [x] 5. Criar componente `WeeklyCalendar`
  - [x] 5.1 Criar `components/calendar/WeeklyCalendar.tsx` como Server Component
    - Definir `WeeklyCalendarProps` com `weekStart`, `days`, `today`
    - Renderizar `WeekNavigator` passando `weekStart` e `today`
    - Renderizar 7 `DayCell` computando `isToday` e `isFuture` para cada item de `days`
    - Garantir que todas as 7 células sejam simultâneas no viewport sem scroll horizontal
    - _Requisitos: 1.2, 1.3, 2.3, 3.4_

  - [ ]* 5.2 Escrever testes de propriedade para `WeeklyCalendar` (Properties 1, 2, 6)
    - **Property 1: WeeklyCalendar sempre renderiza exatamente 7 células**
    - **Valida: Requisito 1.2**
    - **Property 2: Exatamente um dia destacado como "hoje" por semana (ou nenhum se hoje não está na semana)**
    - **Valida: Requisito 1.3**
    - **Property 6: Sem métricas de culpa em qualquer estado de semana**
    - **Valida: Requisitos 2.3, 3.4**
    - Usar `arbWeekStart` e `arbEmptyWeek` para cobrir semanas vazias, parciais e completas
    - _Arquivo: `components/calendar/__tests__/WeeklyCalendar.test.tsx`_

  - [ ]* 5.3 Escrever testes de exemplo para `WeeklyCalendar`
    - Semana completamente vazia → 7 células renderizadas sem mensagem de erro
    - Semana com `today` inclusa → exatamente uma célula com `aria-current="date"`
    - _Arquivo: `components/calendar/__tests__/WeeklyCalendar.test.tsx`_
    - _Requisitos: 1.2, 1.3, 2.3_

- [x] 6. Checkpoint — Verificar componentes e testes da camada de UI
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

- [x] 7. Criar rotas de página e tratamento de erros
  - [x] 7.1 Criar `app/(app)/week/[weekStart]/page.tsx` (Server Component)
    - Importar e usar `WeekStartSchema` com Zod para validar o parâmetro
    - Chamar `notFound()` se o parâmetro for inválido ou não for segunda-feira
    - Derivar `today` via `new Date()` no servidor
    - Chamar `getWeekStatus(userId, weekStart)` e passar resultado para `WeeklyCalendar`
    - _Requisitos: 1.6, 2.2, 2.4_

  - [x] 7.2 Criar `app/(app)/page.tsx` para a rota raiz `/`
    - Derivar `weekStart = currentWeekStart(new Date())` no servidor (sem redirect HTTP)
    - Derivar `today` no servidor
    - Chamar `getWeekStatus` e renderizar `WeeklyCalendar`
    - _Requisitos: 1.1, 1.4_

  - [x] 7.3 Criar `app/(app)/error.tsx` como Client Component
    - Exibir mensagem genérica sem detalhes técnicos: "Algo deu errado ao carregar o calendário."
    - Renderizar botão "Tentar novamente" que chama `reset()`
    - Aceitar props `{ reset: () => void }` do Next.js
    - _Requisitos: 2.4_

  - [x] 7.4 Criar `app/(app)/week/[weekStart]/not-found.tsx` (ou usar not-found global)
    - Exibir página 404 genérica sem expor parâmetros internos
    - _Requisitos: 1.6_

  - [ ]* 7.5 Escrever testes de exemplo para validação de rota
    - `weekStart = "2025-06-30"` (segunda) → válido, renderiza calendário
    - `weekStart = "2025-07-01"` (terça) → `notFound()`
    - `weekStart = "semana-invalida"` → `notFound()`
    - `weekStart = "2025-02-30"` (data inexistente) → `notFound()`
    - _Arquivo: `app/(app)/week/[weekStart]/__tests__/page.test.tsx`_
    - _Requisitos: 1.6, 4.4_

- [x] 8. Checkpoint Final — Garantir que todos os testes passam
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

---

## Notes

- Tarefas marcadas com `*` são opcionais e podem ser omitidas para um MVP mais rápido.
- Cada tarefa referencia requisitos específicos para rastreabilidade.
- Os checkpoints garantem validação incremental antes de avançar.
- Testes de propriedade validam garantias universais de corretude; testes de exemplo cobrem cenários específicos e casos de borda.
- O design não inclui estado global — usar estado local nos Client Components + `router.push` para navegação.
- `generate_series` garante 7 linhas na query mesmo sem registros no banco; nenhum preenchimento de "buracos" é necessário no lado JavaScript.
- A lógica de timezone segue a convenção do design: servidor opera em UTC, `DATE` do PostgreSQL sem timezone.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4", "2.1"] },
    { "id": 2, "tasks": ["2.2", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "5.1"] },
    { "id": 5, "tasks": ["5.2", "5.3", "7.1", "7.2", "7.3", "7.4"] },
    { "id": 6, "tasks": ["7.5"] }
  ]
}
```
