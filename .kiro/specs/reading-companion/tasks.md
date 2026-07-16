# Implementation Plan: Companheiro de Leitura (Reading Companion)

## Overview

Implementação do **Companheiro de Leitura** — primeiro utilitário do app **semana.** para acompanhamento de leitura sem pressão. O módulo adiciona: livro atual único, registros diários de leitura com mini-calendário semanal, notas rápidas, conclusão de livro com resenha opcional e fila de próximos livros. Utiliza o padrão RSC + Server Actions + `useOptimistic` + Zod + Drizzle ORM com schema aditivo (tabelas `books`, `book_reading_logs`, `book_notes`). Rota `/reading` dentro do grupo `(app)` com proteção de autenticação.

---

## Tasks

- [x] 1. Criar tipos, schemas de validação e schema Drizzle
  - [x] 1.1 Criar `lib/types/reading.ts` com interfaces TypeScript
    - Definir `CurrentBookDisplay` (id, title, author, progress, startedAt)
    - Definir `QueuedBookDisplay` (id, title, author, createdAt)
    - Definir `FinishedBookDisplay` (id, title, author, rating, review, finishedAt)
    - Definir `BookNoteDisplay` (id, content, createdAt)
    - _Requisitos: 1.2, 3.3, 4.4, 5.7_

  - [x] 1.2 Criar `lib/validation/book.schema.ts` com schemas Zod para livros
    - Definir `titleSchema` (string, 1–200 chars, trim não-vazio)
    - Definir `authorSchema` (string max 200, nullable/optional)
    - Definir `progressSchema` (string max 50, nullable/optional)
    - Exportar `addBookSchema` (title + author)
    - Exportar `updateProgressSchema` (bookId uuid + progress)
    - Exportar `finishBookSchema` (bookId uuid + rating int 1–5 nullable/optional + review max 2000 nullable/optional)
    - Exportar `startReadingSchema` (bookId uuid)
    - Exportar `removeBookSchema` (bookId uuid)
    - _Requisitos: 1.4, 4.1, 5.1, 6.1_

  - [x] 1.3 Criar `lib/validation/readingLog.schema.ts` com schema Zod para registros
    - Definir `dateSchema` (string regex yyyy-MM-dd)
    - Exportar `toggleReadingDaySchema` (bookId uuid + date)
    - _Requisitos: 2.1, 2.4_

  - [x] 1.4 Criar `lib/validation/bookNote.schema.ts` com schema Zod para notas
    - Definir `contentSchema` (string 1–1000 chars, trim não-vazio)
    - Exportar `createBookNoteSchema` (bookId uuid + content)
    - Exportar `deleteBookNoteSchema` (noteId uuid)
    - _Requisitos: 3.1, 3.5_

  - [x] 1.5 Atualizar `drizzle/schema.ts` com novas tabelas e relações
    - Adicionar tabela `books` (id uuid PK, userId FK cascade, title, author nullable, status text default "queued", progress nullable, rating nullable, review nullable, startedAt, finishedAt, createdAt)
    - Adicionar tabela `bookReadingLogs` (id uuid PK, bookId FK cascade, date, createdAt) com unique index em (bookId, date)
    - Adicionar tabela `bookNotes` (id uuid PK, bookId FK cascade, content, createdAt)
    - Adicionar relações Drizzle: `booksRelations`, `bookReadingLogsRelations`, `bookNotesRelations`
    - NÃO alterar tabelas existentes (schema aditivo)
    - _Requisitos: 7.4_

  - [ ]* 1.6 Escrever testes de propriedade para validação de inputs (Property 10)
    - **Property 10: Input validation round-trip**
    - **Valida: Requisitos 1.4, 3.1, 5.1**
    - Para qualquer título 1–200 chars não-whitespace-only, `addBookSchema` aceita
    - Para qualquer string vazia, whitespace-only ou >200 chars, `addBookSchema` rejeita
    - Para qualquer conteúdo de nota 1–1000 chars não-whitespace-only, `createBookNoteSchema` aceita
    - Para qualquer conteúdo inválido, `createBookNoteSchema` rejeita
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/validation/__tests__/book.schema.test.ts` e `lib/validation/__tests__/bookNote.schema.test.ts`_

- [x] 2. Checkpoint — Schema e validação
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Criar queries de banco de dados
  - [x] 3.1 Criar `lib/db/queries/books.ts` com queries para livros
    - Implementar `getCurrentBook(userId): Promise<CurrentBookDisplay | null>` — SELECT WHERE userId AND status = "reading"
    - Implementar `getQueuedBooks(userId): Promise<QueuedBookDisplay[]>` — SELECT WHERE userId AND status = "queued" ORDER BY createdAt ASC
    - Implementar `getFinishedBooks(userId): Promise<FinishedBookDisplay[]>` — SELECT WHERE userId AND status = "finished" ORDER BY finishedAt DESC
    - Implementar `insertBook(input: { userId, title, author?, status }): Promise<Book>`
    - Implementar `updateBookStatus(bookId, status, extras?: { startedAt?, finishedAt?, rating?, review? }): Promise<void>`
    - Implementar `updateBookProgress(bookId, progress): Promise<void>`
    - Implementar `deleteBook(bookId): Promise<void>`
    - Implementar `getBookOwner(bookId): Promise<{ userId: string } | undefined>`
    - _Requisitos: 1.1, 1.2, 4.4, 5.7, 7.2_

  - [x] 3.2 Criar `lib/db/queries/readingLogs.ts` com queries para registros de leitura
    - Implementar `getWeekReadingDays(bookId, weekStart): Promise<string[]>` — retorna datas yyyy-MM-dd com registro na semana
    - Implementar `hasReadingLog(bookId, date): Promise<boolean>` — verifica se existe registro para a data
    - Implementar `insertReadingLog(bookId, date): Promise<void>` — INSERT com unique constraint
    - Implementar `deleteReadingLog(bookId, date): Promise<void>` — DELETE matching bookId + date
    - Implementar `countReadingLogs(bookId): Promise<number>` — total de registros do livro
    - _Requisitos: 2.3, 2.5, 4.5_

  - [x] 3.3 Criar `lib/db/queries/bookNotes.ts` com queries para notas
    - Implementar `getBookNotes(bookId): Promise<BookNoteDisplay[]>` — SELECT ORDER BY createdAt DESC
    - Implementar `insertBookNote(bookId, content): Promise<BookNote>`
    - Implementar `deleteBookNote(noteId): Promise<void>`
    - Implementar `getNoteOwner(noteId): Promise<{ userId: string } | undefined>` — join com books para obter userId
    - Implementar `countBookNotes(bookId): Promise<number>` — total de notas do livro
    - _Requisitos: 3.1, 3.3, 3.5, 4.5_

  - [ ]* 3.4 Escrever testes de propriedade para ordenação (Property 8)
    - **Property 8: Ordering invariants**
    - **Valida: Requisitos 3.3, 4.4, 5.7**
    - Para qualquer conjunto de notas, `getBookNotes` retorna em ordem cronológica reversa (createdAt DESC)
    - Para qualquer conjunto de livros concluídos, `getFinishedBooks` retorna em ordem cronológica reversa (finishedAt DESC)
    - Para qualquer conjunto de livros na fila, `getQueuedBooks` retorna em ordem cronológica (createdAt ASC)
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/db/queries/__tests__/books.test.ts` e `lib/db/queries/__tests__/bookNotes.test.ts`_

  - [ ]* 3.5 Escrever testes de propriedade para unicidade de registro (Property 3)
    - **Property 3: At most one reading log per day per book**
    - **Valida: Requisitos 2.5**
    - Para qualquer bookId e date, independentemente do número de operações de insert, o count de registros para (bookId, date) nunca excede 1
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/db/queries/__tests__/readingLogs.test.ts`_

- [x] 4. Checkpoint — Queries de banco
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Criar Server Actions
  - [x] 5.1 Criar `lib/actions/books.ts` com Server Actions para livros
    - `addBookToQueue(input)`: valida via `addBookSchema`, verifica auth, insere com status "queued", revalidatePath("/reading")
    - `addBookAsCurrent(input)`: valida, verifica auth, se já existe livro atual → muda status do atual para "queued", insere novo com status "reading" + startedAt, revalidatePath("/reading")
    - `startReadingFromQueue(input)`: valida via `startReadingSchema`, verifica ownership, se já existe livro atual → muda status do atual para "queued", muda target para "reading" + startedAt, revalidatePath("/reading")
    - `updateBookProgress(input)`: valida via `updateProgressSchema`, verifica ownership + status "reading", atualiza progress, revalidatePath("/reading")
    - `finishCurrentBook(input)`: valida via `finishBookSchema`, verifica ownership + status "reading", atualiza para "finished" + finishedAt + rating/review opcionais, revalidatePath("/reading")
    - `removeBookFromQueue(input)`: valida via `removeBookSchema`, verifica ownership + status "queued", deleta livro, revalidatePath("/reading")
    - Todas retornam `ActionResult` (`{ success: true } | { success: false; error: string }`)
    - _Requisitos: 1.1, 4.2, 4.3, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 7.2, 7.3_

  - [x] 5.2 Criar `lib/actions/readingLogs.ts` com Server Action para toggle de leitura
    - `toggleReadingDay(input)`: valida via `toggleReadingDaySchema`, verifica auth, verifica se bookId pertence ao user E status "reading", se registro existe → deleta, se não existe → insere, revalidatePath("/reading")
    - Rejeita se não há livro atual com mensagem "Selecione ou adicione um livro antes de registrar leitura"
    - _Requisitos: 2.1, 2.2, 2.4, 2.5, 2.6, 7.2_

  - [x] 5.3 Criar `lib/actions/bookNotes.ts` com Server Actions para notas
    - `createBookNote(input)`: valida via `createBookNoteSchema`, verifica auth, verifica ownership do bookId + status "reading", insere nota com createdAt automático, revalidatePath("/reading")
    - `deleteBookNote(input)`: valida via `deleteBookNoteSchema`, verifica auth, verifica ownership da nota via `getNoteOwner`, deleta nota, revalidatePath("/reading")
    - Rejeita criação sem livro atual com mensagem "Selecione ou adicione um livro para criar notas"
    - _Requisitos: 3.1, 3.2, 3.4, 3.5, 7.2, 7.3_

  - [ ]* 5.4 Escrever testes de propriedade para unicidade de livro atual (Property 1)
    - **Property 1: At most one current book per user**
    - **Valida: Requisitos 1.1**
    - Para qualquer sequência de operações (addBookAsCurrent, startReadingFromQueue, finishCurrentBook), o count de livros com status "reading" para o user nunca excede 1
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/actions/__tests__/books.test.ts`_

  - [ ]* 5.5 Escrever testes de propriedade para toggle round-trip (Property 2)
    - **Property 2: Toggle reading day round-trip**
    - **Valida: Requisitos 2.2, 2.4**
    - Para qualquer bookId válido com status "reading" e qualquer data válida, toggle duas vezes retorna ao estado original
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/actions/__tests__/readingLogs.test.ts`_

  - [ ]* 5.6 Escrever testes de propriedade para finish (Properties 4, 5)
    - **Property 4: Finish book releases the current slot**
    - **Valida: Requisitos 4.2, 4.3**
    - Para qualquer combinação de rating (null ou 1–5) e review (null ou string ≤2000), finish resulta em status "finished", finishedAt non-null e current book = null
    - **Property 5: Finish preserves associated data**
    - **Valida: Requisitos 4.5**
    - Para qualquer livro com N logs e M notas, após finish, counts permanecem N e M
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/actions/__tests__/books.test.ts`_

  - [ ]* 5.7 Escrever testes de propriedade para promoção e swap (Properties 6, 7)
    - **Property 6: Promote to current when slot is free**
    - **Valida: Requisitos 5.3, 6.1**
    - Para qualquer livro "queued" e user sem livro atual, startReading resulta em status "reading", startedAt non-null e livro fora da fila
    - **Property 7: Swap demotes current and promotes new**
    - **Valida: Requisitos 5.5, 6.3**
    - Para qualquer user com livro A "reading" e livro B "queued", swap resulta em A "queued", B "reading", notas/logs de A intactos e exatamente 1 livro "reading"
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/actions/__tests__/books.test.ts`_

  - [ ]* 5.8 Escrever testes de propriedade para isolamento e campos opcionais (Properties 9, 11)
    - **Property 9: User data isolation**
    - **Valida: Requisitos 7.2, 7.3**
    - Para quaisquer dois users distintos, queries e mutações de user A nunca retornam ou afetam dados de user B
    - **Property 11: Optional fields never block primary actions**
    - **Valida: Requisitos 1.5, 4.3**
    - Para qualquer livro "reading" com progress = null, toggleReadingDay, createBookNote e finishCurrentBook devem ter sucesso
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/actions/__tests__/books.test.ts`_

- [x] 6. Checkpoint — Server Actions
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implementar componentes de UI — Livro Atual e Registros
  - [x] 7.1 Criar `app/(app)/reading/page.tsx` (Server Component)
    - Importar `getCurrentUserId()` para autenticação
    - Buscar livro atual via `getCurrentBook(userId)`
    - Buscar registros da semana via `getWeekReadingDays(bookId, weekStart)`
    - Buscar notas via `getBookNotes(bookId)`
    - Buscar livros concluídos via `getFinishedBooks(userId)`
    - Buscar fila via `getQueuedBooks(userId)`
    - Renderizar `ReadingCompanion` passando todos os dados
    - _Requisitos: 7.1_

  - [x] 7.2 Criar `components/reading/ReadingCompanion.tsx` (Client Component container)
    - Aceitar props: `currentBook`, `weekReadingDays`, `notes`, `finishedBooks`, `queue`
    - Renderizar `CurrentBookCard`, `ReadingButton`, `MiniWeekCalendar`, `NoteForm`, `NotesList`, `FinishBookModal`, `BookQueueList`, `AddBookModal`
    - Gerenciar estados de modais (finish, add book)
    - Estado vazio quando `currentBook === null`: convite para escolher/adicionar livro
    - _Requisitos: 1.2, 1.3_

  - [x] 7.3 Criar `components/reading/CurrentBookCard.tsx`
    - Exibir título, autor e Campo_de_Progresso do livro atual
    - Input editável para progress (maxLength 50, optional)
    - Atualização de progress via `updateBookProgress` com `useTransition`
    - Botão "Concluí o livro" abre `FinishBookModal`
    - _Requisitos: 1.2, 1.4, 1.5_

  - [x] 7.4 Criar `components/reading/ReadingButton.tsx`
    - Se `todayMarked === false`: botão "Marquei que li hoje" → chama `toggleReadingDay` com data de hoje
    - Se `todayMarked === true`: botão "✓ Lido hoje" → permite desmarcar
    - `useOptimistic` + `useTransition` para feedback imediato
    - Desabilitado se não há livro atual (com mensagem orientativa)
    - _Requisitos: 2.1, 2.2, 2.6_

  - [x] 7.5 Criar `components/reading/MiniWeekCalendar.tsx`
    - Exibir 7 células (Seg–Dom) com indicação visual de dias com registro
    - Click em dia passado: toggle registro retroativo via `toggleReadingDay`
    - Dia futuro: desabilitado
    - Dia corrente: usa estado do `ReadingButton`
    - `useOptimistic` para feedback imediato ao clicar
    - _Requisitos: 2.3, 2.4_

- [x] 8. Implementar componentes de UI — Notas e Conclusão
  - [x] 8.1 Criar `components/reading/NoteForm.tsx`
    - Textarea com maxLength 1000, placeholder "Anote um pensamento solto..."
    - Botão "Salvar nota" chama `createBookNote` com `useTransition`
    - Limpa textarea após submit bem-sucedido
    - Desabilitado se não há livro atual
    - _Requisitos: 3.1, 3.4_

  - [x] 8.2 Criar `components/reading/NotesList.tsx`
    - Lista de notas em ordem cronológica reversa (mais recente primeiro, já retornada pela query)
    - Cada nota exibe conteúdo + data formatada
    - Botão "Excluir" por nota com confirmação antes de remover
    - `useOptimistic` para remoção imediata + rollback em erro
    - _Requisitos: 3.3, 3.5_

  - [x] 8.3 Criar `components/reading/FinishBookModal.tsx`
    - Campo Avaliação: seletor de nota 1–5 (opcional, pode ficar null)
    - Campo Resenha: textarea max 2000 chars (opcional)
    - Botão "Concluir" SEMPRE habilitado (campos opcionais nunca bloqueiam)
    - Chama `finishCurrentBook` ao confirmar
    - Fecha modal e retorna à tela no estado vazio após sucesso
    - _Requisitos: 4.1, 4.2, 4.3, 4.6_

- [x] 9. Implementar componentes de UI — Fila e Adição de Livros
  - [x] 9.1 Criar `components/reading/BookQueueList.tsx`
    - Exibir livros na fila em ordem de adição (mais antigo primeiro, já retornada pela query)
    - Cada item: título + autor (quando informado)
    - Botão "Começar a ler": se `hasCurrentBook === false` → promove diretamente via `startReadingFromQueue`; se `hasCurrentBook === true` → solicita confirmação de substituição informando que livro atual volta à fila
    - Botão "Remover" com confirmação antes de excluir via `removeBookFromQueue`
    - `useOptimistic` para feedback imediato
    - NÃO exibir métricas de "tempo na fila" ou indicadores de pressão
    - _Requisitos: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [x] 9.2 Criar `components/reading/AddBookModal.tsx`
    - Prop `mode`: "current" | "queue"
    - Campo título (obrigatório, 1–200 chars)
    - Campo autor (opcional, max 200 chars)
    - Se mode === "current" e `hasCurrentBook`: solicitar confirmação de substituição
    - Chama `addBookAsCurrent` ou `addBookToQueue` conforme mode
    - Fecha modal após sucesso
    - _Requisitos: 5.1, 6.1, 6.2, 6.3_

  - [x] 9.3 Criar `components/reading/FinishedBooksList.tsx`
    - Exibir lista de livros concluídos em ordem cronológica reversa (conclusão mais recente primeiro)
    - Cada item: título, autor, resenha (quando existente)
    - _Requisitos: 4.4_

- [x] 10. Checkpoint — UI completa
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Integração e wiring final
  - [x] 11.1 Atualizar `app/(app)/layout.tsx` para incluir link de navegação para `/reading`
    - Adicionar item de navegação "Leitura" que aponta para `/reading`
    - _Requisitos: 7.1_

  - [x] 11.2 Gerar migration Drizzle para as novas tabelas
    - Executar `npx drizzle-kit generate` para gerar SQL de migration
    - Verificar que a migration é puramente aditiva (CREATE TABLE apenas)
    - _Requisitos: 7.4_

  - [ ]* 11.3 Escrever testes de integração para fluxo completo
    - Fluxo: adicionar livro → marcar leituras → criar notas → concluir → verificar dados preservados
    - Swap completo: livro A atual → começar livro B da fila → verificar A voltou para fila com dados intactos
    - Isolamento de dados entre usuários
    - _Arquivo: `app/(app)/reading/__tests__/page.test.tsx`_
    - _Requisitos: 4.5, 5.5, 7.2_

- [x] 12. Checkpoint Final — Integração completa
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido.
- Cada tarefa referencia requisitos específicos para rastreabilidade.
- O schema é inteiramente aditivo: tabelas `books`, `book_reading_logs`, `book_notes` são novas, sem alterar tabelas existentes.
- O campo `status` na tabela `books` controla o ciclo de vida: `queued` → `reading` → `finished`.
- A unicidade de livro atual por usuário é enforced via Server Actions (não via constraint de banco, pois envolve lógica de swap).
- A unique constraint em `(bookId, date)` em `book_reading_logs` garante no máximo 1 registro por dia por livro.
- Campos opcionais (progress, rating, review, author) NUNCA bloqueiam ações primárias — princípio ZERO pressão.
- Property tests usam `fast-check` (já instalado no projeto) com mínimo 100 iterações por property.
- Contadores e calendário NUNCA exibem linguagem negativa ou de cobrança.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4"] },
    { "id": 1, "tasks": ["1.5", "1.6"] },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3"] },
    { "id": 3, "tasks": ["3.4", "3.5"] },
    { "id": 4, "tasks": ["5.1", "5.2", "5.3"] },
    { "id": 5, "tasks": ["5.4", "5.5", "5.6", "5.7", "5.8"] },
    { "id": 6, "tasks": ["7.1"] },
    { "id": 7, "tasks": ["7.2", "7.3", "7.4", "7.5"] },
    { "id": 8, "tasks": ["8.1", "8.2", "8.3"] },
    { "id": 9, "tasks": ["9.1", "9.2", "9.3"] },
    { "id": 10, "tasks": ["11.1", "11.2", "11.3"] }
  ]
}
```
