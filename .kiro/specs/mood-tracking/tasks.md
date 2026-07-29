# Implementation Plan: Mood Tracking

## Overview

Implementação do recurso de Mood Tracking: registro de humor diário com um toque (5 opções fixas de emoji), nota descritiva opcional (max 80 chars), persistência como coluna na tabela `days`, indicador visual no calendário semanal (Mood_Dot), e separação visual entre o card de humor e o card de registro do dia. Segue o padrão existente: RSC + Server Actions + `useOptimistic` + Zod + Drizzle ORM + Vitest + fast-check.

---

## Tasks

- [x] 1. Criar schema de validação e tipos para mood
  - [x] 1.1 Criar `lib/validation/mood.schema.ts` com schemas Zod e tipos
    - Definir constante `MOOD_VALUES` com os 5 valores: 'great', 'good', 'neutral', 'bad', 'awful'
    - Exportar tipo `MoodValue` derivado de `MOOD_VALUES`
    - Definir `saveMoodSchema` (date regex yyyy-MM-dd + mood nullable enum)
    - Definir `saveMoodNoteSchema` (date regex yyyy-MM-dd + note string max 80, nullable, com transform whitespace→null)
    - Exportar tipos inferidos `SaveMoodInput` e `SaveMoodNoteInput`
    - _Requisitos: 3.5, 3.7, 4.5, 4.6_

  - [x] 1.2 Escrever teste de propriedade para validação de mood value (Property 5)
    - **Property 5: Mood value validation accepts only valid enums**
    - **Valida: Requisitos 3.5**
    - Para qualquer string arbitrária, o schema aceita se e somente se é um dos 5 MoodValues válidos
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/validation/__tests__/mood.schema.test.ts`_

  - [x] 1.3 Escrever teste de propriedade para validação de mood note (Property 7)
    - **Property 7: Mood note validation**
    - **Valida: Requisitos 3.7, 4.5**
    - Para qualquer string, aceita se e somente se: length entre 1–80 E contém pelo menos 1 non-whitespace
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/validation/__tests__/mood.schema.test.ts`_

  - [x] 1.4 Escrever teste de propriedade para whitespace-only note → null (Property 8)
    - **Property 8: Whitespace-only note transforms to null**
    - **Valida: Requisitos 4.6**
    - Para qualquer string composta apenas de whitespace (espaços, tabs, newlines, vazia), o transform produz null
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/validation/__tests__/mood.schema.test.ts`_

- [x] 2. Atualizar schema Drizzle e criar migration de banco
  - [x] 2.1 Atualizar `drizzle/schema.ts` para adicionar colunas mood e mood_note à tabela days
    - Adicionar coluna `mood: text("mood")` (nullable)
    - Adicionar coluna `moodNote: text("mood_note")` (nullable)
    - NÃO alterar, renomear ou remover colunas existentes (migração puramente aditiva)
    - _Requisitos: 3.1, 3.2_

  - [x] 2.2 Criar migration SQL aditiva para adicionar colunas
    - `ALTER TABLE days ADD COLUMN mood text;`
    - `ALTER TABLE days ADD COLUMN mood_note text;`
    - Executar migration via Drizzle Kit
    - _Requisitos: 3.1, 3.2_

- [x] 3. Criar queries de banco para mood
  - [x] 3.1 Criar `lib/db/queries/mood.ts` com queries de leitura e escrita
    - Implementar `updateDayMood(dayId: string, mood: MoodValue | null): Promise<void>`
    - Implementar `updateDayMoodNote(dayId: string, note: string | null): Promise<void>`
    - Implementar `getDayMood(userId: string, date: string): Promise<{ mood: MoodValue | null; moodNote: string | null }>` com normalização de valores inválidos para null na leitura
    - _Requisitos: 3.4, 3.5, 3.6, 6.5_

  - [x] 3.2 Atualizar `lib/db/queries/weeks.ts` para ler `days.mood` no `getWeekStatus`
    - Incluir `days.mood` no SELECT da query
    - Adicionar `days.mood` ao GROUP BY
    - Normalizar valores inválidos para null antes de retornar
    - Retornar mood no objeto DayStatus
    - _Requisitos: 6.4, 6.5_

  - [x] 3.3 Escrever teste de propriedade para normalização de mood inválido (Property 10)
    - **Property 10: Invalid mood values normalize to null on read**
    - **Valida: Requisitos 6.5**
    - Para qualquer string que NÃO é um dos 5 MoodValues válidos, a função de normalização retorna null
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/db/queries/__tests__/mood.test.ts`_

- [x] 4. Checkpoint — Schema, queries e validação
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Criar Server Actions para mood
  - [x] 5.1 Criar `lib/actions/mood.ts` com saveMood e saveMoodNote
    - `saveMood(input)`: valida via `saveMoodSchema`, verifica auth via `getCurrentUserId()`, chama `upsertDay` + `updateDayMood`, `revalidatePath("/")`
    - `saveMoodNote(input)`: valida via `saveMoodNoteSchema`, verifica auth, chama `upsertDay` + `updateDayMoodNote`, `revalidatePath("/")`
    - Ambas retornam `ActionResult` (`{ success: true } | { success: false; error: string }`)
    - Try/catch no DB retorna erro genérico sem expor detalhes internos
    - _Requisitos: 2.1, 3.4, 3.6, 4.7_

  - [x] 5.2 Escrever testes de exemplo para Server Actions de mood
    - `saveMood` persiste mood válido e retorna sucesso
    - `saveMood` com mood=null limpa o humor do dia
    - `saveMoodNote` persiste nota válida
    - `saveMoodNote` com whitespace-only persiste null
    - Rejeição de mood inválido (string fora do enum)
    - _Arquivo: `lib/actions/__tests__/mood.test.ts`_
    - _Requisitos: 2.1, 2.2, 3.5, 3.6, 4.6, 4.7_

- [x] 6. Criar constantes e funções utilitárias de mood
  - [x] 6.1 Criar `components/mood/moodConstants.ts` com mapping de emojis e aria-labels
    - Definir mapeamento `MoodValue → emoji`: awful→😞, bad→😕, neutral→🙂, good→😄, great→🤩
    - Implementar `getMoodEmoji(mood: MoodValue): string`
    - Implementar `getMoodAriaLabel(mood: MoodValue): string` com labels PT-BR ("péssimo", "ruim", "neutro", "bom", "ótimo")
    - Exportar array ordenado de mood options (awful → great) para uso no selector
    - _Requisitos: 1.1, 1.3, 1.5_

  - [x] 6.2 Escrever teste de propriedade para emoji mapping (Property 1)
    - **Property 1: Mood emoji mapping is complete and correct**
    - **Valida: Requisitos 1.1, 1.5**
    - Para qualquer MoodValue válido, `getMoodEmoji` retorna o emoji correto e `getMoodAriaLabel` retorna o aria-label PT-BR correspondente
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `components/mood/__tests__/moodConstants.test.ts`_

- [x] 7. Implementar MoodSelector e MoodCard
  - [x] 7.1 Criar `components/mood/MoodSelector.tsx`
    - Props: `currentMood: MoodValue | null`, `onSelect: (mood: MoodValue | null) => void`, `disabled?: boolean`
    - Renderizar 5 emojis em row horizontal ordenados awful → great
    - Se currentMood é null: todos com peso visual igual (sem highlight/dim)
    - Se currentMood é set: ativo highlighted, demais dimmed
    - Tap em opção não-ativa: chama `onSelect(mood)`
    - Tap em opção ativa: chama `onSelect(null)` (toggle off — clear)
    - Cada emoji com `aria-label` PT-BR via `getMoodAriaLabel`
    - Usar role="radiogroup" com botões individuais para acessibilidade
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3_

  - [x] 7.2 Criar `components/mood/MoodNoteInput.tsx`
    - Props: `date: string`, `initialNote: string | null`
    - Input de texto com `maxLength={80}` (impede digitação além)
    - Indicador de contagem "X/80" atualizado em tempo real
    - Ao atingir 80 chars: indicador de contagem muda de cor (visual highlight)
    - Botão "Salvar" que chama `saveMoodNote` Server Action via `useTransition`
    - Se nota vazia/whitespace ao salvar: persiste null silenciosamente
    - _Requisitos: 4.2, 4.3, 4.4, 4.5, 4.7, 4.8_

  - [x] 7.3 Criar `components/mood/MoodCard.tsx`
    - Props: `date: string`, `initialMood: MoodValue | null`, `initialNote: string | null`
    - Card container com título "Humor de hoje" e subtitle "Um toque só. Independente do que você escrever no registro do dia."
    - Gerencia estado otimístico via `useOptimistic` para mood
    - Renderiza `MoodSelector` com estado otimístico
    - Link trigger "adicionar uma palavra sobre esse humor (opcional)" que faz toggle do `MoodNoteInput`
    - Ao tap no trigger com input visível: colapsa o input
    - Ao tap em mood: chama `saveMood` via `useTransition`, atualiza otimisticamente em <100ms
    - Em caso de erro do server: reverte estado otimístico e exibe aviso inline "Não foi possível salvar. Tente novamente." (desaparece após 5s ou próxima interação bem-sucedida)
    - _Requisitos: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2_

  - [x] 7.4 Escrever teste de propriedade para toggle state machine (Property 2)
    - **Property 2: Mood toggle state machine**
    - **Valida: Requisitos 2.1, 2.2, 2.3**
    - Para qualquer par (currentMood, tappedMood): resultado é null se currentMood===tappedMood, senão tappedMood
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `components/mood/__tests__/MoodCard.test.tsx`_

  - [x] 7.5 Escrever teste de propriedade para highlight invariant (Property 3)
    - **Property 3: Optimistic UI highlight invariant**
    - **Valida: Requisitos 2.4, 1.4**
    - Para qualquer MoodValue ativo: exatamente 1 emoji "active" e 4 "dimmed". Para null: todos com peso igual.
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `components/mood/__tests__/MoodSelector.test.tsx`_

  - [x] 7.6 Escrever testes de exemplo para MoodCard e MoodSelector
    - MoodCard renderiza com mood=null (estado inicial, nenhum highlight)
    - MoodCard renderiza com mood ativo (highlight correto)
    - Toggle do input de nota (visibilidade)
    - Contador de caracteres "0/80" → "80/80"
    - MoodSelector com acessibilidade (aria-labels PT-BR)
    - _Arquivo: `components/mood/__tests__/MoodCard.test.tsx` e `components/mood/__tests__/MoodSelector.test.tsx`_
    - _Requisitos: 1.1, 1.4, 1.5, 2.4, 4.1, 4.4_

- [x] 8. Checkpoint — Componentes de mood
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Atualizar DayCell para Mood_Dot e integrar calendário
  - [x] 9.1 Atualizar `components/calendar/DayCell.tsx` para renderizar Mood_Dot em vez de emoji
    - Substituir renderização de emoji completo por ponto colorido (`day-cell__mood-dot`)
    - Mood_Dot com cor diferente do dot de log-count e posição separada na célula
    - Quando mood é null: NÃO renderizar nenhum indicador de mood (sem placeholder "not set")
    - Quando mood é MoodValue válido: renderizar dot com `aria-label` indicando presença de humor sem revelar o valor específico
    - NÃO exibir emoji no calendário semanal (emoji completo só no MoodCard)
    - _Requisitos: 6.1, 6.2, 6.3, 6.6_

  - [x] 9.2 Escrever teste de propriedade para mood dot presence (Property 11)
    - **Property 11: Mood dot presence and accessibility**
    - **Valida: Requisitos 6.1, 6.3, 6.6**
    - Para qualquer MoodValue válido: DayCell renderiza mood-dot com aria-label. Para null: nenhum mood-dot.
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `components/calendar/__tests__/DayCell.mood.test.tsx`_

  - [x] 9.3 Escrever testes de exemplo para DayCell com mood
    - DayCell sem mood (sem dot renderizado)
    - DayCell com mood válido (dot renderizado com cor e aria-label)
    - DayCell com mood e log-count (ambos indicadores simultâneos e distinguíveis)
    - _Arquivo: `components/calendar/__tests__/DayCell.mood.test.tsx`_
    - _Requisitos: 6.1, 6.2, 6.3, 6.6_

- [x] 10. Integrar MoodCard na HomePage e ajustar ordem das seções
  - [x] 10.1 Atualizar `app/(app)/page.tsx` para buscar mood e renderizar MoodCard
    - Importar e chamar `getDayMood(userId, todayDate)` para obter humor do dia
    - Renderizar `MoodCard` com props: `date`, `initialMood`, `initialNote`
    - Garantir ordem vertical: Calendar → MoodCard → TodayLogsCard → DailyLogPanel → WeeklyTasksPanel
    - _Requisitos: 5.1, 5.5_

  - [x] 10.2 Verificar separação visual entre MoodCard e DailyLogPanel
    - MoodCard e DailyLogPanel como containers card separados com headings próprios
    - Mínimo 16px de spacing vertical entre eles
    - MoodCard acima do DailyLogPanel
    - DailyLogPanel NÃO contém inputs de mood; MoodCard NÃO contém inputs de texto livre
    - Atualizar subtitle do DailyLogPanel para referenciar MoodCard pela posição relativa (ex: "ali em cima") em tempo presente, SEM linguagem de futuro
    - _Requisitos: 5.1, 5.2, 5.3, 5.4_

  - [x] 10.3 Escrever testes de exemplo para integração da HomePage
    - Ordem das seções: Calendar → MoodCard → TodayLogsCard → DailyLogPanel → WeeklyTasksPanel
    - Separação visual (containers distintos)
    - MoodCard não contém textarea de log; DailyLogPanel não contém mood selector
    - _Arquivo: `app/(app)/__tests__/page.mood.test.tsx`_
    - _Requisitos: 5.1, 5.2, 5.3, 5.5_

- [x] 11. Garantir independência do mood em relação a outras funcionalidades
  - [x] 11.1 Validar que features existentes funcionam com mood=null
    - Verificar que criação/leitura/edição/deleção de logs funciona com mood null
    - Verificar que tarefas semanais e reading companion não dependem de mood
    - Verificar que nenhuma tela exibe métrica, streak ou nudge de mood
    - Quando mood é null: ocultar indicador completamente do calendário (sem estado "empty" ou "not set")
    - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 12. Checkpoint Final — Integração completa
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido.
- Cada tarefa referencia requisitos específicos para rastreabilidade.
- O padrão `upsertDay` já existe no projeto — mood reutiliza o mesmo padrão (INSERT ON CONFLICT DO NOTHING + SELECT) antes de fazer UPDATE na coluna mood.
- A migração é puramente aditiva (ADD COLUMN), sem alterar colunas existentes.
- O tipo `MoodValue` será definido canonicamente em `lib/validation/mood.schema.ts` e reexportado onde necessário.
- Emojis do design: awful→😞, bad→😕, neutral→🙂, good→😄, great→🤩 (ordem no selector: awful→great, esquerda→direita).
- Optimistic update segue o padrão já estabelecido em logs e tarefas (`useOptimistic` + `useTransition`).
- Avisos de erro são inline, sem modal, e desaparecem após 5s ou na próxima interação bem-sucedida.
- Property tests usam `fast-check` (já no projeto) com mínimo 100 iterações por property.
- O DayCell atual exibe emoji completo; será atualizado para renderizar apenas Mood_Dot (ponto colorido) conforme requisito 6.2.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "6.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "2.1", "6.2"] },
    { "id": 2, "tasks": ["2.2"] },
    { "id": 3, "tasks": ["3.1", "3.2"] },
    { "id": 4, "tasks": ["3.3", "5.1"] },
    { "id": 5, "tasks": ["5.2", "7.1", "7.2"] },
    { "id": 6, "tasks": ["7.3", "7.4", "7.5"] },
    { "id": 7, "tasks": ["7.6", "9.1"] },
    { "id": 8, "tasks": ["9.2", "9.3", "10.1"] },
    { "id": 9, "tasks": ["10.2", "11.1"] },
    { "id": 10, "tasks": ["10.3"] }
  ]
}
```
