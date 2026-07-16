# Design — Weekly Calendar

## Overview

O Weekly Calendar é a tela principal do produto. Funciona como ponto de entrada de toda sessão do usuário: ao abrir o app, o usuário vê imediatamente a semana corrente, com cada dia representado por uma célula que comunica seu estado de forma glanceable — se há registros, se há humor, quantos logs existem.

O design segue rigorosamente os princípios do produto:

- Sem streaks, sem contadores de falha, sem mensagens de cobrança.
- Navegação entre semanas sem atrito (1 tap para avançar ou recuar).
- Deep-linking via URL (`/week/[weekStart]`) para que qualquer semana seja bookmarkável e o botão "voltar" do browser funcione naturalmente.
- Server Components para leitura, Client Components apenas onde há interatividade real.
- Uma única query de banco para buscar os 7 dias + contagem de logs.

---

## Architecture

### Rendering Strategy

```
/ (rota raiz)
└── page.tsx (Server Component)
    └── WeeklyCalendar (Server Component)
        ├── WeekNavigator (Client Component)  ← interativo: prev/next/today
        └── [7×] DayCell (Client Component)  ← interativo: clique para navegar

/week/[weekStart]
└── page.tsx (Server Component)
    └── WeeklyCalendar (Server Component)
        ├── WeekNavigator (Client Component)
        └── [7×] DayCell (Client Component)
```

**Server Components** (`page.tsx`, `WeeklyCalendar`):
- Lêem o parâmetro de rota `weekStart` (ou derivam a semana atual do clock do servidor).
- Executam a query otimizada: 7 dias + contagem de logs em uma única viagem ao banco.
- Passam os dados prontos como props para os Client Components.
- Nunca recebem eventos do browser diretamente.

**Client Components** (`WeekNavigator`, `DayCell`):
- Recebem dados imutáveis via props.
- `WeekNavigator` usa `useRouter` do Next.js para fazer `router.push('/week/[weekStart]')` ao navegar.
- `DayCell` é simplesmente um `<Link href="/day/[date]">` — sem estado local além de hover.

### Fluxo de dados

```
Browser request /week/2025-06-30
  → Next.js (edge/node)
    → Server Component page.tsx
      → lib/db/queries/weeks.ts → Neon PostgreSQL
      ← DayStatus[7]
    → WeeklyCalendar (Server Component) [hydrates]
      → WeekNavigator (Client, prev/next/today buttons)
      → DayCell × 7 (Client, each is a <Link>)
```

---

## Components and Interfaces

### `WeeklyCalendar` (Server Component)

```typescript
// components/calendar/WeeklyCalendar.tsx
interface WeeklyCalendarProps {
  weekStart: Date;       // segunda-feira da semana exibida
  days: DayStatus[];     // 7 itens, ordenados seg→dom
  today: Date;           // passado do servidor para evitar hidratação errada
}
```

Responsabilidades:
- Renderizar o grid de 7 células.
- Passar `isToday`, `isFuture`, `isCurrentWeek` para cada `DayCell`.
- Renderizar `WeekNavigator` com `weekStart`, `today`, `prevWeek`, `nextWeek`.

### `DayCell` (Client Component)

```typescript
// components/calendar/DayCell.tsx
interface DayCellProps {
  date: Date;
  logCount: number;        // 0 = sem logs
  mood: MoodValue | null;  // null = sem mood registrado
  isToday: boolean;
  isFuture: boolean;       // dias futuros são permitidos mas visualmente diferentes
}
```

Responsabilidades:
- Renderizar como `<Link href={`/day/${formatDateParam(date)}`}>`.
- Exibir indicador de presença de log (`logCount > 0` → dot/marker).
- Exibir indicador de humor se `mood !== null`.
- Exibir `logCount` como resumo mínimo (ex: "2 logs" ou apenas o número).
- Aplicar estilo `isToday` (ring/highlight distinto).
- Nunca bloquear navegação em dias futuros.
- Nunca exibir contadores de "dias sem log".

### `WeekNavigator` (Client Component)

```typescript
// components/calendar/WeekNavigator.tsx
interface WeekNavigatorProps {
  weekStart: Date;       // semana atualmente exibida
  today: Date;           // para determinar se está na semana atual
}
```

Responsabilidades:
- Botão "← semana anterior" → `router.push(weekPath(subWeeks(weekStart, 1)))`.
- Botão "próxima semana →" → `router.push(weekPath(addWeeks(weekStart, 1)))`.
- Botão/link "hoje" → visível apenas quando `weekStart !== currentWeekStart(today)`, leva para `/`.
- Exibir label da semana (ex: "30 jun – 6 jul · 2025").

### Tipos compartilhados

```typescript
// lib/types/calendar.ts

export type MoodValue = 'great' | 'good' | 'neutral' | 'bad' | 'awful';

export interface DayStatus {
  date: Date;            // dia exato (midnight UTC da data local)
  logCount: number;
  mood: MoodValue | null;
}
```

---

## Data Models

Esta spec usa as tabelas `days` e `logs` **apenas em leitura**. A criação/edição desses registros pertence à spec `daily-log-system`.

### Tabela `days`

```sql
CREATE TABLE days (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id),
  date        DATE        NOT NULL,
  mood        TEXT        CHECK (mood IN ('great','good','neutral','bad','awful')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
```

### Tabela `logs`

```sql
CREATE TABLE logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id),
  day_date    DATE        NOT NULL,
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (user_id, day_date) REFERENCES days(user_id, date)
);
```

> **Nota:** `day_date` na tabela `logs` é uma referência à tabela `days` via chave composta `(user_id, date)`. Isso garante integridade referencial sem precisar de um `day_id` extra.

### Query otimizada (única viagem ao banco)

```typescript
// lib/db/queries/weeks.ts

export async function getWeekStatus(
  userId: string,
  weekStart: Date,   // segunda-feira 00:00 UTC
): Promise<DayStatus[]> {
  const weekEnd = addDays(weekStart, 6); // domingo

  const rows = await db
    .select({
      date:     days.date,
      mood:     days.mood,
      logCount: sql<number>`COUNT(${logs.id})::int`,
    })
    .from(
      // gerar os 7 dias como série mesmo quando não há registro
      sql`generate_series(${weekStart}::date, ${weekEnd}::date, '1 day'::interval) AS gs(date)`
    )
    .leftJoin(
      days,
      sql`${days.date} = gs.date AND ${days.userId} = ${userId}`
    )
    .leftJoin(
      logs,
      sql`${logs.dayDate} = gs.date AND ${logs.userId} = ${userId}`
    )
    .groupBy(sql`gs.date`, days.mood)
    .orderBy(sql`gs.date`);

  return rows.map(row => ({
    date:     new Date(row.date),
    logCount: row.logCount ?? 0,
    mood:     (row.mood as MoodValue) ?? null,
  }));
}
```

**Por que `generate_series`?** Garante que a query retorne exatamente 7 linhas mesmo para dias sem nenhum registro, eliminando a necessidade de preencher os "buracos" no lado da aplicação. Uma viagem ao banco, zero lógica de preenchimento no JavaScript.

---

## Routing

| URL                     | Comportamento                                                   |
|-------------------------|-----------------------------------------------------------------|
| `/`                     | Redireciona internamente para a semana atual (sem redirect HTTP) — `page.tsx` deriva `weekStart = currentWeekStart(serverNow())` |
| `/week/[weekStart]`     | Exibe a semana cuja segunda-feira é `weekStart` (formato `YYYY-MM-DD`) |
| `/day/[date]`           | Visão do dia (escopo da spec `daily-log-system`)                |

### Validação do parâmetro `weekStart`

```typescript
// app/(app)/week/[weekStart]/page.tsx

import { z } from 'zod';
import { startOfWeek, parseISO, isValid } from 'date-fns';

const WeekStartSchema = z
  .string()
  .refine(s => isValid(parseISO(s)), { message: 'Data inválida' })
  .transform(s => parseISO(s))
  .refine(
    d => startOfWeek(d, { weekStartsOn: 1 }).getTime() === d.getTime(),
    { message: 'A data deve ser uma segunda-feira' }
  );
```

Se o parâmetro for inválido, `notFound()` é chamado e o Next.js exibe a página 404.

### Deep-linking e "voltar" do browser

Por usar rotas dinâmicas (`/week/[weekStart]`), cada semana tem uma URL estável e cacheável. O botão "voltar" do browser funciona naturalmente via histórico do Next.js App Router. O `WeekNavigator` usa `router.push` (não `router.replace`), garantindo que cada navegação empilha uma entrada de histórico.

---

## Date Helpers

Todos os helpers de data ficam em `lib/utils/date.ts`. A biblioteca preferida é `date-fns` (já amplamente usada no ecossistema Next.js, sem side-effects).

```typescript
// lib/utils/date.ts
import {
  startOfWeek, addWeeks, subWeeks, addDays,
  format, parseISO, isSameWeek, isSameDay, isFuture,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

/** Início da semana de uma data (segunda-feira 00:00 UTC) */
export const WEEK_START_DAY = 1; // 0=domingo, 1=segunda

export function currentWeekStart(from: Date = new Date()): Date {
  return startOfWeek(from, { weekStartsOn: WEEK_START_DAY });
}

/** Formata weekStart como parâmetro de rota: "2025-06-30" */
export function formatWeekParam(weekStart: Date): string {
  return format(weekStart, 'yyyy-MM-dd');
}

/** Formata data do dia como parâmetro de rota: "2025-07-02" */
export function formatDateParam(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Rota para uma semana: "/week/2025-06-30" (ou "/" para a atual) */
export function weekPath(weekStart: Date): string {
  const now = currentWeekStart();
  if (isSameDay(weekStart, now)) return '/';
  return `/week/${formatWeekParam(weekStart)}`;
}

/** Verifica se uma data é o dia atual */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/** Verifica se uma data pertence à semana atual */
export function isCurrentWeek(date: Date): boolean {
  return isSameWeek(date, new Date(), { weekStartsOn: WEEK_START_DAY });
}

/** Label legível da semana: "30 jun – 6 jul · 2025" */
export function weekLabel(weekStart: Date, locale = ptBR): string {
  const weekEnd = addDays(weekStart, 6);
  const start = format(weekStart, 'd MMM', { locale });
  const end   = format(weekEnd,   'd MMM', { locale });
  const year  = format(weekEnd,   'yyyy');
  return `${start} – ${end} · ${year}`;
}
```

**Convenção de timezone:** O servidor sempre opera em UTC. O `weekStart` passado para a query é interpretado como `DATE` do PostgreSQL (sem timezone), o que evita inconsistências de DST. A data "local" do usuário é derivada no cliente e passada como parâmetro de rota pelo `WeekNavigator`.

---

## Correctness Properties

*Uma propriedade é uma característica ou comportamento que deve se manter verdadeiro em todas as execuções válidas de um sistema — essencialmente, uma declaração formal sobre o que o sistema deve fazer. Propriedades servem como ponte entre especificações legíveis por humanos e garantias de corretude verificáveis por máquina.*

Esta feature envolve lógica de transformação de dados (helpers de data, montagem da semana, renderização condicional de indicadores) que se presta bem a property-based testing. A biblioteca escolhida é **fast-check** (TypeScript, amplamente adotada no ecossistema Node/Next.js).

---

### Property 1: WeeklyCalendar sempre renderiza exatamente 7 células

*Para qualquer* data de início de semana válida, o componente `WeeklyCalendar` deve renderizar exatamente 7 componentes `DayCell`.

**Validates: Requirements 1.2**

---

### Property 2: Exatamente um dia destacado como "hoje" por semana

*Para qualquer* semana que contenha a data atual, exatamente uma `DayCell` deve ter a prop `isToday = true`. Para qualquer semana que não contenha a data atual, nenhuma célula deve ter `isToday = true`.

**Validates: Requirements 1.3**

---

### Property 3: Controle "voltar à semana atual" aparece se e somente se a semana exibida não é a atual

*Para qualquer* `weekStart` diferente do início da semana corrente, o `WeekNavigator` deve renderizar o controle "hoje" (ou "semana atual"). Para `weekStart` igual à semana corrente, esse controle não deve aparecer.

**Validates: Requirements 1.5**

---

### Property 4: Navegação prev/next move a semana em exatamente ±7 dias

*Para qualquer* `weekStart` válido, o `weekStart` produzido por "semana anterior" deve ser `weekStart - 7 dias`, e o produzido por "próxima semana" deve ser `weekStart + 7 dias`.

**Validates: Requirements 2.1**

---

### Property 5: Round-trip URL ↔ weekStart

*Para qualquer* data de segunda-feira válida, codificar em parâmetro de rota (`formatWeekParam`) e depois parsear de volta (`parseISO`) deve produzir a mesma data de origem.

**Validates: Requirements 2.2**

---

### Property 6: Sem métricas de culpa em qualquer estado de semana

*Para qualquer* conjunto de dados de semana (incluindo semanas completamente vazias, semanas parcialmente preenchidas, e semanas com todos os dias preenchidos), o HTML renderizado pelo `WeeklyCalendar` não deve conter contadores de "dias sem log consecutivos", streaks, mensagens de falha, nem nenhuma métrica que induza culpa.

**Validates: Requirements 2.3, 3.4**

---

### Property 7: Indicador de presença de log aparece se e somente se logCount > 0

*Para qualquer* `DayCellProps`, se `logCount > 0` o componente deve renderizar um indicador de presença de log. Se `logCount = 0`, nenhum indicador de log deve ser renderizado.

**Validates: Requirements 3.1**

---

### Property 8: Indicador de humor aparece se e somente se mood não é null

*Para qualquer* `DayCellProps`, se `mood` é um valor válido de `MoodValue` o componente deve renderizar um indicador de humor. Se `mood` é `null`, nenhum indicador de humor deve ser renderizado.

**Validates: Requirements 3.2**

---

### Property 9: Contagem de logs exibida corretamente

*Para qualquer* `DayCellProps` com `logCount` arbitrário (incluindo 0), o valor numérico exibido na célula deve ser igual ao `logCount` recebido via props.

**Validates: Requirements 3.3**

---

### Property 10: DayCell sempre renderiza link para /day/[date]

*Para qualquer* `DayCellProps` com uma data válida, o componente deve renderizar um elemento navegável (link ou âncora) cujo `href` é `/day/YYYY-MM-DD` correspondente àquela data.

**Validates: Requirements 4.1**

---

### Property 11: Dias futuros são navegáveis (não bloqueados)

*Para qualquer* data no futuro, a `DayCell` correspondente deve renderizar como elemento navegável e não deve estar desabilitada (`aria-disabled`, `pointer-events: none` ou similar).

**Validates: Requirements 4.3**

---

## Error Handling

### Parâmetro `weekStart` inválido

Se o segmento de rota `/week/[weekStart]` não for uma data ISO válida ou não for uma segunda-feira:

```typescript
// app/(app)/week/[weekStart]/page.tsx
const result = WeekStartSchema.safeParse(params.weekStart);
if (!result.success) {
  notFound(); // → Next.js 404 page
}
```

Nenhuma mensagem de erro expõe detalhes internos ao usuário.

### Falha na query de banco

Se `getWeekStatus` lançar exceção (timeout Neon, conexão perdida):

- O `page.tsx` deixa a exceção propagar.
- O Next.js `error.tsx` mais próximo captura e exibe uma tela de erro genérica (sem detalhes técnicos).
- A tela de erro oferece um botão "tentar novamente" que recarrega a rota.

```typescript
// app/(app)/error.tsx
'use client';
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main>
      <p>Algo deu errado ao carregar o calendário.</p>
      <button onClick={reset}>Tentar novamente</button>
    </main>
  );
}
```

### Estado vazio (semana sem logs)

Não é tratado como erro. A query via `generate_series` sempre retorna 7 linhas; dias sem registro têm `logCount: 0` e `mood: null`. O `DayCell` renderiza normalmente, sem texto de cobrança. Nenhum `<EmptyState>` especial é exibido — o silêncio visual é a resposta correta conforme os princípios do produto.

### Dados de mood inválidos no banco

Se um valor de `mood` no banco não corresponder a nenhum `MoodValue` conhecido (migração futura, inconsistência), o mapeamento em `getWeekStatus` trata `mood` desconhecido como `null`:

```typescript
const VALID_MOODS = new Set(['great','good','neutral','bad','awful']);
mood: VALID_MOODS.has(row.mood) ? (row.mood as MoodValue) : null,
```

---

## Testing Strategy

### Abordagem dual

A estratégia combina:

1. **Testes de propriedade (property-based)** com `fast-check` — para todas as 11 propriedades de corretude listadas acima. Mínimo de 100 iterações por propriedade.
2. **Testes de exemplo (unit/integration)** — para cenários específicos e pontos de integração.

### Property-Based Tests (fast-check)

Configuração mínima:

```typescript
// vitest.config.ts — já inclui fast-check como devDependency
import fc from 'fast-check';

fc.configureGlobal({ numRuns: 100 });
```

Cada teste de propriedade referencia a propriedade do design:

```typescript
// Feature: weekly-calendar, Property 5: Round-trip URL ↔ weekStart
it('round-trip URL para weekStart', () => {
  fc.assert(
    fc.property(
      fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .map(d => currentWeekStart(d)), // garante que é sempre segunda
      weekStart => {
        const param = formatWeekParam(weekStart);
        const parsed = parseISO(param);
        expect(parsed.getTime()).toBe(weekStart.getTime());
      }
    )
  );
});
```

Geradores relevantes:

```typescript
// Gera um weekStart arbitrário (sempre segunda-feira)
const arbWeekStart = fc
  .date({ min: new Date('2015-01-01'), max: new Date('2035-12-31') })
  .map(d => currentWeekStart(d));

// Gera DayCellProps com valores aleatórios
const arbDayCellProps = fc.record({
  date:     arbWeekStart.chain(ws =>
              fc.integer({ min: 0, max: 6 }).map(n => addDays(ws, n))),
  logCount: fc.nat({ max: 50 }),
  mood:     fc.option(fc.constantFrom('great','good','neutral','bad','awful')),
  isToday:  fc.boolean(),
  isFuture: fc.boolean(),
});

// Gera semana com zero logs (estado vazio)
const arbEmptyWeek = arbWeekStart.map(ws =>
  Array.from({ length: 7 }, (_, i) => ({
    date:     addDays(ws, i),
    logCount: 0,
    mood:     null,
  }))
);
```

Cada propriedade tem **um único test** de propriedade, referenciado com a tag:
`// Feature: weekly-calendar, Property N: <texto da propriedade>`

### Testes de exemplo (unit/integration)

| Teste | Tipo | Requisito |
|-------|------|-----------|
| Rota `/` renderiza a semana corrente | Exemplo | 1.1 |
| `currentWeekStart()` retorna segunda-feira para qualquer data | Exemplo | 1.4 |
| Rota `/week/semana-invalida` retorna 404 | Exemplo | — |
| DayCell com `logCount=0` não renderiza dot de log | Exemplo | 3.1 |
| Página do dia tem link "voltar" para o calendário | Integração | 4.2 |

### O que não é testado aqui

- Lógica de criação/edição de logs → spec `daily-log-system`.
- Renderização visual/pixel-perfect → testes manuais ou visual regression (Chromatic) fora do MVP.
- Performance da query Neon em produção → monitoramento via Vercel Analytics.
