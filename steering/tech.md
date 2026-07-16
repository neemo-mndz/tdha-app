# Tech Steering — Weekly Companion App

## Stack obrigatória

- **Frontend:** Next.js (App Router). Não usar Pages Router em nenhuma parte do projeto.
- **Hosting:** Vercel.
- **Banco de dados:** Neon (PostgreSQL serverless).
- **Camada de API:** Next.js Route Handlers (`app/api/**/route.ts`) para endpoints reutilizáveis/externos; Server Actions para mutações diretamente ligadas a formulários/UI (ex: criar log, criar reminder).

## Critérios para escolher Route Handler vs Server Action

- Use **Server Action** quando a mutação é disparada diretamente por uma interação de UI simples (criar log, marcar mood, criar reminder) e não precisa ser chamada por um cliente externo.
- Use **Route Handler** quando o endpoint precisa ser chamado por integrações externas, webhooks, ou quando há necessidade de contrato de API explícito (ex: exportação de dados, futura integração mobile).

## Banco de dados

- PostgreSQL via Neon, acessado com um client leve (ex: `@neondatabase/serverless` ou `postgres.js`), sem ORM pesado obrigatório — se um ORM for usado, preferir Drizzle por ser leve e ter bom suporte a edge/serverless.
- Toda query de leitura da tela principal (semana atual) deve ser otimizada para retornar em uma única viagem ao banco sempre que possível (evitar N+1 entre days → logs).

## Data fetching e estado

- Server Components como padrão para leitura de dados (calendário semanal, overview).
- Client Components apenas onde há interatividade real (captura instantânea, formulários de log/reminder, indicadores otimistas).
- Preferir **optimistic UI** para criação de logs — a ação deve parecer instantânea (<10s incluindo qualquer possível erro de rede tratado de forma silenciosa/retry).
- Evitar bibliotecas de state management pesadas (Redux etc.) — usar estado local + Server Actions + revalidação (`revalidatePath`/`revalidateTag`) como padrão. Considerar uma lib leve (ex: Zustand) apenas se o estado de UI cross-componente justificar.

## Convenções de código

- TypeScript estrito em todo o projeto.
- Validação de payloads de entrada (Server Actions e Route Handlers) com Zod.
- Nomenclatura de tabelas e colunas em `snake_case` no banco; mapeamento para `camelCase` na camada de aplicação.
- Testes: priorizar testes de integração das Server Actions/queries core (criar log, buscar semana atual) sobre cobertura extensiva de UI no MVP.

## Restrições explícitas

- Nenhuma dependência de IA/LLM nesta fase do produto.
- Nenhuma biblioteca de UI pesada que imponha um "dashboard look" (evitar templates de admin dashboard prontos) — a UI deve ser desenhada sob medida para o padrão calendário-primeiro.
