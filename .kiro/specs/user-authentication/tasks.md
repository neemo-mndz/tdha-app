# Implementation Plan: User Authentication

## Overview

Implementação de autenticação real com email e senha para o **semana.**, substituindo o stub hardcoded em `lib/auth.ts`. Inclui registro, login, logout, gerenciamento de sessão com cookies, proteção de rotas via middleware e rate limiting. Utiliza scrypt para hashing, PostgreSQL para sessões e Zod para validação.

## Tasks

- [x] 1. Atualizar schema do banco e criar módulos base de autenticação
  - [x] 1.1 Atualizar `drizzle/schema.ts` com campos de autenticação
    - Adicionar campos `email` (text, not null, unique) e `passwordHash` (text, not null) à tabela `users`
    - Criar tabela `sessions` (id text PK, userId uuid FK, expiresAt timestamp, createdAt timestamp)
    - Criar tabela `loginAttempts` (id uuid PK, email text, attemptedAt timestamp)
    - Adicionar relações para `sessions` e `loginAttempts`
    - Exportar tipos inferidos das novas tabelas
    - _Requirements: 5.1, 5.2, 4.6_

  - [x] 1.2 Criar módulo `lib/auth/password.ts`
    - Implementar `hashPassword(plaintext)` usando `crypto.scrypt` nativo do Node.js com salt aleatório
    - Implementar `verifyPassword(plaintext, hash)` que extrai o salt e verifica com scrypt
    - Hash armazenado no formato `salt:derivedKey` (ambos em hex)
    - _Requirements: 1.8_

  - [ ]* 1.3 Write property test for password hashing round-trip
    - **Property 1: Password hashing round-trip**
    - Para qualquer senha de 8-128 caracteres, `hashPassword` seguido de `verifyPassword` retorna `true`, e o hash nunca é igual ao plaintext
    - **Validates: Requirements 1.8, 1.2**

  - [x] 1.4 Criar módulo `lib/auth/schemas.ts` com validações Zod
    - Implementar `loginSchema`: email (format RFC 5322 simplificado, max 254 chars, trim+lowercase), password (non-empty)
    - Implementar `registerSchema`: email (mesmas regras), password (8-128 chars), confirmPassword (deve igualar password)
    - Normalização de email: lowercase + trim
    - Mensagens de erro em português, concisas e sem culpa (max 80 chars)
    - _Requirements: 1.5, 1.6, 1.7, 2.4, 2.5, 6.4, 6.6_

  - [ ]* 1.5 Write property tests for Zod schemas
    - **Property 4: Email schema validation rejects invalid formats**
    - **Property 5: Password length boundaries**
    - **Property 6: Confirm password mismatch rejected**
    - **Property 2: Email normalization is idempotent and case-insensitive**
    - **Property 13: Error messages are concise and blame-free**
    - **Validates: Requirements 1.5, 1.6, 1.7, 2.5, 5.7, 6.4, 6.6**

- [x] 2. Checkpoint — Validar módulos base
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Implementar gerenciamento de sessão e rate limiting
  - [x] 3.1 Criar módulo `lib/auth/session.ts`
    - Implementar `createSession(userId)`: gera token com `crypto.randomBytes(32).toString('hex')`, insere na tabela `sessions` com expiresAt = now + 30 dias, retorna sessionId
    - Implementar `validateSession(sessionId)`: busca sessão no banco, verifica expiração, retorna `Session | null`
    - Implementar `renewSession(sessionId)`: atualiza expiresAt para now + 30 dias
    - Implementar `invalidateSession(sessionId)`: deleta sessão do banco
    - Em caso de erro de DB, retornar `null` (graceful degradation)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 4.7, 3.3_

  - [ ]* 3.2 Write property tests for session lifecycle
    - **Property 10: Session lifecycle (create → validate → invalidate)**
    - **Property 11: Session expiry is 30 days rolling**
    - **Validates: Requirements 3.2, 3.3, 4.2, 4.3, 4.4**

  - [x] 3.3 Criar módulo `lib/auth/rate-limit.ts`
    - Implementar `checkRateLimit(email)`: conta tentativas nos últimos 15 min; se >= 5, retorna `{ allowed: false, retryAfterSeconds }`
    - Implementar `recordFailedAttempt(email)`: insere registro na tabela `loginAttempts`
    - Implementar `clearFailedAttempts(email)`: deleta registros para o email
    - _Requirements: 2.7_

  - [ ]* 3.4 Write property test for rate limiting
    - **Property 9: Rate limiting blocks after threshold**
    - **Validates: Requirements 2.7**

- [x] 4. Implementar queries de autenticação e atualizar `lib/auth.ts`
  - [x] 4.1 Criar `lib/db/queries/auth.ts`
    - Implementar `findUserByEmail(email)`: busca usuário pelo email normalizado
    - Implementar `createUser(email, passwordHash)`: insere novo usuário retornando id
    - Implementar `emailExists(email)`: verifica se email já está cadastrado
    - _Requirements: 1.2, 1.4, 2.2, 5.1, 5.7_

  - [x] 4.2 Atualizar `lib/auth.ts` para usar sessão real
    - Remover stub hardcoded
    - Implementar `getCurrentUserId()` que: lê cookie `session_id` via `cookies()`, valida sessão com `validateSession()`, renova sessão com `renewSession()`
    - Em Server Component: `redirect('/login')` se não autenticado
    - Em Server Action: `throw Error` se não autenticado
    - _Requirements: 3.2, 3.5, 5.3, 5.4_

  - [ ]* 4.3 Write property tests for auth queries
    - **Property 3: Duplicate email registration is rejected**
    - **Property 7: Login round-trip (register then login)**
    - **Property 8: Invalid credentials produce generic error**
    - **Validates: Requirements 1.4, 2.2, 2.3**

- [x] 5. Checkpoint — Validar lógica de autenticação
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implementar server actions de autenticação
  - [x] 6.1 Criar `lib/actions/auth.ts` com server actions
    - Implementar `registerAction(formData)`: valida com registerSchema, verifica email duplicado, cria usuário, cria sessão, set cookie, redirect para `/`
    - Implementar `loginAction(formData)`: valida com loginSchema, verifica rate limit, busca usuário, verifica senha, gerencia tentativas, cria sessão, set cookie, redirect para `/`
    - Implementar `logoutAction()`: invalida sessão, remove cookie, redirect para `/login`
    - Retornar `ActionResult` com erros tipados (invalid_credentials, email_exists, rate_limited, unknown)
    - Mensagens genéricas para credenciais inválidas (não revelar qual campo está errado)
    - _Requirements: 1.2, 1.3, 1.4, 2.2, 2.3, 2.7, 4.4_

  - [ ]* 6.2 Write unit tests for server actions
    - Testar fluxo de registro com sucesso e email duplicado
    - Testar fluxo de login com sucesso, credenciais inválidas e rate limit
    - Testar logout invalidando sessão e removendo cookie
    - _Requirements: 1.2, 1.3, 1.4, 2.2, 2.3, 2.7, 4.4_

- [x] 7. Implementar middleware e proteção de rotas
  - [x] 7.1 Criar `middleware.ts` na raiz do projeto
    - Verificar presença do cookie `session_id`
    - Rotas protegidas (qualquer rota fora de `/login`, `/register`, `_next`, assets) sem cookie → redirect para `/login`
    - Rotas públicas (`/login`, `/register`) com cookie → redirect para `/`
    - Configurar matcher para excluir assets estáticos
    - _Requirements: 3.1, 3.4, 2.9_

  - [ ]* 7.2 Write unit tests for middleware
    - Testar redirect para `/login` quando sem cookie em rota protegida
    - Testar redirect para `/` quando com cookie em rota pública
    - Testar que assets estáticos não são interceptados
    - _Requirements: 3.1, 2.9_

- [x] 8. Implementar páginas de login e registro
  - [x] 8.1 Criar página de registro `app/(auth)/register/page.tsx`
    - Server Component com Client Form (use client)
    - Campos: email (type="email", autocomplete="email"), senha (type="password", autocomplete="new-password"), confirmar senha (type="password", autocomplete="new-password")
    - Botão de submissão com loading state (disabled + spinner durante submissão)
    - Timeout de 30s: reabilitar botão e mostrar erro de comunicação
    - Link para login: "Já tem conta? Entre aqui"
    - Autofocus no campo de email ao carregar
    - Submissão via Enter em qualquer campo
    - Remoção de erro inline ao editar campo (dentro de 300ms)
    - Preservar valores preenchidos em caso de erro (exceto senha em erros de server)
    - Identidade visual: logo "semana." e subtítulo
    - Sem FAB, navegação principal ou elementos de rotas protegidas
    - _Requirements: 1.1, 1.3, 1.5, 1.6, 1.7, 1.9, 1.10, 1.11, 6.1, 6.2, 6.3, 6.4, 6.5, 6.7, 6.8_

  - [x] 8.2 Criar página de login `app/(auth)/login/page.tsx`
    - Server Component com Client Form (use client)
    - Campos: email (type="email", autocomplete="email"), senha (type="password", autocomplete="current-password")
    - Botão de submissão com loading state (disabled + spinner durante submissão)
    - Timeout de 30s: reabilitar botão e mostrar erro de comunicação
    - Link para registro: "Não tem conta? Crie a sua"
    - Autofocus no campo de email ao carregar
    - Submissão via Enter em qualquer campo
    - Erro genérico de credenciais inválidas (sem indicar qual campo)
    - Manter email preenchido e limpar senha em caso de erro
    - Remoção de erro inline ao editar campo (dentro de 300ms)
    - Identidade visual: logo "semana." e subtítulo
    - Sem FAB, navegação principal ou elementos de rotas protegidas
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 6.1, 6.2, 6.3, 6.4, 6.5, 6.7, 6.8_

  - [x] 8.3 Criar layout `app/(auth)/layout.tsx`
    - Layout minimalista compartilhado entre login e registro
    - Sem navegação do app, sem FAB
    - Centralizado verticalmente e horizontalmente
    - _Requirements: 6.1, 6.8_

- [x] 9. Integrar logout e finalizar proteção de dados
  - [x] 9.1 Adicionar botão/opção de logout na área de navegação ou settings
    - Visível em qualquer Rota_Protegida sem necessidade de scroll
    - Chamar `logoutAction()` ao clicar
    - _Requirements: 4.4, 4.5_

  - [x] 9.2 Adicionar filtro por `userId` em todas as queries existentes
    - Atualizar `lib/db/queries/logs.ts` para filtrar por userId da sessão
    - Atualizar `lib/db/queries/tasks.ts` para filtrar por userId da sessão
    - Atualizar `lib/db/queries/weekPlans.ts` para filtrar por userId da sessão
    - Atualizar `lib/db/queries/weeks.ts` para filtrar por userId da sessão
    - Atualizar `lib/db/queries/reminders.ts` para filtrar por userId da sessão
    - Garantir que operações de escrita (server actions) também validam userId
    - _Requirements: 5.5, 5.6_

  - [ ]* 9.3 Write property test for data isolation
    - **Property 12: Data isolation between users**
    - **Validates: Requirements 5.5, 5.6**

- [x] 10. Checkpoint final — Validar integração completa
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada task referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Property tests validam propriedades universais de corretude (usando fast-check + Vitest)
- Unit tests validam exemplos específicos e edge cases
- A implementação usa TypeScript em todo o projeto (Next.js App Router)
- O middleware verifica apenas presença do cookie; validação completa ocorre em `getCurrentUserId()`
- Hashing usa `scrypt` nativo (decisão do design), não bcrypt/argon2 (mencionados nos requirements como alternativas aceitáveis)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.4"] },
    { "id": 2, "tasks": ["1.3", "1.5", "3.1", "3.3"] },
    { "id": 3, "tasks": ["3.2", "3.4", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3"] },
    { "id": 5, "tasks": ["6.1", "7.1"] },
    { "id": 6, "tasks": ["6.2", "7.2", "8.3"] },
    { "id": 7, "tasks": ["8.1", "8.2"] },
    { "id": 8, "tasks": ["9.1", "9.2"] },
    { "id": 9, "tasks": ["9.3"] }
  ]
}
```
