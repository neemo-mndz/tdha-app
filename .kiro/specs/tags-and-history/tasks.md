# Implementation Plan: Tags and History

## Overview

Implementação do sistema de Tags e Histórico: criação de tags flexíveis para log entries (tabelas `tags` e `log_tags`), edição inline de tags nos logs, tela unificada de histórico com busca textual (accent+case insensitive via `unaccent`), filtro por tags (OR logic), e filtro por semana (reutilizando WeekNavigator). Todas as mudanças de schema são puramente aditivas. Segue o padrão existente: RSC + Server Actions + Zod + Drizzle ORM + Vitest + fast-check.

---

## Tasks

- [x] 1. Criar schemas de validação e tipos para tags e busca
  - [x] 1.1 Criar `lib/validation/tag.schema.ts` com schemas Zod e tipos
    - Definir `tagNameSchema`: string min(1), max(30), trim, refine non-whitespace-only
    - Definir `createTagSchema`, `addTagToLogSchema`, `removeTagFromLogSchema`, `deleteTagSchema`
    - Exportar tipos inferidos: `CreateTagInput`, `AddTagToLogInput`, `RemoveTagFromLogInput`, `DeleteTagInput`
    - _Requirements: 1.1, 1.4, 10.2_

  - [x] 1.2 Criar `lib/validation/search.schema.ts` com schema de busca
    - Definir `searchLogsSchema`: text (max 200, optional default ""), tagIds (array uuid, optional default []), weekStart (date regex nullable, optional default null)
    - Exportar tipo `SearchLogsInput`
    - _Requirements: 6.1, 7.2, 8.2, 8.3_

  - [ ]* 1.3 Escrever testes de validação para tag.schema.ts
    - Tag name vazio → rejeição
    - Tag name whitespace-only → rejeição
    - Tag name > 30 chars → rejeição
    - Tag name válido (1–30 chars com trim) → aceito
    - UUIDs inválidos em logId/tagId → rejeição
    - _Arquivo: `lib/validation/__tests__/tag.schema.test.ts`_
    - _Requirements: 1.1, 1.4_

  - [ ]* 1.4 Escrever testes de validação para search.schema.ts
    - Text > 200 chars → rejeição
    - tagIds com UUID inválido → rejeição
    - weekStart com formato inválido → rejeição
    - Inputs válidos e defaults corretos → aceitos
    - _Arquivo: `lib/validation/__tests__/search.schema.test.ts`_
    - _Requirements: 6.1, 8.3_

- [x] 2. Atualizar schema Drizzle e criar migration de banco
  - [x] 2.1 Atualizar `drizzle/schema.ts` para adicionar tabelas `tags` e `log_tags`
    - Definir tabela `tags`: id (uuid PK defaultRandom), userId (uuid FK → users.id ON DELETE CASCADE), name (text NOT NULL), createdAt (timestamptz NOT NULL defaultNow)
    - Definir unique index `tags_user_id_name_unique` em (userId, name)
    - Definir tabela `log_tags`: logId (uuid FK → logs.id ON DELETE CASCADE), tagId (uuid FK → tags.id ON DELETE CASCADE), composite PK(logId, tagId)
    - Definir relations para `tags` e `logTags`
    - NÃO alterar tabelas existentes (schema puramente aditivo)
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 2.2 Criar migration SQL para tabelas tags e log_tags
    - `CREATE TABLE tags` com colunas e constraints
    - `CREATE UNIQUE INDEX tags_user_id_name_unique ON tags (user_id, lower(name))` para unicidade case-insensitive
    - `CREATE TABLE log_tags` com composite PK e FKs com CASCADE
    - `CREATE EXTENSION IF NOT EXISTS unaccent` para busca accent-insensitive
    - Executar migration via Drizzle Kit
    - _Requirements: 10.1, 10.2, 10.3, 6.2_

- [x] 3. Criar queries de banco para tags
  - [x] 3.1 Criar `lib/db/queries/tags.ts` com operações CRUD de tags
    - Implementar `createTag(userId, name): Promise<Tag>`
    - Implementar `getUserTags(userId): Promise<Tag[]>`
    - Implementar `findTagByName(userId, name): Promise<Tag | undefined>` com comparação case-insensitive via `lower()`
    - Implementar `deleteTagById(tagId): Promise<void>`
    - Implementar `addTagToLog(logId, tagId): Promise<void>` com `onConflictDoNothing`
    - Implementar `removeTagFromLog(logId, tagId): Promise<void>`
    - Implementar `getTagsForLog(logId): Promise<Tag[]>`
    - Implementar `getTagWithLogCount(userId): Promise<(Tag & { logCount: number })[]>`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.3, 4.2, 4.3, 4.4, 5.1_

  - [ ]* 3.2 Escrever teste de propriedade para criação de tag com unicidade case-insensitive (Property 1)
    - **Property 1: Tag creation produces valid record with case-insensitive uniqueness**
    - **Validates: Requirements 1.1, 1.2, 1.4**
    - Para qualquer nome válido (1–30 chars, trimmed), createTag produz record com UUID, user ref, nome trimmed e timestamp
    - Tentativa de criar segunda tag com mesmo nome (case-insensitive) para mesmo usuário é rejeitada
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/db/queries/__tests__/tags.test.ts`_

  - [ ]* 3.3 Escrever teste de propriedade para lookup case-insensitive (Property 2)
    - **Property 2: Case-insensitive tag lookup returns existing match**
    - **Validates: Requirements 1.3**
    - Para qualquer tag existente e qualquer variação de case do nome, findTagByName retorna a tag existente
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/db/queries/__tests__/tags.test.ts`_

  - [ ]* 3.4 Escrever teste de propriedade para contagem de associações (Property 3)
    - **Property 3: Tag association count matches input**
    - **Validates: Requirements 2.1, 4.2**
    - Para qualquer log e N tags distintas (0 ≤ N), associar todas resulta em exatamente N rows em log_tags
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/db/queries/__tests__/tags.test.ts`_

  - [ ]* 3.5 Escrever teste de propriedade para round-trip de associação (Property 4)
    - **Property 4: Tag association round-trip (add then remove)**
    - **Validates: Requirements 4.2, 4.3, 4.4**
    - Para qualquer log e tag válida, adicionar e remover resulta em 0 rows para o par (log, tag), com a tag ainda presente na lista do usuário
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/db/queries/__tests__/tags.test.ts`_

  - [ ]* 3.6 Escrever teste de propriedade para cascade em deleção de log (Property 5)
    - **Property 5: Cascade on log deletion removes all tag associations**
    - **Validates: Requirements 2.4**
    - Para qualquer log com N tags associadas, deletar o log resulta em 0 rows em log_tags para aquele log_id, com as N tags mantidas na tabela tags
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/db/queries/__tests__/tags.test.ts`_

  - [ ]* 3.7 Escrever teste de propriedade para cascade em deleção de tag (Property 6)
    - **Property 6: Cascade on tag deletion removes all log associations**
    - **Validates: Requirements 2.5, 5.3**
    - Para qualquer tag associada a M logs, deletar a tag resulta em 0 rows em log_tags para aquele tag_id, e a tag não existe mais na tabela tags
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/db/queries/__tests__/tags.test.ts`_

- [x] 4. Checkpoint — Schema, validação e queries de tags
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Criar queries de busca e Server Actions
  - [x] 5.1 Criar `lib/db/queries/search.ts` com query combinada de busca
    - Implementar `searchLogs(userId, filters: { text, tagIds, weekStart })` com:
      - Busca textual via `unaccent(lower())` + ILIKE em logs.content e days.mood_note
      - Filtro de tags via ANY (OR logic)
      - Filtro de semana via date range [weekStart, weekStart + 7 days)
      - AND entre tipos de filtro
      - Sem filtros ativos → retorna todos os logs em ordem cronológica reversa
    - Retornar `SearchResult[]` com logId, content, date, time, tags, source
    - _Requirements: 6.1, 6.2, 7.2, 8.3, 9.1, 9.2, 9.3_

  - [x] 5.2 Criar `lib/actions/tags.ts` com Server Actions de tags
    - Implementar `createTag(input)`: valida via Zod, verifica auth, checa duplicata case-insensitive, insere em tags
    - Implementar `addTagToLog(input)`: valida, verifica auth + ownership do log, insere em log_tags com onConflictDoNothing
    - Implementar `removeTagFromLog(input)`: valida, verifica auth + ownership, deleta row em log_tags
    - Implementar `deleteTag(input)`: valida, verifica auth + ownership da tag, deleta (cascade)
    - Implementar `getUserTags()`: retorna todas as tags do usuário autenticado
    - Todas retornam `ActionResult` (`{ success: true } | { success: false; error: string }`)
    - _Requirements: 1.1, 1.2, 1.3, 2.3, 4.2, 4.3, 5.3_

  - [x] 5.3 Criar `lib/actions/search.ts` com Server Action de busca
    - Implementar `searchLogs(input)`: valida via `searchLogsSchema`, verifica auth, chama query de busca
    - Retorna `SearchResult[]`
    - _Requirements: 6.1, 7.2, 8.3, 9.1_

  - [ ]* 5.4 Escrever teste de propriedade para busca textual (Property 8)
    - **Property 8: Search returns results matching text from both log content and mood notes**
    - **Validates: Requirements 6.1, 6.2**
    - Para qualquer substring presente em log content ou mood_note, a busca inclui esse registro. Match é case+accent insensitive.
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/db/queries/__tests__/search.test.ts`_

  - [ ]* 5.5 Escrever teste de propriedade para resultados com data/hora (Property 9)
    - **Property 9: Search results include date and time**
    - **Validates: Requirements 6.3**
    - Para qualquer resultado não-vazio, todo item contém date (yyyy-MM-dd) e time (HH:mm) válidos
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/db/queries/__tests__/search.test.ts`_

  - [ ]* 5.6 Escrever teste de propriedade para filtro de tags OR logic (Property 10)
    - **Property 10: Tag filter uses OR logic (any selected tag matches)**
    - **Validates: Requirements 7.2, 9.2**
    - Para qualquer conjunto de tagIds selecionados (≥1), resultados contêm apenas logs com pelo menos uma das tags selecionadas
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/db/queries/__tests__/search.test.ts`_

  - [ ]* 5.7 Escrever teste de propriedade para filtro de semana (Property 11)
    - **Property 11: Week filter restricts results to date range**
    - **Validates: Requirements 8.3**
    - Para qualquer semana selecionada, todos resultados têm date dentro do range de 7 dias [weekStart, weekStart+6]
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/db/queries/__tests__/search.test.ts`_

  - [ ]* 5.8 Escrever teste de propriedade para filtros combinados AND (Property 12)
    - **Property 12: Combined filters apply AND logic between types**
    - **Validates: Requirements 9.1, 8.4**
    - Para qualquer combinação de filtros ativos, todo resultado satisfaz TODOS os filtros simultaneamente
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/db/queries/__tests__/search.test.ts`_

  - [ ]* 5.9 Escrever teste de propriedade para filtros limpos (Property 13)
    - **Property 13: Cleared filters return all logs in reverse chronological order**
    - **Validates: Requirements 9.3**
    - Para qualquer usuário com N logs, filtros limpos retornam todos N em ordem created_at DESC
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/db/queries/__tests__/search.test.ts`_

- [x] 6. Checkpoint — Queries de busca e Server Actions
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Criar componente TagChips (multi-select)
  - [x] 7.1 Criar `components/logs/TagChips.tsx` com semântica multi-select
    - Props: `tags`, `selectedTagIds`, `onToggle`, `size` (sm | md)
    - Container com `role="group"` e `aria-label="Filtrar por tags"`
    - Cada chip como `button` com `aria-pressed={selected}`
    - Toggle semantics: click seleciona/deseleciona
    - Variant `sm` para LogItem, `md` para History Screen
    - _Requirements: 3.1, 3.3, 7.1_

  - [ ]* 7.2 Escrever teste de propriedade para renderização de tag chips (Property 7)
    - **Property 7: Tag chips render for each associated tag**
    - **Validates: Requirements 3.1, 3.2**
    - Para qualquer log com N tags (N≥1), renderiza exatamente N chips. Para N=0, nenhum container renderizado.
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `components/logs/__tests__/TagChips.test.tsx`_

  - [ ]* 7.3 Escrever testes de exemplo para TagChips
    - Renderiza com role="group" e aria-pressed corretos
    - Toggle: click seleciona e deseleciona
    - Variant sm vs md (tamanhos diferentes)
    - Sem tags → nenhum elemento renderizado
    - _Arquivo: `components/logs/__tests__/TagChips.test.tsx`_
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 8. Criar componente TagEditor (inline)
  - [x] 8.1 Criar `components/logs/TagEditor.tsx` para edição inline de tags em logs
    - Props: `logId`, `currentTags`, `allUserTags`, `date`
    - Input de texto com autocomplete (sugere tags existentes por match case-insensitive)
    - Chips das tags atuais com botão "×" para remover associação (chama `removeTagFromLog`)
    - Chips de sugestões clicáveis para adicionar (chama `addTagToLog`)
    - Criação de nova tag quando input não tem match (chama `createTag` + `addTagToLog`)
    - Aparece inline no LogItem ao clicar em "Tags"
    - _Requirements: 1.3, 2.1, 4.1, 4.2, 4.3_

  - [ ]* 8.2 Escrever testes de exemplo para TagEditor
    - Autocomplete sugere tag existente (case-insensitive)
    - Remoção de tag via botão "×"
    - Criação de nova tag ao digitar nome sem match
    - _Arquivo: `components/logs/__tests__/TagEditor.test.tsx`_
    - _Requirements: 1.3, 4.1, 4.2, 4.3_

- [x] 9. Atualizar LogItem para exibir e editar tags
  - [x] 9.1 Atualizar `components/logs/LogItem.tsx` para renderizar TagChips e TagEditor
    - Renderizar `TagChips` (variant `sm`) abaixo do conteúdo quando `log.tags.length > 0`
    - Quando `log.tags.length === 0`: nenhum wrapper extra renderizado (preserva layout original)
    - Botão "Tags" nos actions que faz toggle do `TagEditor` inline
    - Passar `allUserTags` como prop para TagEditor (obtido do parent)
    - _Requirements: 3.1, 3.2, 4.1_

  - [ ]* 9.2 Escrever testes de exemplo para LogItem com tags
    - LogItem sem tags: nenhum wrapper extra renderizado
    - LogItem com tags: chips renderizados com nomes corretos
    - Botão "Tags" faz toggle do TagEditor
    - _Arquivo: `components/logs/__tests__/LogItem.tags.test.tsx`_
    - _Requirements: 3.1, 3.2, 4.1_

- [x] 10. Checkpoint — Componentes de tags e integração com LogItem
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Criar tela de histórico (History Screen)
  - [x] 11.1 Criar `components/history/WeekFilter.tsx` (variante do WeekNavigator)
    - Props: `selectedWeek: Date | null`, `onWeekChange: (week: Date | null) => void`
    - Reusa padrão visual do WeekNavigator (setas prev/next)
    - Estado `null` = "Todas as semanas" (default)
    - Botão "Todas" para limpar seleção de semana
    - Label mostra semana selecionada ou "Todas as semanas"
    - _Requirements: 8.1, 8.2_

  - [x] 11.2 Criar `components/history/TagManager.tsx` (modal de gerenciamento)
    - Props: `tags` (com logCount), `onDelete`
    - Lista todas as tags do usuário com contagem de uso
    - Botão de exclusão por tag → exibe warning inline "Esta tag será removida de X registros. Confirmar?"
    - Confirmação explícita obrigatória (dois cliques: "Excluir" → "Confirmar exclusão")
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 11.3 Criar `components/history/HistoryPage.tsx` (Client Component principal)
    - Props: `userTags`, `initialResults`
    - Gerencia estado dos 3 filtros: `searchText`, `selectedTagIds`, `weekRange`
    - SearchField com debounce de 300ms no texto
    - TagChips (variant `md`) para filtro de tags (OR logic interna)
    - WeekFilter com estado default "Todas as semanas"
    - Chama `searchLogs` action via `useTransition` a cada mudança de filtro
    - ResultList renderiza resultados com data/hora e chips de tags
    - Mensagem neutra "Nada encontrado ainda" quando sem resultados (sem error styling)
    - Botão "Gerenciar tags" que abre TagManager modal
    - _Requirements: 6.1, 6.4, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 9.1, 9.4_

  - [x] 11.4 Criar `app/(app)/history/page.tsx` (Server Component / rota)
    - Server Component que verifica auth, carrega tags do usuário e resultados iniciais (all logs)
    - Renderiza `HistoryPage` com props iniciais
    - _Requirements: 6.1, 7.1, 9.3_

  - [ ]* 11.5 Escrever testes de exemplo para TagManager
    - Warning exibido antes de confirmar deleção
    - Deleção bloqueada sem confirmação explícita
    - Contagem de uso exibida corretamente
    - _Arquivo: `app/(app)/history/__tests__/HistoryPage.test.tsx`_
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 11.6 Escrever testes de exemplo para HistoryPage
    - Estado inicial: all weeks, no tags, empty text → todos os logs exibidos
    - Mensagem neutra quando sem resultados
    - WeekFilter: estado "Todas as semanas" como default
    - Tag filter: seleção e deseleção de chips
    - Debounce no campo de texto
    - _Arquivo: `app/(app)/history/__tests__/HistoryPage.test.tsx`_
    - _Requirements: 6.4, 7.3, 8.2, 9.3, 9.4_

- [ ] 12. Integração final e wiring
  - [-] 12.1 Atualizar `app/(app)/layout.tsx` ou navegação para incluir link ao History Screen
    - Adicionar link/botão para `/history` na navegação principal do app
    - _Requirements: 6.1_

  - [-] 12.2 Atualizar `app/(app)/page.tsx` para passar `allUserTags` ao componente de logs
    - Buscar tags do usuário no Server Component
    - Passar como prop para DailyLogPanel/LogList para uso no TagEditor
    - _Requirements: 2.1, 4.1_

  - [ ] 12.3 Atualizar `components/logs/LogForm.tsx` para permitir adicionar tags ao criar log
    - Adicionar TagEditor simplificado (opcional) no formulário de criação de log
    - Tags são opcionais — form continua salvando sem tags selecionadas
    - _Requirements: 2.1, 2.2_

  - [ ]* 12.4 Escrever testes de integração para fluxo completo
    - Criar tag → associar a log → buscar por tag → encontrar log
    - Deletar tag → logs perdem associação mas não são deletados
    - Busca com acentos: "ação" encontra "Acao" e vice-versa
    - Filtro combinado: texto + tag + semana retorna interseção correta
    - _Arquivo: `lib/db/queries/__tests__/search.test.ts`_
    - _Requirements: 6.2, 7.2, 8.3, 9.1_

- [~] 13. Checkpoint Final — Integração completa
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido.
- Cada tarefa referencia requisitos específicos para rastreabilidade.
- O padrão de Server Actions segue o modelo estabelecido: Zod safeParse → auth check → ownership check → DB operation → revalidatePath.
- A extensão `unaccent` do PostgreSQL é necessária para busca accent-insensitive — requer migration one-time.
- O unique index usa `lower(name)` no banco para garantir unicidade case-insensitive de tags por usuário.
- `onConflictDoNothing` em `addTagToLog` garante idempotência da associação.
- Chips de tags seguem semântica multi-select (role="group" + aria-pressed), diferente do radio-group de TaskChips.
- WeekFilter reutiliza o padrão visual do WeekNavigator existente com estado adicional "Todas as semanas" (null).
- Property tests usam `fast-check` (já no projeto) com mínimo 100 iterações por property.
- Debounce de 300ms no campo de busca para evitar chamadas excessivas ao servidor.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4", "2.1"] },
    { "id": 2, "tasks": ["2.2"] },
    { "id": 3, "tasks": ["3.1", "5.1"] },
    { "id": 4, "tasks": ["3.2", "3.3", "3.4", "3.5", "3.6", "3.7", "5.2", "5.3"] },
    { "id": 5, "tasks": ["5.4", "5.5", "5.6", "5.7", "5.8", "5.9", "7.1"] },
    { "id": 6, "tasks": ["7.2", "7.3", "8.1"] },
    { "id": 7, "tasks": ["8.2", "9.1"] },
    { "id": 8, "tasks": ["9.2", "11.1", "11.2"] },
    { "id": 9, "tasks": ["11.3"] },
    { "id": 10, "tasks": ["11.4", "11.5", "11.6"] },
    { "id": 11, "tasks": ["12.1", "12.2", "12.3"] },
    { "id": 12, "tasks": ["12.4"] }
  ]
}
```
