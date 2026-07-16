# Implementation Plan: Weekly Task System

## Overview

Implementação do sistema de tarefas semanais do app **semana.**: biblioteca de tarefas (CRUD), plano semanal com seleção e metas, contadores informativos `feito/meta` com bump manual e auto-incremento via logs, e chips de vinculação na criação de logs. Integra-se ao módulo de logs diários existente e utiliza o padrão RSC + Server Actions + `useOptimistic` + Zod + Drizzle ORM.

---

## Tasks

- [x] 1. Criar tipos, utilitários e schemas de validação
  - [x] 1.1 Criar `lib/types/tasks.ts` com interfaces TypeScript
    - Definir `TaskLibraryItem` (id, name, defaultQty)
    - Definir `ActiveTaskDisplay` (weekPlanTaskId, taskId, name, goal, done)
    - Definir `WeekPlanSummary` (weekPlanId, weekStart, tasks)
    - _Requisitos: 1.1, 2.8, 3.1_

  - [x] 1.2 Criar `lib/utils/clamp.ts` com função de clamping
    - Implementar `clamp(value: number, min: number, max: number): number`
    - Retorna `Math.min(Math.max(value, min), max)`
    - Exportar como named export
    - _Requisitos: 1.5, 2.3_

  - [x] 1.3 Criar `lib/validation/task.schema.ts` com schemas Zod para tarefas
    - Definir `taskNameSchema` (string, 1–100 chars, trim não-vazio)
    - Definir `defaultQtySchema` (int, min 1, max 99)
    - Exportar `createTaskSchema` (name + defaultQty)
    - Exportar `updateTaskSchema` (taskId uuid + name opcional + defaultQty opcional)
    - Exportar `deleteTaskSchema` (taskId uuid)
    - Exportar tipos TypeScript inferidos
    - _Requisitos: 1.3, 1.4, 1.5, 1.6_

  - [x] 1.4 Criar `lib/validation/weekPlan.schema.ts` com schemas Zod para planos semanais
    - Definir `weekStartSchema` (string regex yyyy-MM-dd)
    - Definir `planTaskSchema` (taskId uuid + goal int 1–99)
    - Exportar `saveWeekPlanSchema` (weekStart + tasks array)
    - Exportar `bumpTaskSchema` (weekPlanTaskId uuid)
    - Exportar tipos TypeScript inferidos
    - _Requisitos: 2.2, 2.3, 3.3_

  - [x] 1.5 Atualizar `lib/validation/log.schema.ts` para incluir `weekPlanTaskId`
    - Adicionar campo `weekPlanTaskId: z.string().uuid().nullable().optional()` ao `createLogSchema`
    - Atualizar tipo `CreateLogInput` exportado
    - _Requisitos: 4.5, 4.8_

  - [ ]* 1.6 Escrever testes de propriedade para clamping (Property 3)
    - **Property 3: Quantity clamping invariant**
    - **Valida: Requisitos 1.5, 2.3**
    - Para qualquer inteiro, `clamp(value, 1, 99)` === `Math.min(Math.max(value, 1), 99)`
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/utils/__tests__/clamp.test.ts`_

  - [ ]* 1.7 Escrever testes de propriedade para validação de tarefas (Property 2)
    - **Property 2: Whitespace-only names rejected**
    - **Valida: Requisitos 1.3**
    - Para qualquer string composta apenas de whitespace, `createTaskSchema.safeParse` rejeita
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/validation/__tests__/task.schema.test.ts`_

  - [ ]* 1.8 Escrever testes de propriedade para weekPlanTaskId (Property 12)
    - **Property 12: weekPlanTaskId validation**
    - **Valida: Requisitos 4.8**
    - Para qualquer string, `createLogSchema` aceita como weekPlanTaskId se e somente se é UUID válido ou null
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/validation/__tests__/log.schema.test.ts`_

- [x] 2. Atualizar schema Drizzle e criar queries de banco
  - [x] 2.1 Atualizar `drizzle/schema.ts` com novas tabelas e relações
    - Adicionar tabela `tasks` (id, userId FK, name, defaultQty, createdAt)
    - Adicionar tabela `weekPlans` (id, userId FK, weekStart, createdAt) com unique constraint (userId, weekStart)
    - Adicionar tabela `weekPlanTasks` (id, weekPlanId FK, taskId FK restrict, goal, done default 0, createdAt)
    - Adicionar campo `weekPlanTaskId` (uuid nullable, FK → weekPlanTasks onDelete set null) à tabela `logs`
    - Adicionar relações Drizzle para as novas tabelas
    - Exportar tipos inferidos `Task`, `WeekPlan`, `WeekPlanTask`
    - _Requisitos: 1.1, 2.7, 3.4, 4.5_

  - [x] 2.2 Criar `lib/db/queries/tasks.ts` com queries para biblioteca de tarefas
    - Implementar `getUserTasks(userId): Promise<Task[]>` — SELECT ordenado por createdAt ASC
    - Implementar `insertTask(input: { userId, name, defaultQty }): Promise<Task>`
    - Implementar `updateTaskById(taskId, data: { name?, defaultQty? }): Promise<void>`
    - Implementar `deleteTaskById(taskId): Promise<void>`
    - Implementar `getTaskOwner(taskId): Promise<{ userId: string } | undefined>`
    - _Requisitos: 1.1, 1.2, 1.6, 1.7, 1.8_

  - [x] 2.3 Criar `lib/db/queries/weekPlans.ts` com queries para planos semanais
    - Implementar `getWeekPlan(userId, weekStart): Promise<WeekPlanSummary | null>` — busca plano com tarefas ativas e joins em tasks.name
    - Implementar `upsertWeekPlan(userId, weekStart): Promise<WeekPlan>` — INSERT ON CONFLICT DO NOTHING + SELECT
    - Implementar `syncWeekPlanTasks(weekPlanId, tasks: Array<{ taskId, goal }>): Promise<void>` — delete all + insert batch (sync completo)
    - Implementar `bumpWeekPlanTask(weekPlanTaskId): Promise<void>` — incrementa done em 1
    - Implementar `decrementWeekPlanTask(weekPlanTaskId): Promise<void>` — decrementa done em 1, floor 0
    - Implementar `getWeekPlanTaskOwner(weekPlanTaskId): Promise<{ userId: string; weekStart: string } | undefined>`
    - _Requisitos: 2.2, 2.7, 3.2, 3.3, 3.4, 4.9_

  - [x] 2.4 Atualizar `lib/db/queries/logs.ts` para suportar weekPlanTaskId
    - Atualizar `insertLog` para aceitar campo opcional `weekPlanTaskId`
    - Adicionar `getLogWeekPlanTaskId(logId): Promise<string | null>` — retorna weekPlanTaskId do log (para decrementar ao excluir)
    - _Requisitos: 4.5, 3.4_

- [x] 3. Checkpoint — Schema e queries
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Criar Server Actions para tarefas e planos semanais
  - [x] 4.1 Criar `lib/actions/tasks.ts` com createTask, updateTask, deleteTask
    - `createTask(input)`: valida via `createTaskSchema`, verifica auth, insere no banco, revalidatePath("/")
    - `updateTask(input)`: valida via `updateTaskSchema`, verifica ownership via `getTaskOwner`, atualiza
    - `deleteTask(input)`: valida via `deleteTaskSchema`, verifica ownership, deleta (try/catch para restrict FK)
    - Todas retornam `ActionResult` (`{ success: true } | { success: false; error: string }`)
    - _Requisitos: 1.2, 1.6, 1.7, 1.8, 1.11_

  - [x] 4.2 Criar `lib/actions/weekPlans.ts` com saveWeekPlan e bumpTask
    - `saveWeekPlan(input)`: valida via `saveWeekPlanSchema`, verifica auth, upsert weekPlan, sync tasks, revalidatePath("/")
    - `bumpTask(input)`: valida via `bumpTaskSchema`, verifica ownership via `getWeekPlanTaskOwner`, incrementa done, revalidatePath("/")
    - _Requisitos: 2.2, 2.4, 2.5, 2.11, 3.3, 3.7, 3.9_

  - [x] 4.3 Atualizar `lib/actions/logs.ts` para suportar vinculação de tarefas
    - `createLog`: após inserir log, se `weekPlanTaskId` presente e válido (pertence ao mesmo user/semana), incrementa done via `bumpWeekPlanTask`
    - `createLog`: valida ownership de weekPlanTaskId antes de vincular — rejeita com "Tarefa inválida para esta semana" se inválido
    - `deleteLog`: antes de excluir, busca weekPlanTaskId do log; se existir, decrementa done via `decrementWeekPlanTask`
    - _Requisitos: 3.2, 3.4, 4.4, 4.5, 4.9_

  - [ ]* 4.4 Escrever testes de propriedade para increment/decrement (Properties 8, 9)
    - **Property 8: Increment invariant (bump and log-creation)**
    - **Valida: Requisitos 3.2, 3.3, 3.7**
    - Para qualquer done value `d`, bump resulta em `d + 1`
    - **Property 9: Decrement with floor at zero**
    - **Valida: Requisitos 3.4**
    - Para qualquer done value `d`, decrement resulta em `max(d - 1, 0)`
    - _Arquivo: `lib/actions/__tests__/weekPlans.test.ts`_

  - [ ]* 4.5 Escrever testes de exemplo para Server Actions de tarefas
    - `createTask` cria tarefa com validação Zod, retorna sucesso
    - `updateTask` valida ownership e rejeita não-dono
    - `deleteTask` retorna erro amigável se tarefa em uso por week_plan_tasks (restrict FK)
    - _Arquivo: `lib/actions/__tests__/tasks.test.ts`_
    - _Requisitos: 1.2, 1.6, 1.7, 1.8, 1.11_

  - [ ]* 4.6 Escrever testes de exemplo para Server Actions de planos
    - `saveWeekPlan` persiste apenas tarefas ativas
    - `bumpTask` incrementa done em 1
    - `createLog` com weekPlanTaskId incrementa done automaticamente
    - `deleteLog` de log vinculado decrementa done (min 0)
    - _Arquivo: `lib/actions/__tests__/weekPlans.test.ts`_
    - _Requisitos: 2.2, 3.2, 3.3, 3.4_

- [x] 5. Checkpoint — Server Actions
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implementar WeeklyTasksPanel e modais
  - [x] 6.1 Substituir placeholder `components/home/WeeklyTasksPanel.tsx` por implementação real
    - Aceitar props: `weekStart`, `activeTasks`, `allTasks`
    - Estado otimístico via `useOptimistic` para activeTasks
    - Listar cada ActiveTaskDisplay com Contador `feito/meta`
    - Botão de bump por tarefa (incrementa done otimisticamente, chama `bumpTask`)
    - Indicador visual positivo (classe `done`) quando done >= goal
    - Empty state: "Nenhuma tarefa planejada ainda. Use 'Planejar semana'."
    - Botões "Editar tarefas" e "Planejar semana" para abrir modais
    - ZERO linguagem de cobrança ou pressão
    - _Requisitos: 1.9, 2.8, 2.9, 3.1, 3.3, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [x] 6.2 Criar `components/home/ModalEditarTarefas.tsx`
    - Props: `tasks: TaskLibraryItem[]`, `onClose: () => void`
    - Lista de tarefas existentes com campos editáveis (nome maxLength 100, qty clamped 1–99)
    - Formulário para adicionar nova tarefa (nome + qty)
    - Botão "Remover" com confirmação
    - Empty state: "Nenhuma tarefa criada ainda."
    - Feedback otimístico para add/edit/remove
    - Aviso inline em caso de erro (sem modal de erro)
    - _Requisitos: 1.2, 1.3, 1.4, 1.5, 1.8, 1.9, 1.10, 1.11_

  - [x] 6.3 Criar `components/home/ModalPlanejarSemana.tsx`
    - Props: `weekStart`, `tasks: TaskLibraryItem[]`, `currentPlan: WeekPlanTaskInput[]`, `onClose`
    - Checkbox por tarefa (ativar/desativar)
    - Campo qty editável por tarefa (clamped 1–99, pré-preenchido com meta atual ou defaultQty)
    - Botão "Salvar plano" chama `saveWeekPlan` Server Action
    - Biblioteca vazia: "Adicione tarefas na biblioteca primeiro." + botão desabilitado
    - Mantém modal aberto em caso de erro + aviso inline
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5, 2.10, 2.11_

  - [ ]* 6.4 Escrever teste de propriedade para counter display (Property 7)
    - **Property 7: Counter display format**
    - **Valida: Requisitos 3.1**
    - Para qualquer (done >= 0, goal ∈ [1, 99]), display produz exatamente `"{done}/{goal}"`
    - _Arquivo: `components/home/__tests__/WeeklyTasksPanel.test.tsx`_

  - [ ]* 6.5 Escrever testes de exemplo para WeeklyTasksPanel e modais
    - WeeklyTasksPanel renderiza tarefas com contadores
    - Bump incrementa contador visualmente
    - Empty state exibido quando sem tarefas ativas
    - ModalEditarTarefas: add/edit/remove com validação
    - ModalPlanejarSemana: salva apenas tarefas com checkbox marcado
    - _Arquivo: `components/home/__tests__/WeeklyTasksPanel.test.tsx`_
    - _Requisitos: 1.9, 1.10, 2.8, 2.9, 2.10, 3.1, 3.5_

- [x] 7. Implementar TaskChips e integrar com criação de logs
  - [x] 7.1 Criar `components/logs/TaskChips.tsx`
    - Props: `activeTasks: ActiveTaskDisplay[]`, `selectedTaskId: string | null`, `onSelect: (id | null) => void`
    - Chip "nenhuma" sempre primeiro e selecionado por padrão
    - Apenas 1 chip ativo por vez (comportamento radio)
    - Oculto se activeTasks está vazio
    - Scroll horizontal se necessário
    - Estado visual "active" no chip selecionado
    - _Requisitos: 4.1, 4.2, 4.3, 4.6_

  - [x] 7.2 Atualizar `components/home/DailyLogPanel.tsx` para incluir TaskChips
    - Aceitar nova prop `activeTasks: ActiveTaskDisplay[]`
    - Renderizar `TaskChips` acima do textarea
    - Incluir `weekPlanTaskId` selecionado no payload de `createLog`
    - _Requisitos: 4.1, 4.4, 4.5_

  - [x] 7.3 Atualizar `components/logs/QuickCaptureSheet.tsx` para incluir TaskChips
    - Aceitar nova prop `activeTasks: ActiveTaskDisplay[]`
    - Renderizar `TaskChips` acima do textarea
    - Incluir `weekPlanTaskId` selecionado no payload de `createLog`
    - Reset seleção para "nenhuma" após submit bem-sucedido
    - _Requisitos: 4.1, 4.4, 4.5_

  - [ ]* 7.4 Escrever testes de propriedade para chip selection (Properties 10, 11)
    - **Property 10: Chip selection invariant**
    - **Valida: Requisitos 4.2, 4.3**
    - Para qualquer sequência de seleções, exatamente 1 chip ativo por vez
    - **Property 11: Chip-to-weekPlanTaskId mapping**
    - **Valida: Requisitos 4.4, 4.5**
    - Se "nenhuma" selecionado → weekPlanTaskId null; senão → weekPlanTaskId do chip
    - _Arquivo: `components/logs/__tests__/TaskChips.test.tsx`_

  - [ ]* 7.5 Escrever testes de exemplo para TaskChips
    - Renderiza chips para tarefas ativas
    - Oculto quando sem tarefas ativas
    - Seleção de chip atualiza estado visual
    - Chip "nenhuma" selecionado por padrão
    - _Arquivo: `components/logs/__tests__/TaskChips.test.tsx`_
    - _Requisitos: 4.1, 4.2, 4.3, 4.6_

- [x] 8. Integrar HomePage e wiring final
  - [x] 8.1 Atualizar `app/(app)/page.tsx` para buscar dados de tarefas
    - Importar e chamar `getUserTasks(userId)` para obter biblioteca
    - Importar e chamar `getWeekPlan(userId, weekStart)` para obter plano ativo
    - Passar `weekStart`, `activeTasks` e `allTasks` para `WeeklyTasksPanel`
    - Passar `activeTasks` para `DailyLogPanel`
    - _Requisitos: 2.8, 4.1_

  - [x] 8.2 Atualizar `app/(app)/layout.tsx` para passar activeTasks ao QuickCaptureButton
    - Buscar dados de tarefas ativas da semana corrente
    - Passar `activeTasks` para `QuickCaptureSheet` via `QuickCaptureButton`
    - _Requisitos: 4.1_

  - [x] 8.3 Atualizar exibição de logs para mostrar badge de tarefa vinculada
    - Atualizar query `getDayLogs` para incluir join em weekPlanTasks → tasks.name
    - Atualizar `LogItem` para exibir badge com nome da tarefa quando log tem weekPlanTaskId
    - _Requisitos: 4.7_

  - [ ]* 8.4 Escrever testes de propriedade para round-trip e isolation (Properties 1, 4, 5, 6)
    - **Property 1: Task creation round-trip**
    - **Valida: Requisitos 1.2**
    - **Property 4: Plan saves only active tasks**
    - **Valida: Requisitos 2.2**
    - **Property 5: Reducing goal preserves done**
    - **Valida: Requisitos 2.5**
    - **Property 6: Week plan isolation**
    - **Valida: Requisitos 2.7**
    - _Arquivo: `lib/db/queries/__tests__/weekPlans.test.ts`_

- [x] 9. Checkpoint Final — Integração completa
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido.
- Cada tarefa referencia requisitos específicos para rastreabilidade.
- O padrão `upsertWeekPlan` segue o mesmo modelo de `upsertDay` (INSERT ON CONFLICT + SELECT).
- `syncWeekPlanTasks` faz delete-all + insert-batch para simplificar o upsert de tarefas no plano (evita complexidade de diff).
- O campo `weekPlanTaskId` na tabela `logs` usa `onDelete: "set null"` para preservar logs se week_plan_task for removida.
- A tabela `tasks` usa `onDelete: "restrict"` na FK de `week_plan_tasks` para impedir deleção de tarefas em uso — Server Action trata o erro com mensagem amigável.
- Contadores NUNCA mostram linguagem negativa (sem "faltam N", "atrasado", etc.).
- Property tests usam `fast-check` (já no projeto) com mínimo 100 iterações por property.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4"] },
    { "id": 1, "tasks": ["1.5", "1.6", "1.7", "1.8", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4"] },
    { "id": 3, "tasks": ["4.1", "4.2", "4.3"] },
    { "id": 4, "tasks": ["4.4", "4.5", "4.6"] },
    { "id": 5, "tasks": ["6.1", "6.2", "6.3"] },
    { "id": 6, "tasks": ["6.4", "6.5", "7.1"] },
    { "id": 7, "tasks": ["7.2", "7.3", "7.4", "7.5"] },
    { "id": 8, "tasks": ["8.1", "8.2", "8.3"] },
    { "id": 9, "tasks": ["8.4"] }
  ]
}
```
