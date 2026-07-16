# Requirements Document

## Introduction

Este documento especifica os requisitos do **Companheiro de Leitura** — o primeiro utilitário do produto **semana.**, um app de suporte cognitivo para pessoas com TDAH.

O Companheiro de Leitura permite ao usuário acompanhar sua leitura de forma leve e sem pressão: registrar um livro atual, marcar dias em que leu, anotar impressões soltas e concluir livros com uma resenha opcional. A funcionalidade segue o padrão estrutural já estabelecido no produto (biblioteca → seleção ativa → progresso → conclusão), aplicado ao domínio de leitura.

O módulo vive na rota `/reading` dentro do grupo `(app)` protegido por autenticação. O schema de banco é aditivo (novas tabelas apenas, sem alterações destrutivas em tabelas existentes). O wireframe `reading_wireframe.html` serve como referência visual e comportamental.

Princípio central: **nenhuma mecânica de cobrança, pressão ou culpa**. Campos opcionais nunca bloqueiam ações principais. Toda ação central é executável em poucos segundos.

---

## Glossary

- **Sistema**: o aplicativo **semana.** como um todo, incluindo o módulo Companheiro de Leitura.
- **Companheiro_de_Leitura**: módulo utilitário responsável por gerenciar livros, registros de leitura, notas e conclusões.
- **Usuário_Autenticado**: pessoa que possui sessão ativa e válida no Sistema.
- **Livro_Atual**: único livro que o Usuário_Autenticado está lendo no momento; no máximo 1 por usuário.
- **Fila_de_Livros**: lista de livros que o usuário pretende ler futuramente, sem prazo ou pressão.
- **Livro_Concluído**: livro que foi marcado como concluído pelo usuário, acompanhado opcionalmente de avaliação e resenha.
- **Registro_de_Leitura**: marcação de que o usuário leu em determinada data, associada ao Livro_Atual.
- **Nota_de_Leitura**: texto livre associado ao Livro_Atual, representando uma impressão, reação ou pensamento solto.
- **Mini_Calendário_Semanal**: visualização compacta de 7 dias mostrando quais dias tiveram Registro_de_Leitura para o Livro_Atual.
- **Campo_de_Progresso**: campo de texto livre opcional para o usuário indicar onde está no livro (ex: "pág. 120", "40%", "cap. 5").
- **Avaliação**: indicador opcional de sentimento sobre o livro concluído (emoji ou nota).
- **Resenha**: texto livre opcional associado a um Livro_Concluído.

---

## Requirements

### Requirement 1: Livro Atual — Exibição e Unicidade

**User Story:** Como usuário, eu quero ter um único livro marcado como "atual", para que eu tenha um ponto de foco sem a sobrecarga de gerenciar uma estante inteira.

#### Acceptance Criteria

1. O Companheiro_de_Leitura DEVE permitir no máximo 1 Livro_Atual por Usuário_Autenticado a qualquer momento.
2. QUANDO o Usuário_Autenticado possui um Livro_Atual, O Sistema DEVE exibir título, autor e o Campo_de_Progresso do livro na área principal da tela de leitura.
3. QUANDO nenhum Livro_Atual está definido para o Usuário_Autenticado, O Sistema DEVE exibir um estado vazio com convite para escolher um livro da Fila_de_Livros ou adicionar um novo livro.
4. O Campo_de_Progresso DEVE aceitar texto livre com no máximo 50 caracteres e DEVE ser editável a qualquer momento sem bloquear outras ações na tela.
5. O Campo_de_Progresso DEVE ser opcional; o Sistema DEVE permitir todas as ações sobre o Livro_Atual (marcar leitura, criar nota, concluir) independentemente do preenchimento do Campo_de_Progresso.

---

### Requirement 2: Marcar Leitura do Dia

**User Story:** Como usuário, eu quero marcar rapidamente que li hoje, para que a ação leve menos de 10 segundos e não exija nenhum detalhe adicional.

#### Acceptance Criteria

1. QUANDO o Usuário_Autenticado possui um Livro_Atual e o dia corrente não possui Registro_de_Leitura, O Sistema DEVE exibir um botão com o texto "Marquei que li hoje" que registra a data corrente como lida em uma única ação.
2. QUANDO o dia corrente já possui Registro_de_Leitura para o Livro_Atual, O Sistema DEVE exibir o botão no estado "✓ Lido hoje" e DEVE permitir desmarcar o registro com uma única ação (comportamento de toggle para toques acidentais).
3. O Companheiro_de_Leitura DEVE exibir um Mini_Calendário_Semanal mostrando os 7 dias da semana corrente com indicação visual de quais dias possuem Registro_de_Leitura para o Livro_Atual.
4. QUANDO o Usuário_Autenticado clica em um dia passado no Mini_Calendário_Semanal, O Sistema DEVE permitir marcar ou desmarcar o Registro_de_Leitura daquele dia de forma retroativa, sem exibir alertas de atraso ou mensagens negativas.
5. O Sistema DEVE registrar no máximo 1 Registro_de_Leitura por dia por Livro_Atual (sem duplicatas para a mesma data e livro).
6. IF o Usuário_Autenticado tenta marcar leitura sem possuir um Livro_Atual, THEN O Sistema DEVE orientar o usuário a selecionar ou adicionar um livro antes de registrar leitura.

---

### Requirement 3: Notas Rápidas durante a Leitura

**User Story:** Como usuário, eu quero anotar pensamentos soltos sobre o livro a qualquer momento, para que eu não perca reações e impressões sem que isso seja uma obrigação por dia lido.

#### Acceptance Criteria

1. QUANDO o Usuário_Autenticado possui um Livro_Atual, O Sistema DEVE permitir criar uma Nota_de_Leitura contendo texto livre com no mínimo 1 e no máximo 1000 caracteres, associada ao Livro_Atual.
2. A criação de Nota_de_Leitura DEVE ser independente do Registro_de_Leitura; o Sistema DEVE permitir criar notas em dias sem marcação de leitura e DEVE permitir marcar leitura sem criar notas.
3. O Companheiro_de_Leitura DEVE exibir as Notas_de_Leitura do Livro_Atual em ordem cronológica reversa (mais recente primeiro), cada uma com a data de criação e o texto.
4. QUANDO o Usuário_Autenticado cria uma Nota_de_Leitura, O Sistema DEVE registrar automaticamente a data e hora de criação sem exigir que o usuário informe a data manualmente.
5. O Sistema DEVE permitir excluir uma Nota_de_Leitura existente, solicitando confirmação antes da remoção.

---

### Requirement 4: Concluir Livro com Resenha

**User Story:** Como usuário, eu quero marcar um livro como concluído e escrever uma resenha final, para ter um registro de encerramento sem precisar avaliar todos os dias.

#### Acceptance Criteria

1. QUANDO o Usuário_Autenticado aciona "Concluí o livro" no Livro_Atual, O Sistema DEVE apresentar uma interface com campos opcionais para Avaliação (emoji ou nota) e Resenha (texto livre com no máximo 2000 caracteres).
2. QUANDO o Usuário_Autenticado confirma a conclusão, O Companheiro_de_Leitura DEVE mover o livro para a lista de Livros_Concluídos e DEVE liberar o slot de Livro_Atual, retornando a tela ao estado vazio.
3. IF o Usuário_Autenticado confirma a conclusão sem preencher Avaliação ou Resenha, THEN O Sistema DEVE proceder com a conclusão normalmente, tratando ambos os campos como opcionais.
4. O Companheiro_de_Leitura DEVE exibir a lista de Livros_Concluídos com título, autor e Resenha (quando existente) em ordem cronológica reversa (conclusão mais recente primeiro).
5. QUANDO o livro é movido para Livros_Concluídos, O Sistema DEVE preservar todas as Notas_de_Leitura e Registros_de_Leitura associados ao livro para consulta futura.
6. O Sistema DEVE registrar automaticamente a data de conclusão do livro sem exigir preenchimento manual pelo usuário.

---

### Requirement 5: Fila de Próximos Livros

**User Story:** Como usuário, eu quero manter uma lista de livros que pretendo ler, para que eu não esqueça essas intenções sem sentir pressão de começá-los.

#### Acceptance Criteria

1. O Companheiro_de_Leitura DEVE permitir adicionar um livro à Fila_de_Livros informando no mínimo o título (campo de texto com no mínimo 1 e no máximo 200 caracteres); o campo de autor DEVE ser opcional (no máximo 200 caracteres quando preenchido).
2. O Companheiro_de_Leitura DEVE permitir remover um livro da Fila_de_Livros a qualquer momento, solicitando confirmação antes da remoção.
3. QUANDO o Usuário_Autenticado aciona "Começar a ler" em um livro da Fila_de_Livros e nenhum Livro_Atual está definido, O Companheiro_de_Leitura DEVE promover o livro para Livro_Atual, removendo-o da Fila_de_Livros.
4. QUANDO o Usuário_Autenticado aciona "Começar a ler" em um livro da Fila_de_Livros e já existe um Livro_Atual, O Sistema DEVE solicitar confirmação antes de substituir, informando que o livro atual será devolvido à Fila_de_Livros.
5. QUANDO o Usuário_Autenticado confirma a substituição do Livro_Atual por um livro da fila, O Companheiro_de_Leitura DEVE devolver o Livro_Atual anterior à Fila_de_Livros (preservando seus Registros_de_Leitura e Notas_de_Leitura existentes) e DEVE promover o livro selecionado para Livro_Atual.
6. O Sistema NÃO DEVE exibir métricas de "tempo na fila", indicadores de atraso ou qualquer informação que gere pressão para iniciar a leitura de livros na Fila_de_Livros.
7. O Companheiro_de_Leitura DEVE exibir os livros na Fila_de_Livros com título e autor (quando informado), em ordem de adição (mais antigo primeiro).

---

### Requirement 6: Adicionar Novo Livro Diretamente como Atual

**User Story:** Como usuário, eu quero adicionar um livro e já começar a lê-lo sem passar pela fila, para que o fluxo de iniciar uma leitura tenha fricção mínima.

#### Acceptance Criteria

1. QUANDO nenhum Livro_Atual está definido, O Sistema DEVE permitir ao Usuário_Autenticado adicionar um novo livro diretamente como Livro_Atual, informando no mínimo o título (no mínimo 1 e no máximo 200 caracteres) e opcionalmente o autor (no máximo 200 caracteres).
2. QUANDO já existe um Livro_Atual e o Usuário_Autenticado adiciona um novo livro diretamente como atual, O Sistema DEVE solicitar confirmação antes de substituir, informando que o livro atual será devolvido à Fila_de_Livros.
3. QUANDO a substituição é confirmada, O Companheiro_de_Leitura DEVE devolver o Livro_Atual anterior à Fila_de_Livros (preservando Registros_de_Leitura e Notas_de_Leitura existentes) e DEVE definir o novo livro como Livro_Atual.

---

### Requirement 7: Proteção de Dados e Autorização

**User Story:** Como usuário, eu quero que meus dados de leitura sejam acessíveis apenas pela minha conta, para que ninguém veja minhas anotações pessoais.

#### Acceptance Criteria

1. O Companheiro_de_Leitura DEVE residir na rota `/reading` dentro do grupo `(app)` protegido por autenticação; o acesso DEVE exigir sessão ativa válida conforme o Auth_Service existente.
2. O Sistema DEVE incluir filtro por userId da sessão ativa em toda query de leitura e em toda operação de escrita referente a livros, registros de leitura, notas e conclusões, de modo que nenhuma query retorne ou modifique registros de outro usuário.
3. IF um Usuário_Autenticado tenta acessar ou modificar um recurso de leitura cujo userId não corresponde ao seu próprio, THEN O Sistema DEVE rejeitar a operação sem revelar a existência do recurso.
4. O schema de banco de dados para o Companheiro_de_Leitura DEVE ser inteiramente aditivo: tabelas novas prefixadas pelo domínio (ex: `books`, `book_reading_logs`, `book_notes`), sem alteração destrutiva em tabelas existentes (`users`, `days`, `logs`, `tasks`, `week_plans`, `week_plan_tasks`, `reminders`, `sessions`, `login_attempts`).

---

## Fora de escopo

- Múltiplos livros ativos em paralelo (decisão de produto: 1 atual + fila).
- Integração visual com o card "Registros de hoje" do calendário principal (spec futura).
- Metas de leitura (páginas/dia, prazos) — excluído por design para evitar mecânicas de pressão.
- Categorias/gêneros, resenhas públicas, compartilhamento social.
- Busca por livros via API externa (ISBN, Google Books, etc.).
- Edição de Livros_Concluídos após a conclusão (iteração futura).
- Reordenação manual da Fila_de_Livros (iteração futura).
