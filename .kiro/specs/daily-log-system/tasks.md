# Implementation Plan: Daily Log System

## Overview

Implementação do sistema de registro diário do Weekly Companion: visão do dia (`/day/[date]`), criação/edição/exclusão de logs com Optimistic UI, Quick Capture (FAB global), e queries de leitura/escrita com validação Zod. A feature é integrada com o banco Neon PostgreSQL e segue o padrão RSC + Server Actions + `useOptimistic`.

---

## Tasks

- [x] 1. Criar schema Zod para validação de logs
  - [x] 1.1 Criar `lib/validation/log.schema.ts` com schemas para create/update/delete
    - Definir `createLogSchema` com `content` (1-2000 chars, não whitespace) e `date` (yyyy-MM-dd)
    - Definir `updateLogSchema` com `logId` (uuid), `content`, e `date`
    - Definir `deleteLogSchema` com `logId` e `date`
    - Exportar tipos TypeScript `CreateLogInput`, `UpdateLogInput`, `DeleteLogInput`
    - _Requisitos: 2.2, 2.5, 3.3, 3.4, 8.1, 8.2, 8.3_

  - [x] 1.2 Escrever testes de propriedade para validação (Property 1)
    - **Property 1: Boundary de conteúdo — aceita válido, rejeita inválido**
    - **Valida: Requisitos 2.2, 2.5, 3.3, 3.4, 8.1, 8.2, 8.3**
    - Testar que aceita content de 1-2000 chars não-whitespace
    - Testar que rejeita vazio, só-whitespace, ou > 2000 chars
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/validation/__tests__/log.schema.test.ts`_

  - [x] 1.3 Escrever testes de exemplo para schema
    - Casos limítrofes: 1 char, 2000 chars, 2001 chars
    - Vazio, espaços, abas, quebras de linha
    - Datas válidas e inválidas
    - UUIDs válidos e inválidos
    - _Arquivo: `lib/validation/__tests__/log.schema.test.ts`_

- [x] 2. Criar queries de banco para logs
  - [x] 2.1 Atualizar schema Drizzle com unique constraint em days
    - Adicionar `uniqueIndex("days_user_id_date_unique").on(userId, date)` na tabela `days`
    - Arquivo: `drizzle/schema.ts`
    - _Requisito: 8.4_

  - [x] 2.2 Criar `lib/db/queries/logs.ts` com funções de leitura/escrita
    - Implementar `getDayLogs(userId, date): Promise<Log[]>` — SELECT com ORDER BY created_at ASC
    - Implementar `upsertDay(userId, date): Promise<Day>` — INSERT ON CONFLICT DO NOTHING + SELECT
    - Implementar `insertLog(input)` — INSERT retornando o log criado
    - Implementar `updateLogById(logId, content)` — UPDATE
    - Implementar `deleteLogById(logId)` — DELETE
    - Implementar `getLogOwner(logId)` — SELECT userId via join para autorização
    - _Requisitos: 1.1, 2.1, 3.1, 4.1, 5.7, 8.4_

  - [x] 2.3 Escrever teste de integração para upsertDay idempotência (Property 3)
    - **Property 3: Idempotência do upsertDay**
    - **Valida: Requisitos 2.7, 5.8**
    - Chamar `upsertDay` múltiplas vezes e verificar que retorna sempre o mesmo `id`
    - Verificar que não há registros duplicados no banco
    - _Arquivo: `lib/db/queries/__tests__/logs.test.ts`_

  - [x] 2.4 Escrever testes de exemplo para queries
    - `getDayLogs` retorna lista ordenada cronologicamente
    - `upsertDay` cria Day se não existe, retorna existente caso contrário
    - `insertLog`, `updateLogById`, `deleteLogById` funcionam corretamente
    - Autorização: `getLogOwner` retorna userId correto
    - _Arquivo: `lib/db/queries/__tests__/logs.test.ts`_
    - _Requisitos: 1.1, 2.1, 4.2, 5.2_

- [x] 3. Criar Server Actions para mutação de logs
  - [x] 3.1 Criar `lib/actions/logs.ts` com createLog, updateLog, deleteLog
    - Implementar `createLog(input)`: valida via schema, chama `upsertDay`, `insertLog`, revalida cache
    - Implementar `updateLog(input)`: valida, checa autorização via `getLogOwner`, atualiza, revalida
    - Implementar `deleteLog(input)`: valida, checa autorização, deleta, revalida
    - Todas retornam `{ success: true } | { success: false; error: string }`
    - _Requisitos: 2.1, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 8.4_

  - [x] 3.2 Escrever testes de exemplo para Server Actions
    - `createLog` cria log com Zod validation, chama upsertDay, retorna sucesso
    - `updateLog` valida autorização e rejeita usuário não-dono
    - `deleteLog` valida autorização e rejeita usuário não-dono
    - Todos retornam erro estruturado em caso de falha
    - _Arquivo: `lib/actions/__tests__/logs.test.ts`_
    - _Requisitos: 2.1, 3.1, 3.2, 4.1, 4.2_

- [x] 4. Criar componentes de UI para visão do dia
  - [x] 4.1 Criar `app/(app)/day/[date]/page.tsx` (Server Component)
    - Validar param `date` com Zod (yyyy-MM-dd, data válida)
    - Chamar `notFound()` se inválido
    - Buscar `getDayLogs(userId, date)` no servidor
    - Calcular `weekStart` via `getWeekStart(date)` para link de volta
    - Determinar `isToday` e exibir data legível (pt-BR com date-fns)
    - Renderizar `LogList` e link de retorno ao calendário
    - _Requisitos: 1.1, 1.2, 1.3, 7.1, 7.3_

  - [x] 4.2 Criar `components/logs/LogList.tsx` (Client Component com Optimistic UI)
    - Estado otimístico via `useOptimistic` com reducer para add/remove/update
    - Exibir `LogItem` para cada log
    - Exibir `LogForm` para criação
    - Exibir Empty State quando sem logs
    - Chamar `createLog` server action e atualizar otimisticamente
    - Reverter em caso de erro via dispatch remove
    - _Requisitos: 1.1, 2.1, 2.3, 2.4, 4.1, 6.1, 6.3, 6.4_

  - [x] 4.3 Criar `components/logs/LogForm.tsx` (Client Component)
    - Campo textarea para entrada de novo log
    - Validação client-side: não-vazio, trim, max 2000 chars
    - Botão submit
    - Exibir erro inline se validação falhar
    - Limpar campo após submit bem-sucedido
    - _Requisitos: 2.1, 2.2, 2.5, 2.6_

  - [x] 4.4 Criar `components/logs/LogItem.tsx` (Client Component)
    - Exibir conteúdo do log
    - Botão "Editar" que mostra textarea com conteúdo pré-preenchido
    - Botão "Excluir" que pede confirmação antes de executar
    - Chamar `updateLog` e `deleteLog` server actions
    - Exibir erro inline se falhar
    - Revertê-lo via revalidatePath (servidor) em caso de erro
    - _Requisitos: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4_

  - [x] 4.5 Escrever testes de exemplo para componentes
    - `LogList` renderiza todos os logs iniciais
    - `LogForm` valida entrada e chama createLog
    - `LogItem` permite editar e deletar com confirmação
    - Optimistic UI remove log após exclusão confirmada
    - Empty State aparece quando sem logs
    - _Arquivo: `components/logs/__tests__/` (.test.tsx para cada componente)_
    - _Requisitos: 1.1, 2.1, 2.3, 3.1, 3.3, 4.1, 4.4, 6.1_

- [x] 5. Criar Quick Capture global (FAB)
  - [x] 5.1 Criar `components/logs/QuickCaptureButton.tsx` (Client Component)
    - FAB (botão flutuante +) posicionado fixed bottom-right
    - Estado open/closed local
    - Renderiza `QuickCaptureSheet` quando aberto
    - Esconde-se quando sheet está aberto
    - _Requisitos: 5.1, 5.2_

  - [x] 5.2 Criar `components/logs/QuickCaptureSheet.tsx` (Client Component)
    - Sheet/modal que sobrepõe a tela
    - Textarea com autoFocus quando abre
    - Submete para data atual (não para a que o usuário estava visualizando)
    - Fecha automaticamente após sucesso
    - Permanece aberto em caso de erro, exibindo mensagem
    - Suporte para Escape key para fechar sem salvar
    - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [x] 5.3 Atualizar `app/(app)/layout.tsx` para incluir QuickCaptureButton
    - Renderizar `<QuickCaptureButton />` em todas as rotas do grupo (app)
    - _Requisito: 5.1_

  - [x] 5.4 Escrever testes de exemplo para Quick Capture
    - FAB abre sheet com <300ms de latência
    - Sheet fecha ao pressionar Escape sem criar log
    - Sheet fecha automaticamente após sucesso
    - Sheet permanece aberto em caso de erro
    - Log criado é associado à data atual, não à que estava visualizando
    - _Arquivo: `components/logs/__tests__/QuickCapture.test.tsx`_
    - _Requisitos: 5.1, 5.4, 5.5, 5.6, 5.7_

- [x] 6. Criar rota de retorno ao calendário
  - [x] 6.1 Atualizar `app/(app)/day/[date]/page.tsx` com link de volta
    - Link no header que navega para `/week/[weekStart]`
    - Calcular `weekStart` a partir de `date`
    - _Requisitos: 7.1, 7.3, 7.4_

  - [x] 6.2 Escrever teste de propriedade para weekStart (Property 6)
    - **Property 6: weekStart calculado a partir de qualquer data**
    - **Valida: Requisito 7.3**
    - Para qualquer data válida, `getWeekStart(date)` retorna segunda-feira da semana
    - _Arquivo: `lib/utils/__tests__/date.test.ts`_

- [x] 7. Checkpoint — Validar componentes e integração
  - Garantir que todos os testes passam (`npm run test`)
  - Verificar que TypeScript compila sem erros (`tsc --noEmit`)
  - Fazer uma rodada rápida de testes e2e localmente ou no Vercel Preview
  - Pergunta ao usuário se houver dúvidas

- [x] 8. Checkpoint Final — Garantir que tudo está funcionando
  - Rodar suite completa de testes
  - Verificar que Quick Capture funciona de qualquer tela
  - Verificar que volta ao calendário funciona
  - Verificar que Optimistic UI reverte em caso de erro
  - Perguntar ao usuário se houver dúvidas

---

## Notes

- Tarefas marcadas sem `*` são obrigatórias.
- Tarefas opcionais podem ser omitidas para MVP mais rápido (não há neste caso).
- Cada tarefa referencia requisitos específicos para rastreabilidade.
- Testes de propriedade (PBT) com `fast-check` validam Properties 1, 3, 6; testes de exemplo cobrem cenários específicos.
- O padrão `upsertDay` com `INSERT ON CONFLICT + SELECT` garante idempotência sem race condition em ambiente serverless.
- Optimistic UI via `useOptimistic` reverte automaticamente em caso de erro, sem necessidade de fallback manual.
- Todas as mutações chamam `revalidatePath` para invalidar cache de RSC.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.2"] },
    { "id": 2, "tasks": ["2.3", "2.4", "3.1"] },
    { "id": 3, "tasks": ["3.2", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "4.4"] },
    { "id": 5, "tasks": ["4.5", "5.1", "5.2"] },
    { "id": 6, "tasks": ["5.3", "5.4", "6.1"] },
    { "id": 7, "tasks": ["6.2", "7"] },
    { "id": 8, "tasks": ["8"] }
  ]
}
```
