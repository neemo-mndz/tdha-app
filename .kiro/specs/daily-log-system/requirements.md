# Requirements Document — daily-log-system

## Introdução

Esta spec cobre o sistema de registro diário do **Weekly Companion App**: a visão do dia (`/day/[date]`), a criação, edição e exclusão de logs, a captura instantânea global (Quick Capture), o estado vazio do dia e a navegação de volta ao calendário.

O princípio central é **velocidade > estrutura**: o único campo obrigatório é o texto livre. Nenhuma mecânica de culpa, nenhum campo extra exigido, nenhum bloqueio de acesso a dias futuros. O sistema deve parecer instantâneo para o usuário.

---

## Glossário

- **Log**: Registro de texto livre criado pelo usuário para um dia específico. Armazenado na tabela `logs` do banco de dados.
- **Day View**: A tela acessada via rota `/day/[date]` que exibe todos os logs de um dia e o campo de criação rápida.
- **Quick Capture**: Botão flutuante global (FAB — Floating Action Button) que abre um sheet/modal para criação de log no dia atual, disponível em qualquer tela do app.
- **Quick Capture Sheet**: O sheet/modal aberto pelo Quick Capture para entrada de texto e envio do log.
- **Log Action**: Server Action Next.js responsável por criar, editar ou excluir logs.
- **Day**: Registro na tabela `days` que agrupa os logs de um mesmo dia para um usuário.
- **Optimistic UI**: Atualização imediata da interface antes da confirmação do servidor, revertida em caso de erro.
- **Empty State**: Estado visual exibido quando um dia não possui nenhum log registrado.

---

## Requisitos

### Requisito 1 — Visão do Dia

**User Story:** Como usuário do app, eu quero acessar a visão de um dia específico, para que eu possa ver todos os meus registros daquele dia em um único lugar.

#### Critérios de Aceite

1. WHEN o usuário navega para `/day/[date]`, THE Day View SHALL exibir a lista de todos os logs registrados para aquela data em ordem cronológica crescente de criação.
2. THE Day View SHALL exibir a data do dia selecionado de forma legível (ex: "Segunda, 14 de julho") no cabeçalho da tela.
3. WHEN o dia selecionado é o dia atual, THE Day View SHALL destacar visualmente o cabeçalho da data como "hoje".
4. WHEN o dia selecionado é um dia futuro, THE Day View SHALL exibir normalmente a tela, sem mensagem de bloqueio ou alerta.
5. THE Day View SHALL exibir um campo de entrada de texto para criação de novo log diretamente na tela, sem necessidade de abrir um modal separado.
6. WHILE a lista de logs está sendo carregada do servidor, THE Day View SHALL exibir um indicador de carregamento neutro (ex: skeleton ou spinner) sem exibir estado de erro prematuro.

---

### Requisito 2 — Criação de Log

**User Story:** Como usuário do app, eu quero criar um log de texto livre para um dia, para que eu possa registrar o que aconteceu de forma rápida e sem fricção.

#### Critérios de Aceite

1. WHEN o usuário submete o campo de texto com conteúdo não vazio, THE Log Action SHALL criar um log associado ao dia correto e ao usuário autenticado.
2. THE Log Action SHALL aceitar qualquer texto com comprimento entre 1 e 2000 caracteres como conteúdo válido de log.
3. WHEN o usuário submete o log, THE Day View SHALL atualizar a lista exibindo o novo log imediatamente via Optimistic UI, antes da confirmação do servidor.
4. IF a criação do log falhar no servidor, THEN THE Day View SHALL remover o log otimístico da lista e exibir uma mensagem de erro inline, sem redirecionar o usuário.
5. IF o usuário submete o campo com texto vazio ou contendo apenas espaços em branco, THEN THE Log Action SHALL rejeitar a submissão e THE Day View SHALL exibir uma mensagem de validação sem criar o log.
6. WHEN o log é criado com sucesso, THE Day View SHALL limpar o campo de entrada de texto automaticamente, deixando-o pronto para um novo registro.
7. THE Log Action SHALL criar o registro `Day` correspondente no banco de dados caso ele ainda não exista para a combinação usuário + data.

---

### Requisito 3 — Edição de Log

**User Story:** Como usuário do app, eu quero editar o texto de um log existente, para que eu possa corrigir ou complementar o que registrei anteriormente.

#### Critérios de Aceite

1. WHEN o usuário aciona a opção de editar um log específico, THE Day View SHALL exibir o campo de edição com o conteúdo atual do log pré-preenchido.
2. WHEN o usuário confirma a edição com texto não vazio, THE Log Action SHALL atualizar o conteúdo do log no banco de dados, preservando o `id` e o `dayId` originais.
3. THE Log Action SHALL aceitar qualquer texto com comprimento entre 1 e 2000 caracteres como conteúdo válido para a edição.
4. IF o usuário confirma a edição com texto vazio ou contendo apenas espaços em branco, THEN THE Log Action SHALL rejeitar a atualização e THE Day View SHALL exibir uma mensagem de validação.
5. IF a atualização do log falhar no servidor, THEN THE Day View SHALL restaurar o texto original do log e exibir uma mensagem de erro inline.
6. WHEN a edição é confirmada com sucesso, THE Day View SHALL fechar o campo de edição e exibir o log com o novo conteúdo.
7. IF o usuário cancela a edição sem salvar, THEN THE Day View SHALL descartar as alterações e restaurar o estado anterior sem modificar o banco de dados.

---

### Requisito 4 — Exclusão de Log

**User Story:** Como usuário do app, eu quero excluir um log, para que eu possa remover registros incorretos ou indesejados sem acidente.

#### Critérios de Aceite

1. WHEN o usuário aciona a opção de excluir um log, THE Day View SHALL exibir uma confirmação mínima (ex: "Tem certeza?") antes de executar a exclusão.
2. WHEN o usuário confirma a exclusão, THE Log Action SHALL remover o log do banco de dados e THE Day View SHALL remover o item da lista imediatamente.
3. IF a exclusão falhar no servidor, THEN THE Day View SHALL manter o log na lista e exibir uma mensagem de erro inline.
4. IF o usuário cancela a confirmação de exclusão, THEN THE Log Action SHALL não executar nenhuma operação e THE Day View SHALL manter o log na lista sem alterações.
5. WHEN todos os logs de um dia são excluídos, THE Day View SHALL exibir o Empty State do dia de forma automática, sem recarregar a página inteira.

---

### Requisito 5 — Quick Capture (Captura Instantânea)

**User Story:** Como usuário do app, eu quero capturar um pensamento ou evento rapidamente a partir de qualquer tela, para que eu não perca o registro por estar em outra parte do app.

#### Critérios de Aceite

1. THE Quick Capture Button SHALL estar visível e acessível em todas as telas do grupo de rotas autenticadas `(app)`, exceto quando o Quick Capture Sheet já estiver aberto.
2. WHEN o usuário aciona o Quick Capture Button, THE Quick Capture Sheet SHALL abrir em no máximo 300ms, sobrepondo a tela atual sem navegar para outra rota.
3. WHEN o Quick Capture Sheet é aberto, THE Quick Capture Sheet SHALL posicionar o foco automático no campo de texto, pronto para digitação imediata.
4. WHEN o usuário submete texto não vazio pelo Quick Capture Sheet, THE Log Action SHALL criar o log associado à data do dia atual (não ao dia que o usuário estava visualizando).
5. WHEN o log é criado com sucesso pelo Quick Capture, THE Quick Capture Sheet SHALL fechar automaticamente e THE Quick Capture Button SHALL retornar ao estado visível.
6. IF a criação do log falhar no servidor via Quick Capture, THEN THE Quick Capture Sheet SHALL permanecer aberto e exibir uma mensagem de erro inline, sem fechar o sheet.
7. WHEN o Quick Capture Sheet está aberto e o usuário pressiona Escape ou aciona o controle de fechar, THE Quick Capture Sheet SHALL fechar sem criar nenhum log, mesmo se houver texto não salvo no campo.
8. THE Quick Capture Sheet SHALL criar o registro `Day` correspondente no banco de dados caso ele ainda não exista para a data atual do usuário.

---

### Requisito 6 — Estado Vazio do Dia

**User Story:** Como usuário do app, eu quero ver um estado neutro quando abro um dia sem registros, para que eu não me sinta cobrado ou culpado por não ter registrado nada.

#### Critérios de Aceite

1. WHEN o usuário acessa a Day View de um dia sem nenhum log registrado, THE Day View SHALL exibir o Empty State com uma mensagem neutra e encorajadora (ex: "Nenhum registro ainda. Que tal começar agora?").
2. THE Day View SHALL exibir o campo de criação de log no Empty State, permitindo registro imediato sem ação adicional de navegação.
3. THE Day View SHALL NOT exibir mensagens de cobrança, contagem de dias sem registro, ou qualquer indicação de "falha" no Empty State.
4. WHEN um log é criado a partir do Empty State, THE Day View SHALL substituir o Empty State pela lista de logs sem recarregar a página inteira.
5. THE Day View SHALL exibir o mesmo Empty State neutro para dias passados, dias presentes e dias futuros sem log.

---

### Requisito 7 — Navegação de Volta ao Calendário

**User Story:** Como usuário do app, eu quero voltar ao calendário semanal a partir da visão do dia, para que eu possa ter sempre a visão da semana acessível em uma ação.

#### Critérios de Aceite

1. THE Day View SHALL exibir um controle de navegação de retorno ao calendário semanal visível no cabeçalho ou na barra de navegação superior.
2. WHEN o usuário aciona o controle de retorno ao calendário, THE Day View SHALL navegar de volta para a rota `/week/[weekStart]` da semana que contém o dia visualizado, em no máximo 1 ação (1 clique/tap).
3. THE Day View SHALL calcular o `weekStart` correto baseado na data do dia visualizado, garantindo que o retorno seja sempre para a semana correspondente.
4. WHEN o usuário navega de volta ao calendário, THE Weekly Calendar SHALL restaurar o estado da semana sem perda de contexto (ex: posição de scroll, semana visualizada).

---

### Requisito 8 — Validação e Persistência de Dados

**User Story:** Como desenvolvedor do app, eu quero que os dados de log sejam validados e persistidos de forma confiável, para que a integridade dos registros do usuário seja garantida.

#### Critérios de Aceite

1. THE Log Action SHALL validar o payload de entrada utilizando um schema Zod antes de executar qualquer operação no banco de dados.
2. THE Log Action SHALL aceitar como entrada válida: `content` (string, 1–2000 caracteres), `date` (string no formato `yyyy-MM-dd`), e `logId` (uuid, apenas para edição e exclusão).
3. IF o payload de entrada for inválido (tipos incorretos, campos ausentes, comprimentos fora do limite), THEN THE Log Action SHALL retornar um objeto de erro estruturado com os campos inválidos identificados, sem executar operações no banco.
4. THE Log Action SHALL garantir que um log só pode ser criado, editado ou excluído pelo usuário autenticado que é o dono do `Day` correspondente.
5. THE Log Action SHALL utilizar a tabela `logs` e a tabela `days` conforme o schema Drizzle definido em `drizzle/schema.ts`, sem criar novas tabelas.

---

## Fora de Escopo

- Registro de humor/mood (spec separada futura).
- Tags ou categorização de logs (Fase 3).
- Busca entre logs (Fase 3).
- Lembretes (spec separada: `reminder-system`).
- Autenticação e multi-usuário (spec separada: `auth`).
