# Ponto zero — semana.

Data: 17/10/2026. Branch consolidada: `baseline/ponto-zero`.

## Base preservada

Base funcional: `feat/mood-tracking` (`4bce70a`), que contém o histórico de todas as oito branches anteriores. O merge incorpora o Mapa de Ritmo Semanal e preserva leitura, histórico, perfil, humor, pensamentos, lembretes e PWA. Apagar os nomes antigos das branches não apaga seus commits, que permanecem alcançáveis nesta base.

## Banco verificado

Projeto Neon `tdaha-app-db`, banco `neondb`, branch `main`. Essa branch é marcada pelo Neon como vinculada à produção da Vercel; um Preview do aplicativo não significa, por si só, um banco separado.

As 15 tabelas do schema Drizzle existem:

| Área | Tabelas |
|---|---|
| Acesso e perfil | `users`, `sessions`, `login_attempts` |
| Dia, humor, insight e pensamentos | `days`, `logs`, `day_thoughts` |
| Ritmo semanal | `tasks`, `week_plans`, `week_plan_tasks` |
| Lembretes | `reminders` |
| Leitura | `books`, `book_reading_logs`, `book_notes` |
| Organização dos registros | `tags`, `log_tags` |

As tabelas de `neon_auth` são estruturas separadas do provedor e foram mantidas. O aplicativo continua usando sua autenticação existente.

Não é necessária outra tabela para o escopo atual. `days.mood`, `days.mood_note` e `days.insight` já existem; não adicionar `logs.mood`, que não pertence ao schema atualizado.

## Migração do ritmo

Aplicada a migração `drizzle/migrations/0006_weekly_rhythm.sql` como uma transação no banco existente:

- Adiciona `week_plan_tasks.completed_dates` (`text[]`, não nulo, padrão vazio).
- Impede repetição de `(week_plan_id, task_id)` com um índice único.
- Recupera datas de registros vinculados, respeitando usuário e semana; mantém contagens históricas.
- Não inventa datas para incrementos antigos sem registro diário.

Para executar essa migração em outro ambiente, com Node compatível com `--env-file`:

```bash
node --env-file=.env.local scripts/migrate-task-rhythm.mjs
```

Use conexão direta para migrações. O arquivo deve fornecer `DATABASE_URL`; nunca versionar credenciais. O script é dedicado à migração 0006 e não depende de executar novamente o bootstrap legado `scripts/migrate.mjs`. O histórico antigo inclui migrações manuais; não executar um reset ou `db:push` para sincronizá-lo automaticamente.

## Regras de ritmo

- Pílulas podem alternar datas da semana até hoje, com autorização no servidor.
- Cada marca adiciona uma unidade; desmarcar remove uma unidade preservando extras.
- O botão `+` adiciona uma unidade e marca hoje quando hoje pertence à semana exibida.
- Registros vinculados adicionam uma unidade e marcam sua data.
- Excluir um registro não remove automaticamente a presença da pílula; o contador não cai abaixo das datas marcadas. A presença pode ser desmarcada explicitamente.
- Ao editar metas, as tarefas mantidas preservam IDs, contagens e vínculos.

## Pendências conhecidas

Foi encontrado um vínculo antigo de registro com tarefa de outra semana. O registro foi preservado e excluído da recuperação automática de datas. Corrigir seu vínculo exige avaliar o caso na interface; não há motivo para apagar o registro.

Ainda não foi validada navegação autenticada no Preview. A conexão Neon desta conversa permite executar consultas sem alterar as variáveis da Vercel.

## Referências anteriores preservadas no histórico

| Branch anterior | Commit antes da consolidação |
|---|---|
| `design/daily-log-ux-improvements` | `0a158783fa1e2c9533f1cfa02c76e25f048cfe31` |
| `design/daily-log-ux-v3` | `b8b2c134f4a4cacb96aa19559f30b934a48fbd8d` |
| `feat/daily-log-system` | `0cac0c8dddbdc6beda9b039ea92012c1f7d1035e` |
| `feat/edit-log-time` | `edaf775478c1646eec001f3810cb6fd1d6c4152d` |
| `feat/mood-tracking` | `4bce70a16ddf48732c9fdd4fac367fa4895e96bf` |
| `feat/reading-companion` | `67719e2a9c499cb79efcb5bf6383052f50cac37a` |
| `feat/weekly-calendar` | `a33e2bdf388494b7bf4f3e38cc42873b698319a1` |
| `fix/week-navigation-improvements` | `bc9f9722a8c82be0c3b19fca06bfa5de3fa94160` |
