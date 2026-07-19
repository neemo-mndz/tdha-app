# Implementation Plan: Perfil do Usuário e Exportação de Relatório

## Overview

Implementação do módulo de **Perfil do Usuário** e **Exportação de Relatório Semanal** para o app **semana.** O perfil permite gerenciar dados pessoais (nome, avatar, data de nascimento, senha) de forma opcional e não intrusiva. A exportação gera relatórios semanais em PDF ou XLS para compartilhamento com psicólogo. Utiliza o padrão RSC + Server Actions + `useTransition` + Zod + Drizzle ORM. Geração de PDF via `jsPDF` e XLS via `exceljs`, ambos client-side. Rota `/profile` dentro do grupo `(app)` com proteção de autenticação.

---

## Tasks

- [x] 1. Criar tipos, schemas de validação e atualizar schema Drizzle
  - [x] 1.1 Criar `lib/types/profile.ts` e `lib/types/report.ts` com interfaces TypeScript
    - Definir `UserProfile` (id, email, name, avatarUrl, birthDate, createdAt)
    - Definir `ActionResult` type se não existir (`{ success: true } | { success: false; error: string }`)
    - Definir `WeekReportData` (userName, dateRange, days)
    - Definir `ReportDay` (date, logs, taskProgress, readingActivity)
    - Definir `ReportLog` (content, createdAt)
    - Definir `ReportTask` (name, goal, done)
    - Definir `ReportReading` (bookTitle, date)
    - _Requirements: 1.2, 7.2, 8.2, 9.1, 9.2, 9.3_

  - [x] 1.2 Criar `lib/validation/profile.schema.ts` com schemas Zod
    - Exportar `updateNameSchema` (string, trim, min 2, max 100 com mensagens pt-BR)
    - Exportar `updateAvatarSchema` (string startsWith "data:image/", max 500_000)
    - Exportar `updateBirthDateSchema` (string regex yyyy-MM-dd, refine data válida, refine idade [13, 120] via `differenceInYears`)
    - Exportar `changePasswordSchema` (currentPassword min 1, newPassword min 8 max 128)
    - Exportar `getWeekReportSchema` (array de strings regex yyyy-MM-dd, min 1, max 7)
    - _Requirements: 2.4, 2.5, 2.6, 3.2, 3.3, 3.4, 4.2, 4.3, 4.4, 5.4, 5.5, 5.6, 6.4, 6.5_

  - [x] 1.3 Atualizar `drizzle/schema.ts` adicionando campos ao users
    - Adicionar campo `name` (text, nullable) à tabela `users`
    - Adicionar campo `avatarUrl` (text, nullable) à tabela `users`
    - Adicionar campo `birthDate` (date, nullable) à tabela `users`
    - _Requirements: 1.2, 2.3, 3.1, 4.1_

  - [ ]* 1.4 Escrever testes de propriedade para validação de nome (Property 4)
    - **Property 4: Name validation after trim**
    - **Validates: Requirements 3.2, 3.3, 3.4**
    - Para qualquer string, `updateNameSchema` aceita se e somente se o trim resulta em length ∈ [2, 100]
    - Strings vazias, whitespace-only, ou com trim length < 2 ou > 100 devem ser rejeitadas
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/validation/__tests__/profile.schema.test.ts`_

  - [ ]* 1.5 Escrever testes de propriedade para validação de data de nascimento (Property 5)
    - **Property 5: Birth date age validation**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
    - Para qualquer data válida yyyy-MM-dd, aceita se `differenceInYears(today, date)` ∈ [13, 120]
    - Datas fora do range ou com formato inválido devem ser rejeitadas
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/validation/__tests__/profile.schema.test.ts`_

  - [ ]* 1.6 Escrever testes de propriedade para validação de senha (Property 7)
    - **Property 7: Password length validation**
    - **Validates: Requirements 5.4, 5.5, 5.6**
    - Para qualquer string, `changePasswordSchema.newPassword` aceita se e somente se length ∈ [8, 128]
    - Strings mais curtas que 8 ou mais longas que 128 devem ser rejeitadas
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/validation/__tests__/profile.schema.test.ts`_

  - [ ]* 1.7 Escrever testes de propriedade para validação de avatar (Property 2)
    - **Property 2: Avatar file validation**
    - **Validates: Requirements 2.4, 2.5, 2.6**
    - Para qualquer MIME type e byte size, aceita se MIME ∈ {image/jpeg, image/png, image/webp} E size ≤ 2MB
    - Todos outros devem ser rejeitados com mensagem apropriada
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/validation/__tests__/profile.schema.test.ts`_

- [x] 2. Checkpoint — Schema e validação
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Criar utilitários de perfil e relatório
  - [x] 3.1 Criar `lib/utils/initials.ts` com função de extração de iniciais
    - Implementar `getInitials(name: string | null, email: string): string`
    - Se name tem 2+ palavras: primeira letra da primeira palavra + primeira letra da última palavra
    - Se name é uma única palavra: primeira letra do nome
    - Se name é null/empty: primeira letra do email
    - Retorna em maiúsculas
    - _Requirements: 2.7_

  - [x] 3.2 Criar `lib/utils/image.ts` com função de cálculo de dimensões de crop
    - Implementar `calculateCropDimensions(width: number, height: number): { sx, sy, sWidth, sHeight }` — função pura que calcula o quadrado central de uma imagem
    - A lógica de Canvas API ficará no componente client, mas o cálculo de dimensões é testável isoladamente
    - _Requirements: 2.2_

  - [x] 3.3 Criar `lib/report/formatters.ts` com funções de formatação
    - Implementar `generateFilename(userName: string | null, startDate: string, endDate: string, ext: "pdf" | "xlsx"): string`
    - Formato: `semana_[slug]_[DD-MM-YYYY]_[DD-MM-YYYY].[ext]`
    - Slug: nome lowercase com espaços substituídos por hífens, ou "usuario" se null/vazio
    - _Requirements: 7.5, 8.5_

  - [ ]* 3.4 Escrever testes de propriedade para extração de iniciais (Property 3)
    - **Property 3: Initials extraction**
    - **Validates: Requirements 2.7**
    - Para qualquer combinação de name e email, a função produz o resultado correto conforme regras
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/utils/__tests__/initials.test.ts`_

  - [ ]* 3.5 Escrever testes de propriedade para resize de imagem (Property 1)
    - **Property 1: Image resize always produces 256x256 square**
    - **Validates: Requirements 2.2**
    - Para qualquer width e height ≥ 1px, `calculateCropDimensions` produz um quadrado centralizado válido
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/utils/__tests__/image.test.ts`_

  - [ ]* 3.6 Escrever testes de propriedade para formato de filename (Property 9)
    - **Property 9: Report filename format**
    - **Validates: Requirements 7.5, 8.5**
    - Para qualquer nome e datas válidas, o filename segue o padrão `semana_[slug]_[DD-MM-YYYY]_[DD-MM-YYYY].[ext]`
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/report/__tests__/formatters.test.ts`_

- [x] 4. Checkpoint — Utilitários
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Criar queries de banco de dados
  - [x] 5.1 Criar `lib/db/queries/profile.ts` com queries para perfil
    - Implementar `getUserProfile(userId): Promise<UserProfile | null>`
    - Implementar `updateUserName(userId, name): Promise<void>`
    - Implementar `updateUserAvatar(userId, avatarUrl): Promise<void>`
    - Implementar `updateUserBirthDate(userId, birthDate): Promise<void>`
    - Implementar `updateUserPasswordHash(userId, hash): Promise<void>`
    - Implementar `getUserPasswordHash(userId): Promise<string | null>`
    - _Requirements: 1.2, 2.3, 3.1, 4.1, 5.1, 10.1_

  - [x] 5.2 Criar `lib/db/queries/report.ts` com queries para relatório
    - Implementar `getReportLogs(userId, dates): Promise<Array<{ date, content, createdAt }>>` — logs ordenados por createdAt ASC
    - Implementar `getReportTaskProgress(userId, weekStart): Promise<Array<{ name, goal, done }>>`
    - Implementar `getReportReadingActivity(userId, dates): Promise<Array<{ date, bookTitle }>>`
    - Implementar `getDaysWithLogs(userId, weekStart): Promise<string[]>` — datas com pelo menos 1 log na semana
    - _Requirements: 6.1, 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2_

  - [ ]* 5.3 Escrever testes de propriedade para dados de relatório (Property 10)
    - **Property 10: Report data retrieval returns correct data for selected days**
    - **Validates: Requirements 9.1, 9.2, 9.3, 10.1, 10.2**
    - Para qualquer conjunto de datas selecionadas, os dados retornados contêm apenas dados do usuário correto e das datas corretas
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/db/queries/__tests__/report.test.ts`_

  - [ ]* 5.4 Escrever testes de propriedade para ordenação de dados (Property 11)
    - **Property 11: Report data chronological ordering**
    - **Validates: Requirements 9.4, 9.5**
    - Para qualquer conjunto de logs com múltiplos dias, dias são ordenados do mais antigo ao mais recente, e logs dentro de cada dia são ordenados por timestamp ascendente
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/db/queries/__tests__/report.test.ts`_

- [x] 6. Checkpoint — Queries de banco
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Criar Server Actions
  - [x] 7.1 Criar `lib/actions/profile.ts` com Server Actions para perfil
    - `updateName(input)`: valida via `updateNameSchema`, verifica auth, atualiza nome, revalidatePath("/profile")
    - `updateAvatar(input)`: valida via `updateAvatarSchema`, verifica auth, atualiza avatarUrl, revalidatePath("/profile")
    - `updateBirthDate(input)`: valida via `updateBirthDateSchema`, verifica auth, atualiza birthDate, revalidatePath("/profile")
    - `changePassword(input)`: valida via `changePasswordSchema`, verifica auth, verifica senha atual (bcrypt compare), hash nova senha, atualiza hash, revalidatePath("/profile")
    - Todas retornam `ActionResult`
    - _Requirements: 2.3, 2.8, 3.1, 3.5, 4.1, 5.1, 5.2, 5.9, 10.1, 10.3_

  - [x] 7.2 Criar `lib/actions/report.ts` com Server Action para dados do relatório
    - `getWeekReportData(input)`: valida via `getWeekReportSchema`, verifica auth, busca logs + tasks + reading para as datas, retorna `WeekReportData`
    - _Requirements: 6.5, 9.1, 9.2, 9.3, 9.6, 9.7, 10.2_

  - [ ]* 7.3 Escrever testes de propriedade para password round-trip (Property 6)
    - **Property 6: Password change round-trip**
    - **Validates: Requirements 5.1**
    - Para qualquer senha válida [8-128 chars], após change, `verifyPassword(newPassword, storedHash)` retorna true e `verifyPassword(oldPassword, storedHash)` retorna false
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/actions/__tests__/profile.test.ts`_

- [x] 8. Checkpoint — Server Actions
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implementar componentes de UI — Página de Perfil
  - [x] 9.1 Criar `app/(app)/profile/page.tsx` (Server Component)
    - Importar `getCurrentUserId()` para autenticação, redirect para `/login` se não autenticado
    - Buscar perfil via `getUserProfile(userId)`
    - Buscar `daysWithLogs` para a semana atual via `getDaysWithLogs(userId, weekStart)`
    - Renderizar `ProfilePage` passando dados do usuário e daysWithLogs
    - _Requirements: 1.1, 1.3, 10.1, 10.3_

  - [x] 9.2 Criar `components/profile/ProfilePage.tsx` (Client Component container)
    - Aceitar props: `user: UserProfile`, `daysWithLogs: string[]`
    - Renderizar seções: AvatarUploader, NameForm, BirthDateForm, PasswordForm, seção de exportação (DaySelector + ReportActions)
    - Exibir email (read-only) e data de criação da conta
    - Link para voltar à home
    - Nenhum banner ou modal obrigando preenchimento de perfil
    - _Requirements: 1.2, 1.4, 1.5_

  - [x] 9.3 Criar `components/profile/AvatarUploader.tsx` (Client Component)
    - Click na área abre `<input type="file" accept="image/jpeg,image/png,image/webp">`
    - Validação client-side: tipo MIME e tamanho ≤ 2MB
    - Canvas API: crop quadrado central + resize 256x256 + export JPEG quality 0.85
    - Chama `updateAvatar(dataUrl)` via `useTransition`
    - Loading indicator durante processamento
    - Placeholder com iniciais via `getInitials()` quando sem avatar
    - Mensagens de erro inline
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

  - [x] 9.4 Criar `components/profile/NameForm.tsx` (Client Component)
    - Input controlado com `defaultValue` do nome atual
    - Submit via Enter ou botão "Salvar"
    - Validação client-side: trim + length [2, 100]
    - Chama `updateName(name)` via `useTransition`
    - Erro inline ou sucesso silencioso
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 9.5 Criar `components/profile/BirthDateForm.tsx` (Client Component)
    - Input type="date" com valor atual
    - Exibe idade calculada ao lado: "{X} anos"
    - Validação: idade ∈ [13, 120] via `differenceInYears`
    - Chama `updateBirthDate(date)` via `useTransition`
    - Erro inline se idade fora do range
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 9.6 Criar `components/profile/PasswordForm.tsx` (Client Component)
    - Campos: senha atual, nova senha, confirmação
    - Validação client-side: nova senha [8, 128], confirmação === nova senha
    - Chama `changePassword({ currentPassword, newPassword })` via `useTransition`
    - Sucesso: mensagem "Senha alterada com sucesso" que desaparece após 5s, limpa campos
    - Erro: mensagem inline específica
    - Loading state: botão desabilitado + indicator
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

- [x] 10. Checkpoint — UI de Perfil
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implementar componentes de UI — Exportação de Relatório
  - [x] 11.1 Criar `components/profile/DaySelector.tsx` (Client Component)
    - Exibir 7 dias (seg-dom) com labels pt-BR e indicador visual para dias com dados
    - Checkbox por dia, pré-seleciona dias com logs
    - Navegação por semanas anteriores via setas (weekOffset)
    - Validação: mínimo 1 dia selecionado
    - Estado local sem server round-trip ao marcar/desmarcar
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 11.2 Criar `lib/report/pdf.ts` com geração de PDF via jsPDF
    - Instalar dependência `jspdf`
    - Implementar `generatePdfReport(data: WeekReportData): Blob`
    - Layout A4, fonte legível, agrupado por dia com headers
    - Conteúdo: nome do usuário, range de datas, logs com timestamps "HH:mm", task progress "nome: done/goal", reading activity
    - Mensagem "Nenhum registro encontrado para o período selecionado" se todos os dias vazios
    - Mensagem "Sem registros neste dia" para dias individuais sem dados
    - Todo texto em pt-BR
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6, 7.8_

  - [x] 11.3 Criar `lib/report/xls.ts` com geração de XLS via exceljs
    - Instalar dependência `exceljs`
    - Implementar `generateXlsReport(data: WeekReportData): Promise<Blob>`
    - 3 sheets: "Registros", "Tarefas", "Leitura"
    - Header row com nome do usuário e range de datas em cada sheet
    - Dados apenas dos dias selecionados
    - Mensagem "Nenhum registro encontrado para o período selecionado" se vazio
    - Todo texto em pt-BR
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6_

  - [x] 11.4 Criar `components/profile/ReportActions.tsx` (Client Component)
    - Botões "Exportar PDF" e "Exportar Planilha"
    - Ao clicar: chama `getWeekReportData(selectedDays)` → gera arquivo local → dispara download com filename formatado
    - Loading state durante busca + geração
    - Erro inline se falhar: "Erro ao gerar PDF. Tente novamente." ou "Erro ao gerar planilha. Tente novamente."
    - Botões desabilitados se nenhum dia selecionado
    - _Requirements: 6.5, 7.1, 7.5, 7.7, 8.1, 8.5, 8.7_

  - [ ]* 11.5 Escrever testes de propriedade para DaySelector (Property 8)
    - **Property 8: Day selector initialization matches days with data**
    - **Validates: Requirements 6.1, 6.3**
    - Para qualquer subconjunto de datas com logs, o estado inicial de `selectedDays` deve ser exatamente esse subconjunto
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `components/profile/__tests__/DaySelector.test.tsx`_

  - [ ]* 11.6 Escrever testes de propriedade para estrutura XLS (Property 12)
    - **Property 12: XLS report structure**
    - **Validates: Requirements 8.2, 8.3**
    - Para qualquer WeekReportData com pelo menos 1 dia com dados, o workbook gerado contém exatamente 3 sheets: "Registros", "Tarefas", "Leitura" com headers corretos
    - Usar `fast-check` com mínimo 100 iterações
    - _Arquivo: `lib/report/__tests__/xls.test.ts`_

- [x] 12. Checkpoint — Exportação completa
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Integração e wiring final
  - [x] 13.1 Atualizar header do app para incluir link de perfil
    - Adicionar avatar/ícone de pessoa no header que linka para `/profile`
    - Se usuário tem avatar, exibir avatar mini; senão, ícone genérico de pessoa
    - _Requirements: 1.1_

  - [x] 13.2 Gerar migration Drizzle para os novos campos
    - Executar `npx drizzle-kit generate` para gerar SQL: `ALTER TABLE users ADD COLUMN name TEXT, ADD COLUMN avatar_url TEXT, ADD COLUMN birth_date DATE;`
    - Verificar que a migration é puramente aditiva (ALTER TABLE ADD COLUMN apenas)
    - _Requirements: 1.2_

  - [ ]* 13.3 Escrever testes de integração para fluxos completos
    - Fluxo perfil: atualizar nome → verificar no banco → verificar reflexo no RSC
    - Fluxo senha: alterar senha → verificar hash atualizado
    - Fluxo relatório: buscar dados com múltiplos dias → verificar completude e ordem
    - Isolamento: queries filtram por userId corretamente
    - _Arquivo: `app/(app)/profile/__tests__/page.test.tsx`_
    - _Requirements: 3.1, 5.1, 9.1, 10.1, 10.2_

- [x] 14. Checkpoint Final — Integração completa
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido.
- Cada tarefa referencia requisitos específicos para rastreabilidade.
- Os novos campos na tabela `users` são todos nullable — migration puramente aditiva sem quebrar dados existentes.
- Avatar armazenado como base64 data URL (≤ ~100KB post-resize) no campo `avatar_url` — evita storage externo.
- Resize/crop via Canvas API nativa no client (256x256 JPEG quality 0.85).
- PDF gerado client-side via `jsPDF`, XLS via `exceljs` — sem server-side rendering de documentos.
- Campos de perfil são 100% opcionais — nenhuma funcionalidade é condicionada ao preenchimento.
- Feedback leve e não intrusivo: erros inline, sucesso silencioso (exceto senha: msg temporária 5s).
- Property tests usam `fast-check` (já instalado) com mínimo 100 iterações por property.
- Dependências novas: `jspdf` e `exceljs` (ambas client-side, licença MIT).

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4", "1.5", "1.6", "1.7"] },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3"] },
    { "id": 3, "tasks": ["3.4", "3.5", "3.6"] },
    { "id": 4, "tasks": ["5.1", "5.2"] },
    { "id": 5, "tasks": ["5.3", "5.4"] },
    { "id": 6, "tasks": ["7.1", "7.2"] },
    { "id": 7, "tasks": ["7.3"] },
    { "id": 8, "tasks": ["9.1"] },
    { "id": 9, "tasks": ["9.2", "9.3", "9.4", "9.5", "9.6"] },
    { "id": 10, "tasks": ["11.1", "11.2", "11.3"] },
    { "id": 11, "tasks": ["11.4", "11.5", "11.6"] },
    { "id": 12, "tasks": ["13.1", "13.2", "13.3"] }
  ]
}
```
