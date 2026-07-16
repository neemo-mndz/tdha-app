# Requirements Document

## Introduction

Esta spec cobre o scaffolding e configuração inicial do **Weekly Companion App** — um app de registro diário para pessoas com TDAH. O objetivo é criar a infraestrutura base do projeto (estrutura de pastas, banco de dados, ORM, validação, estilos, roteamento raiz) de forma que o projeto compile sem erros e esteja pronto para receber todas as features subsequentes sem necessidade de refatoração de infraestrutura.

Stack adotada: Next.js 14+ (App Router), TypeScript estrito, Neon PostgreSQL, Drizzle ORM, Zod, Vercel, Tailwind CSS, date-fns.

## Glossary

- **Project**: O repositório Next.js do Weekly Companion App.
- **TypeScript_Compiler**: O compilador `tsc` executado via `npx tsc --noEmit`.
- **Neon_Client**: O módulo `lib/db/client.ts` que instancia a conexão com o banco Neon usando `@neondatabase/serverless`.
- **Drizzle_Schema**: O arquivo `drizzle/schema.ts` contendo a definição de todas as tabelas core usando Drizzle ORM.
- **Migration_Runner**: O script Drizzle que aplica migrações ao banco de dados Neon.
- **Tailwind**: O framework CSS Tailwind configurado no projeto.
- **Root_Layout**: O arquivo `app/layout.tsx` que envolve toda a aplicação.
- **Root_Page**: O arquivo `app/page.tsx` que serve a rota `/`.
- **Env_File**: O arquivo `.env.local` contendo as variáveis de ambiente do projeto.
- **Folder_Structure**: A estrutura de pastas definida em `steering/structure.md`.
- **Zod**: A biblioteca de validação de schemas usada em toda a camada de entrada de dados.
- **Drizzle_Config**: O arquivo `drizzle.config.ts` na raiz do projeto com configurações do ORM.

## Requirements

---

### Requirement 1: Inicialização do projeto Next.js com TypeScript estrito

**User Story:** Como desenvolvedor, quero que o projeto Next.js seja inicializado com TypeScript estrito habilitado, para que erros de tipo sejam detectados em tempo de compilação antes de qualquer deploy.

#### Acceptance Criteria

1. THE Project SHALL conter um arquivo `tsconfig.json` com `"strict": true` habilitado.
2. THE Project SHALL conter um arquivo `next.config.ts` (ou `next.config.js`) válido compatível com Next.js 14+.
3. WHEN o comando `npx tsc --noEmit` for executado na raiz do projeto, THE TypeScript_Compiler SHALL concluir sem erros.
4. THE Project SHALL usar exclusivamente o App Router (`app/`) — nenhum diretório `pages/` deve existir.
5. THE Project SHALL ter a dependência `next` na versão `14.x` ou superior listada em `package.json`.

---

### Requirement 2: Configuração do Tailwind CSS

**User Story:** Como desenvolvedor, quero que o Tailwind CSS esteja configurado corretamente, para que todos os componentes da aplicação possam usar classes utilitárias sem configuração adicional.

#### Acceptance Criteria

1. THE Project SHALL conter um arquivo `tailwind.config.ts` (ou `tailwind.config.js`) com o campo `content` apontando para `./app/**/*.{ts,tsx}` e `./components/**/*.{ts,tsx}`.
2. THE Project SHALL conter um arquivo `app/globals.css` com as diretivas `@tailwind base`, `@tailwind components` e `@tailwind utilities`.
3. THE Root_Layout SHALL importar `./globals.css` para que os estilos Tailwind sejam aplicados globalmente.
4. THE Project SHALL ter as dependências `tailwindcss`, `postcss` e `autoprefixer` listadas em `package.json`.

---

### Requirement 3: Configuração do cliente Neon

**User Story:** Como desenvolvedor, quero que o cliente de banco de dados Neon esteja configurado em um módulo centralizado, para que todas as queries e Server Actions usem a mesma instância de conexão.

#### Acceptance Criteria

1. THE Project SHALL conter o arquivo `lib/db/client.ts` exportando uma instância do cliente Neon.
2. THE Neon_Client SHALL usar a variável de ambiente `DATABASE_URL` para estabelecer a conexão.
3. IF `DATABASE_URL` não estiver definida no ambiente, THEN THE Neon_Client SHALL lançar um erro com a mensagem `"DATABASE_URL is not defined"` durante a inicialização do módulo.
4. THE Project SHALL ter a dependência `@neondatabase/serverless` listada em `package.json`.
5. THE Neon_Client SHALL ser tipado com TypeScript estrito — nenhum tipo `any` explícito.

---

### Requirement 4: Configuração do Drizzle ORM e schema inicial

**User Story:** Como desenvolvedor, quero que o Drizzle ORM esteja configurado com o schema das tabelas core, para que as features subsequentes possam construir queries tipadas sem redefinir estruturas de banco.

#### Acceptance Criteria

1. THE Project SHALL conter o arquivo `drizzle/schema.ts` com as definições das tabelas `users`, `days`, `logs` e `reminders`.
2. THE Drizzle_Schema SHALL definir a tabela `users` com as colunas: `id` (uuid, primary key, default `gen_random_uuid()`), `created_at` (timestamp, not null, default now()).
3. THE Drizzle_Schema SHALL definir a tabela `days` com as colunas: `id` (uuid, primary key), `user_id` (uuid, foreign key → `users.id`), `date` (date, not null), `created_at` (timestamp, not null, default now()).
4. THE Drizzle_Schema SHALL definir a tabela `logs` com as colunas: `id` (uuid, primary key), `day_id` (uuid, foreign key → `days.id`), `content` (text, not null), `mood` (integer, nullable), `created_at` (timestamp, not null, default now()).
5. THE Drizzle_Schema SHALL definir a tabela `reminders` com as colunas: `id` (uuid, primary key), `user_id` (uuid, foreign key → `users.id`), `title` (text, not null), `time` (text, not null), `active` (boolean, not null, default true), `created_at` (timestamp, not null, default now()).
6. THE Project SHALL conter o arquivo `drizzle.config.ts` na raiz com `schema: "./drizzle/schema.ts"`, `out: "./drizzle/migrations"` e `dialect: "postgresql"`.
7. THE Project SHALL ter as dependências `drizzle-orm` e `drizzle-kit` listadas em `package.json`.
8. THE Drizzle_Schema SHALL usar nomenclatura `snake_case` para todos os nomes de tabelas e colunas.

---

### Requirement 5: Migração inicial do banco de dados

**User Story:** Como desenvolvedor, quero que o script de migração inicial crie as tabelas core no banco Neon, para que o banco esteja pronto para receber dados das features sem necessidade de criação manual de tabelas.

#### Acceptance Criteria

1. THE Project SHALL conter pelo menos um arquivo de migração SQL em `drizzle/migrations/` gerado pelo Drizzle Kit.
2. WHEN o script de migração for executado contra o banco Neon, THE Migration_Runner SHALL criar as tabelas `users`, `days`, `logs` e `reminders` sem erros.
3. THE Project SHALL ter um script `"db:migrate"` em `package.json` que executa as migrações via Drizzle Kit.
4. THE Project SHALL ter um script `"db:generate"` em `package.json` que gera arquivos de migração a partir do schema via `drizzle-kit generate`.
5. WHEN o script `"db:migrate"` for executado com `DATABASE_URL` válida, THE Migration_Runner SHALL concluir sem erros e as quatro tabelas core SHALL existir no banco.

---

### Requirement 6: Variáveis de ambiente

**User Story:** Como desenvolvedor, quero que as variáveis de ambiente necessárias estejam documentadas e validadas, para que qualquer desenvolvedor possa configurar o projeto localmente sem ambiguidade.

#### Acceptance Criteria

1. THE Project SHALL conter um arquivo `.env.example` (ou `.env.local.example`) na raiz com a variável `DATABASE_URL=` documentada (valor em branco).
2. THE Project SHALL conter um arquivo `.gitignore` que inclua `.env.local` para que credenciais não sejam commitadas.
3. THE Env_File (`.env.local`) SHALL ser o único arquivo de variáveis de ambiente carregado em desenvolvimento local — nenhum `.env` sem sufixo deve ser necessário para o funcionamento básico.
4. THE Project SHALL conter um arquivo `env.ts` (ou equivalente) em `lib/` que valida as variáveis de ambiente obrigatórias com Zod durante o build, exportando um objeto tipado com as variáveis validadas.

---

### Requirement 7: Estrutura de pastas conforme steering

**User Story:** Como desenvolvedor, quero que a estrutura de pastas do projeto siga exatamente o padrão definido em `steering/structure.md`, para que todos os membros da equipe e specs futuras encontrem os arquivos nos locais esperados.

#### Acceptance Criteria

1. THE Project SHALL conter o diretório `app/(app)/` para o grupo de rotas autenticadas, conforme `steering/structure.md`.
2. THE Project SHALL conter os diretórios `components/calendar/`, `components/logs/`, `components/reminders/`, `components/overview/` e `components/ui/` na raiz.
3. THE Project SHALL conter os diretórios `lib/db/queries/`, `lib/actions/`, `lib/validation/` e `lib/utils/` conforme a estrutura definida.
4. THE Project SHALL conter o diretório `drizzle/migrations/` para armazenar os arquivos de migração gerados.
5. THE Project SHALL conter arquivos placeholder (`.gitkeep` ou arquivo index vazio) em diretórios que ainda não possuem implementação, para que a estrutura de pastas seja preservada no repositório git.

---

### Requirement 8: Configuração do Zod como padrão de validação

**User Story:** Como desenvolvedor, quero que o Zod esteja instalado e com schemas de exemplo nas pastas de validação, para que o padrão de validação esteja estabelecido desde o início e as features subsequentes sigam o mesmo modelo.

#### Acceptance Criteria

1. THE Project SHALL ter a dependência `zod` listada em `package.json`.
2. THE Project SHALL conter o arquivo `lib/validation/log.schema.ts` com um schema Zod inicial para criação de log (campos: `content` string não vazia, `mood` integer opcional entre 1 e 5).
3. THE Project SHALL conter o arquivo `lib/validation/reminder.schema.ts` com um schema Zod inicial para criação de reminder (campos: `title` string não vazia, `time` string em formato `HH:MM`).
4. THE Zod schemas SHALL ser exportados como constantes nomeadas (ex: `createLogSchema`, `createReminderSchema`) para uso nas Server Actions e Route Handlers.

---

### Requirement 9: Root Layout e globals.css

**User Story:** Como desenvolvedor, quero que o Root Layout e o arquivo de estilos globais estejam configurados de forma minimalista, para que todas as telas herdem a configuração base sem elementos visuais desnecessários para o MVP.

#### Acceptance Criteria

1. THE Root_Layout SHALL conter os elementos `<html lang="pt-BR">` e `<body>` com a fonte padrão do sistema (system-ui ou equivalente via Tailwind).
2. THE Root_Layout SHALL incluir os metadados `title` e `description` usando a API de Metadata do Next.js 14+.
3. THE Root_Layout SHALL importar `globals.css` e não deve importar nenhuma outra folha de estilos de bibliotecas de componentes externas.
4. THE Project SHALL conter o arquivo `app/(app)/layout.tsx` com estrutura mínima (sem navegação implementada), pronto para receber o componente de navegação em specs subsequentes.
5. WHEN o projeto for buildado com `next build`, THE Root_Layout SHALL ser renderizado sem erros.

---

### Requirement 10: Página inicial com redirecionamento

**User Story:** Como usuário, quero que ao acessar a rota `/` seja redirecionado automaticamente para o calendário semanal da semana atual, para que a experiência comece imediatamente no contexto correto.

#### Acceptance Criteria

1. THE Root_Page (`app/page.tsx`) SHALL redirecionar permanentemente para `/week/[weekStart]` onde `[weekStart]` é a data ISO da segunda-feira da semana atual.
2. THE Root_Page SHALL usar `redirect()` do `next/navigation` (Server Component) — nenhum redirecionamento client-side via `useRouter`.
3. THE Root_Page SHALL calcular o `weekStart` usando `date-fns` com a função `startOfISOWeek` e formatar a data no padrão `yyyy-MM-dd`.
4. THE Project SHALL ter a dependência `date-fns` listada em `package.json`.
5. THE Project SHALL conter o arquivo `lib/utils/date.ts` com a função `getCurrentWeekStart(): string` que retorna a data ISO da segunda-feira da semana atual no formato `yyyy-MM-dd`, usada pelo Root_Page e disponível para demais features.

---

### Requirement 11: Página stub do calendário semanal

**User Story:** Como desenvolvedor, quero que a rota `app/(app)/week/[weekStart]/page.tsx` exista com conteúdo mínimo, para que o redirecionamento da rota `/` não resulte em erro 404 ao final do setup.

#### Acceptance Criteria

1. THE Project SHALL conter o arquivo `app/(app)/week/[weekStart]/page.tsx` como Server Component.
2. THE Project SHALL conter o arquivo `app/(app)/page.tsx` como entry point do grupo de rotas autenticadas, podendo ser um stub mínimo.
3. WHEN a rota `/week/[weekStart]` for acessada com uma data válida no formato `yyyy-MM-dd`, THE Project SHALL responder com status HTTP 200 sem erro de compilação ou runtime.
4. THE stub de `week/[weekStart]/page.tsx` SHALL receber o parâmetro `params.weekStart` tipado como `{ weekStart: string }` para garantir compatibilidade com as specs subsequentes.
