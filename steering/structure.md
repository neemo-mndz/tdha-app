# Structure Steering — Weekly Companion App

## Estrutura de pastas (Next.js App Router)

```
app/
  (app)/                          # grupo de rotas autenticadas
    layout.tsx                    # layout principal com navegação mínima
    page.tsx                      # tela principal = calendário semanal
    day/[date]/
      page.tsx                    # visão do dia (lista de logs + add log)
    week/[weekStart]/
      page.tsx                    # navegação para semanas passadas/futuras
    reminders/
      page.tsx                    # gestão simples de lembretes
  api/
    logs/
      route.ts                    # (se necessário para integrações externas)
    reminders/
      route.ts
  layout.tsx                      # root layout
  globals.css

components/
  calendar/
    WeeklyCalendar.tsx
    DayCell.tsx
    WeekNavigator.tsx
  logs/
    LogList.tsx
    LogItem.tsx
    QuickCaptureButton.tsx        # floating action button global
    QuickCaptureSheet.tsx
  reminders/
    ReminderForm.tsx
    ReminderList.tsx
  overview/
    WeeklyOverview.tsx
    MoodTrend.tsx
  ui/                             # componentes de UI genéricos (botão, sheet, input)

lib/
  db/
    client.ts                     # client Neon
    queries/
      weeks.ts
      days.ts
      logs.ts
      reminders.ts
  actions/
    logs.ts                       # Server Actions de logs
    reminders.ts                  # Server Actions de reminders
  validation/
    log.schema.ts                 # Zod schemas
    reminder.schema.ts
  utils/
    date.ts                       # helpers de semana/dia (ISO week, timezone)

drizzle/                          # se Drizzle for adotado: schema + migrations
  schema.ts
  migrations/
```

## Convenções

- Toda tela que representa uma unidade de tempo (semana, dia) recebe a data/âncora via segmento de rota dinâmico (`[date]`, `[weekStart]`), nunca via query string, para permitir deep-linking e cache previsível.
- Componentes de captura rápida (`QuickCaptureButton`, `QuickCaptureSheet`) ficam fora do fluxo de navegação — são renderizados no layout raiz autenticado para estarem disponíveis em qualquer tela.
- Queries de banco ficam centralizadas em `lib/db/queries/*`, nunca inline dentro de Server Components — isso mantém as specs de cada feature testáveis isoladamente.
- Uma feature nova do produto (ex: tags, busca) deve adicionar sua própria pasta em `components/` e `lib/db/queries/`, seguindo o mesmo padrão, sem misturar responsabilidades com o calendário.
