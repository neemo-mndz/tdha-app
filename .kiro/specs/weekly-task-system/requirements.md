# Requirements Document

## Introduction

Esta spec cobre a implementação completa do **sistema de tarefas semanais** do app **semana.** — desde a biblioteca de templates até os contadores informativos e a vinculação via chips na criação de logs. O sistema permite ao usuário planejar atividades recorrentes por semana de forma leve, sem cobrança ou pressão.

O sistema se integra ao módulo de logs diários já existente (Server Actions + Zod + Drizzle ORM + useOptimistic) e requer novas tabelas no banco Neon PostgreSQL: `tasks`, `week_plans` e `week_plan_tasks`, além de um campo opcional `taskId` na tabela `logs`.

Princípio fundamental: **ZERO culpa, cobrança ou pressão**. Contadores são estritamente informativos.

---

## Glossary

- **Sistema**: o aplicativo **semana.** como um todo.
- **Biblioteca_de_Tarefas**: coleção persistente de templates de tarefas recorrentes pertencentes a um usuário, armazenada na tabela `tasks`.
- **Tarefa**: registro na Biblioteca_de_Tarefas contendo nome e quantidade padrão; template reutilizável entre semanas.
- **Plano_Semanal**: subconjunto da Biblioteca_de_Tarefas ativado para uma semana específica, com meta de quantidade configurável por tarefa; armazenado nas tabelas `week_plans` e `week_plan_tasks`.
- **Tarefa_Ativa**: Tarefa incluída no Plano_Semanal de uma semana com meta ≥ 1.
- **Contador**: campo numérico `feito/meta` associado a cada Tarefa_Ativa no Plano_Semanal; estritamente informativo.
- **Bump**: incremento manual do Contador via toque direto no painel de tarefas, sem criar um Log.
- **Chip_de_Tarefa**: elemento de seleção (pill/chip) exibido na interface de criação de Log para vincular opcionalmente o Log a uma Tarefa_Ativa.
- **Log**: registro de texto livre criado pelo usuário para um dia específico (tabela `logs` existente).
- **Semana**: período de 7 dias identificado pela data de início (segunda-feira), formato `yyyy-MM-dd`.
- **Modal_Editar_Tarefas**: interface de CRUD da Biblioteca_de_Tarefas.
- **Modal_Planejar_Semana**: interface de seleção e configuração do Plano_Semanal.
- **Server_Action**: função assíncrona do Next.js executada no servidor, validada com Zod.
- **Painel_de_Tarefas**: seção lateral direita da tela principal que exibe as Tarefas_Ativas e seus Contadores.

---

## Requirements

### Requirement 1 — Biblioteca de Tarefas (CRUD)

**User Story:** Como usuário do app, eu quero criar e gerenciar uma coleção de tarefas recorrentes reutilizáveis, para que eu possa ativá-las para diferentes semanas sem precisar redigitá-las toda vez.

#### Acceptance Criteria

1. THE Sistema SHALL manter uma Biblioteca_de_Tarefas persistente por usuário, armazenada na tabela `tasks` do banco Neon PostgreSQL, cujos dados sobrevivam ao fechamento e reabertura do app.
2. WHEN o usuário adiciona uma nova Tarefa à Biblioteca_de_Tarefas informando nome e quantidade padrão via Modal_Editar_Tarefas, THE Sistema SHALL criar o registro na tabela `tasks` e exibi-lo na lista da biblioteca com feedback otimista (useOptimistic) em menos de 300ms de resposta visual.
3. IF o usuário tenta adicionar uma Tarefa com nome vazio ou contendo apenas espaços em branco, THEN THE Sistema SHALL manter o foco no campo de nome sem criar o registro e sem exibir mensagem de erro.
4. THE Sistema SHALL aceitar nomes de Tarefa com até 100 caracteres; WHEN o usuário digita o 101º caractere no campo de nome, THE Sistema SHALL bloquear a entrada desse caractere.
5. THE Sistema SHALL aceitar quantidade padrão de Tarefa como número inteiro entre 1 e 99; WHEN o usuário informa um valor fora desse intervalo no campo de quantidade, THE Sistema SHALL redefinir o campo para o valor limite mais próximo (1 ou 99) antes de salvar.
6. WHEN o usuário edita o nome de uma Tarefa existente na Biblioteca_de_Tarefas, THE Sistema SHALL validar o payload com Zod e atualizar o nome na tabela `tasks` via Server_Action sem alterar o Plano_Semanal de semanas em que a Tarefa já foi ativada.
7. WHEN o usuário edita a quantidade padrão de uma Tarefa existente na Biblioteca_de_Tarefas, THE Sistema SHALL atualizar o valor padrão na tabela `tasks` sem alterar a meta de Planos_Semanais em que a Tarefa já foi ativada.
8. WHEN o usuário aciona "remover" em uma Tarefa da Biblioteca_de_Tarefas, THE Sistema SHALL solicitar confirmação antes de excluir; WHEN a exclusão é confirmada, THE Sistema SHALL remover o registro da tabela `tasks` sem alterar registros existentes em `week_plan_tasks` de semanas anteriores.
9. THE Sistema SHALL exibir a Biblioteca_de_Tarefas no Modal_Editar_Tarefas, acessível a partir do Painel_de_Tarefas na tela principal via botão "Editar tarefas".
10. IF a Biblioteca_de_Tarefas estiver vazia, THEN THE Sistema SHALL exibir a mensagem neutra "Nenhuma tarefa criada ainda." no Modal_Editar_Tarefas, sem cobrança ou incentivo negativo.
11. IF a operação de criar, editar ou remover uma Tarefa falhar por erro de rede ou servidor, THEN THE Sistema SHALL reverter a atualização otimista e exibir um aviso inline não-modal informando o erro.

---

### Requirement 2 — Plano Semanal de Tarefas

**User Story:** Como usuário do app, eu quero selecionar quais tarefas da minha biblioteca fazem sentido para uma semana específica e definir a meta de cada uma, para que eu tenha um plano semanal flexível e independente por semana.

#### Acceptance Criteria

1. WHEN o usuário abre o Modal_Planejar_Semana, THE Sistema SHALL exibir todas as Tarefas da Biblioteca_de_Tarefas com checkbox de ativação e campo de quantidade editável; IF a Tarefa já estiver ativa no Plano_Semanal da semana corrente, THEN o checkbox SHALL estar marcado e o campo de quantidade SHALL ser pré-preenchido com a meta definida; caso contrário, THE Sistema SHALL usar a quantidade padrão da Tarefa na biblioteca como valor inicial.
2. WHEN o usuário salva o Plano_Semanal com pelo menos um checkbox marcado, THE Sistema SHALL persistir na tabela `week_plans` e `week_plan_tasks` apenas as Tarefas marcadas com suas respectivas metas, atualizar o Painel_de_Tarefas na tela principal com feedback otimista (useOptimistic) e fechar o modal.
3. THE Sistema SHALL aceitar meta de quantidade por Tarefa no Plano_Semanal como número inteiro entre 1 e 99; WHEN o usuário informa um valor fora desse intervalo, THE Sistema SHALL redefinir o campo para o valor limite mais próximo (1 ou 99) antes de salvar.
4. WHEN o usuário salva o Plano_Semanal com zero checkboxes marcados, THE Sistema SHALL salvar o plano como vazio e exibir o estado neutro no Painel_de_Tarefas.
5. WHEN o usuário reduz a meta de quantidade de uma Tarefa_Ativa para um valor menor que o progresso já registrado (campo `done`), THE Sistema SHALL preservar o valor de `done` atual sem reduzi-lo e atualizar apenas a meta.
6. WHEN o usuário remove a ativação de uma Tarefa que já possuía progresso registrado e Logs vinculados, THE Sistema SHALL preservar os Logs existentes na tabela `logs` com o campo `taskId` inalterado.
7. THE Sistema SHALL manter um Plano_Semanal independente por semana, identificado pela combinação (userId, weekStart); alterações no plano de uma semana não afetam planos de semanas anteriores ou futuras.
8. WHILE o Plano_Semanal ativo da semana corrente contém ao menos uma Tarefa_Ativa, THE Sistema SHALL listar cada Tarefa_Ativa com seu Contador `feito/meta` no Painel_de_Tarefas da tela principal.
9. IF a semana não possui Plano_Semanal definido ou o plano foi salvo sem nenhuma tarefa ativa, THEN THE Sistema SHALL exibir o estado vazio neutro "Nenhuma tarefa planejada ainda. Use 'Planejar semana'." no Painel_de_Tarefas.
10. IF a Biblioteca_de_Tarefas estiver vazia quando o usuário abre o Modal_Planejar_Semana, THEN THE Sistema SHALL exibir a mensagem neutra "Adicione tarefas na biblioteca primeiro." e desabilitar o botão "Salvar plano".
11. IF a operação de salvar o Plano_Semanal falhar por erro de rede ou servidor, THEN THE Sistema SHALL reverter a atualização otimista, manter o modal aberto e exibir um aviso inline não-modal informando o erro.

---

### Requirement 3 — Contadores de Tarefas Semanais

**User Story:** Como usuário do app, eu quero acompanhar quantas vezes realizei cada tarefa da minha semana, para que eu tenha consciência do meu progresso de forma informativa e sem sentir pressão por metas não atingidas.

#### Acceptance Criteria

1. THE Sistema SHALL exibir o Contador de cada Tarefa_Ativa no Painel_de_Tarefas estritamente no formato `feito/meta` (ex: "2/3"), onde `feito` é o valor do campo `done` em `week_plan_tasks` e `meta` é o valor do campo `goal`.
2. WHEN o usuário salva um Log com uma Tarefa vinculada via Chip_de_Tarefa, THE Sistema SHALL incrementar o campo `done` da Tarefa_Ativa correspondente em `week_plan_tasks` em 1 unidade e atualizar o Contador no Painel_de_Tarefas sem recarregar a página.
3. WHEN o usuário aciona o Bump diretamente no Contador de uma Tarefa_Ativa no Painel_de_Tarefas, THE Sistema SHALL incrementar o campo `done` daquela Tarefa_Ativa em 1 unidade via Server_Action sem criar um Log.
4. WHEN um Log vinculado a uma Tarefa_Ativa é excluído, THE Sistema SHALL decrementar o campo `done` da Tarefa_Ativa correspondente em 1 unidade; THE Sistema SHALL impedir que o campo `done` seja reduzido abaixo de 0.
5. WHILE o campo `done` de uma Tarefa_Ativa é menor que o campo `meta`, THE Sistema SHALL exibir o Contador sem nenhum indicador visual de falha, urgência, atraso ou quantidade faltante; THE Sistema SHALL NOT exibir cores de alerta, ícones de aviso ou textos como "faltam N".
6. WHEN o campo `done` de uma Tarefa_Ativa atinge ou supera o campo `meta`, THE Sistema SHALL aplicar um indicador visual positivo distinto ao Contador (classe CSS `done`) sem utilizar linguagem ou símbolos punitivos.
7. THE Sistema SHALL NOT impedir o Bump quando `done` já é igual ou superior a `meta`; o usuário pode incrementar além da meta sem restrição e sem mensagem de aviso.
8. THE Sistema SHALL NOT exibir, em nenhum elemento da UI dos Contadores ou do Painel_de_Tarefas, linguagem que comunique déficit; exemplos proibidos: "faltam N", "você não fez X", "atrasado", "incompleto".
9. WHEN o usuário aciona o Bump, THE Sistema SHALL aplicar feedback otimista (useOptimistic) incrementando o Contador visualmente antes da confirmação do servidor; IF a Server_Action falhar, THEN THE Sistema SHALL reverter o incremento visual e exibir aviso inline.

---

### Requirement 4 — Chips de Tarefa na Criação de Log

**User Story:** Como usuário do app, eu quero poder vincular opcionalmente um log a uma tarefa da semana ao criá-lo, para que o contador da tarefa seja atualizado automaticamente sem eu precisar gerenciá-lo separadamente.

#### Acceptance Criteria

1. WHEN o usuário abre a interface de criação de Log (campo de registro do dia ou modal de Captura_Instantânea), THE Sistema SHALL exibir os Chips_de_Tarefa correspondentes a todas as Tarefas_Ativas do Plano_Semanal da semana corrente, dispostos em uma fileira horizontal com scroll quando necessário.
2. THE Sistema SHALL incluir sempre um chip "nenhuma" como primeira opção na fileira de Chips_de_Tarefa; WHEN a interface de criação de Log é aberta, THE Sistema SHALL selecionar o chip "nenhuma" por padrão.
3. WHEN o usuário seleciona um Chip_de_Tarefa, THE Sistema SHALL aplicar o estado visual "selecionado" (classe CSS `active`) ao chip escolhido e remover o estado "selecionado" de qualquer outro chip anteriormente ativo, incluindo o chip "nenhuma"; apenas um chip pode estar selecionado por vez.
4. WHEN o usuário salva um Log com o chip "nenhuma" selecionado, THE Sistema SHALL criar o Log com o campo `taskId` como NULL na tabela `logs` e não incrementar nenhum Contador.
5. WHEN o usuário salva um Log com um Chip_de_Tarefa (diferente de "nenhuma") selecionado, THE Sistema SHALL criar o Log com o campo `taskId` referenciando o `id` da `week_plan_tasks` correspondente na tabela `logs`.
6. IF o Plano_Semanal da semana corrente estiver vazio (nenhuma Tarefa_Ativa), THEN THE Sistema SHALL ocultar a seção de Chips_de_Tarefa da interface de criação de Log e criar Logs com `taskId` NULL.
7. WHEN um Log com Tarefa vinculada é exibido na lista de logs do dia, THE Sistema SHALL mostrar o nome da Tarefa como um marcador visual distinto (tag/badge) ao lado do texto do Log.
8. THE Sistema SHALL validar via Zod que o campo `taskId` no payload de criação de Log é um UUID válido ou NULL; IF um `taskId` inválido for enviado, THEN THE Sistema SHALL rejeitar a criação do Log com mensagem de erro adequada.
9. THE Sistema SHALL validar no servidor que o `taskId` informado pertence a uma `week_plan_tasks` da semana correspondente à data do Log e ao mesmo usuário; IF a validação falhar, THEN THE Sistema SHALL rejeitar a criação do Log e retornar erro "Tarefa inválida para esta semana".

---

## Schema de Banco de Dados (Referência)

As seguintes tabelas são necessárias para suportar os requisitos acima:

- **tasks**: `id` (uuid PK), `userId` (uuid FK → users), `name` (text, max 100), `defaultQty` (integer, 1–99), `createdAt` (timestamp)
- **week_plans**: `id` (uuid PK), `userId` (uuid FK → users), `weekStart` (date), `createdAt` (timestamp); unique constraint em (userId, weekStart)
- **week_plan_tasks**: `id` (uuid PK), `weekPlanId` (uuid FK → week_plans), `taskId` (uuid FK → tasks), `goal` (integer, 1–99), `done` (integer, default 0), `createdAt` (timestamp)
- **logs** (alteração): adicionar campo `weekPlanTaskId` (uuid, nullable, FK → week_plan_tasks)

---

## Fora de escopo nesta spec

- Sistema de logs diários (já implementado em spec separada `daily-log-system`).
- Calendário semanal e navegação entre semanas (spec `weekly-calendar`).
- Lembretes e notificações.
- Autenticação e gerenciamento de conta.
- Visualização de histórico de tarefas entre semanas.
- Exportação de dados.
