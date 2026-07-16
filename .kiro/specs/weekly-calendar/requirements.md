# Requirements Document

## Introduction

O Weekly Calendar é a tela principal do produto Weekly Companion. Ao abrir o app, o usuário vê imediatamente a semana corrente: sete dias exibidos em grade, cada um comunicando seu estado de forma rápida — presença de logs, humor do dia, contagem mínima. O usuário pode navegar entre semanas sem atrito e acessar qualquer dia com um único toque.

Esta spec cobre exclusivamente a visualização e navegação semanal. Criação e edição de logs, captura instantânea, lembretes e o overview semanal agregado pertencem a specs separadas.

---

## Glossary

- **Sistema**: a aplicação Weekly Companion (frontend Next.js + backend Neon PostgreSQL).
- **Calendário_Semanal** (`WeeklyCalendar`): Server Component responsável por renderizar a grade de sete dias da semana exibida.
- **Célula_do_Dia** (`DayCell`): Client Component que representa um único dia na grade; é um link navegável para a visão do dia.
- **Navegador_de_Semana** (`WeekNavigator`): Client Component com os controles de navegação entre semanas (anterior, próxima, hoje).
- **Início_de_Semana** (`weekStart`): data ISO (`YYYY-MM-DD`) correspondente à segunda-feira que inaugura uma semana exibida.
- **DayStatus**: tipo de dados com `date`, `logCount` e `mood` para um único dia, retornado pela query de banco.
- **MoodValue**: enumeração de valores válidos de humor — `great`, `good`, `neutral`, `bad`, `awful`.
- **Log**: registro de texto vinculado a um dia específico (criação e edição pertencem à spec `daily-log-system`).
- **Semana_Atual**: a semana cujo `weekStart` é igual ao `currentWeekStart(now)` derivado no servidor.
- **Dia_Atual**: a data de hoje derivada no servidor e passada via props para os componentes cliente.
- **Estado_Vazio**: estado de um dia ou semana sem nenhum log registrado — não é tratado como falha.
- **deep-link**: URL estável da forma `/week/YYYY-MM-DD` que torna cada semana bookmarkável e navegável pelo histórico do browser.

---

## Requirements

### Requisito 1 — Visualizar a semana atual

**User Story:** Como usuário do app, eu quero ver minha semana atual assim que abro o app, para que eu tenha consciência imediata de onde estou na semana, sem precisar navegar.

#### Critérios de aceite

1. QUANDO o usuário acessa a rota `/`, O Sistema DEVE exibir o `Calendário_Semanal` da `Semana_Atual` como conteúdo principal, sem etapas intermediárias de navegação ou redirects HTTP visíveis ao usuário.
2. O `Calendário_Semanal` DEVE exibir exatamente 7 `Células_do_Dia` para qualquer `Início_de_Semana` válido, com todas as células simultaneamente visíveis no viewport sem acionamento de scroll horizontal, em viewport com largura ≥ 1024px.
3. QUANDO o `Calendário_Semanal` é renderizado, O Sistema DEVE aplicar estilo visual distinto (ex: ring/highlight) e o atributo `aria-current="date"` à `Célula_do_Dia` cujo `date` é igual ao `Dia_Atual`, diferenciando-a visualmente e semanticamente de todas as demais células da grade.
4. O Sistema DEVE fixar o `Início_de_Semana` como segunda-feira (valor padrão não configurável no MVP), derivando esse valor no servidor via `currentWeekStart()` sem depender do clock do cliente.
5. SE o `Navegador_de_Semana` está exibindo uma semana cujo `Início_de_Semana` é diferente do `currentWeekStart(hoje)`, ENTÃO O `Navegador_de_Semana` DEVE renderizar um controle visível (botão ou link "hoje") para retornar à `Semana_Atual` em uma única ação. SE o `Início_de_Semana` exibido é igual ao `currentWeekStart(hoje)`, ENTÃO esse controle NÃO DEVE ser renderizado.
6. IF o parâmetro `weekStart` da rota `/week/[weekStart]` não for uma data ISO válida ou não corresponder a uma segunda-feira, THEN O Sistema DEVE retornar HTTP 404, sem expor detalhes técnicos internos ao usuário.

---

### Requisito 2 — Navegar entre semanas

**User Story:** Como usuário do app, eu quero navegar para semanas passadas ou futuras, para que eu possa relembrar o que aconteceu ou planejar adiante, sem me sentir preso à semana atual.

#### Critérios de aceite

1. QUANDO o usuário aciona o controle "semana anterior" ou "próxima semana", O `Navegador_de_Semana` DEVE atualizar a visualização para a semana correspondente em no máximo 1 interação (1 tap ou clique), produzindo um `Início_de_Semana` que difere do atual em exatamente ±7 dias e navegando para a URL correspondente.
2. O Sistema DEVE atribuir uma URL estável e cacheável a cada semana no formato `/week/YYYY-MM-DD` (onde `YYYY-MM-DD` é o `Início_de_Semana`), de forma que cada semana seja bookmarkável, compartilhável, e acessível pelo botão "voltar" do browser via histórico de navegação empilhado.
3. QUANDO o usuário navega para uma semana cujo `Estado_Vazio` é total (nenhum log em nenhum dos 7 dias), O `Calendário_Semanal` DEVE renderizar exatamente 7 `Células_do_Dia` no estado neutro, sem exibir mensagens de falha, cobranças, alertas negativos ou contadores de culpa.
4. WHEN a busca de dados da semana falha (ex: timeout ou conexão perdida), THE Sistema DEVE exibir uma tela de erro genérica com um botão "tentar novamente" que permite recarregar a rota, sem expor mensagens ou stack traces técnicos ao usuário.
5. O Sistema NÃO DEVE impor limites de navegação temporal — semanas passadas e futuras DEVEM ser igualmente acessíveis via os controles de navegação.

---

### Requisito 3 — Ver o status de cada dia de relance

**User Story:** Como usuário do app, eu quero ver rapidamente quais dias têm registros e um resumo mínimo de cada um, para que eu tenha uma leitura da semana em segundos, sem abrir cada dia individualmente.

#### Critérios de aceite

1. IF uma `Célula_do_Dia` recebe `logCount > 0`, THEN O Sistema DEVE renderizar um indicador visual de presença de log (ex: dot ou marcador) naquela célula. IF `logCount = 0`, THEN O Sistema NÃO DEVE renderizar nenhum indicador de log naquela célula.
2. IF uma `Célula_do_Dia` recebe `mood` com valor válido de `MoodValue` (`great`, `good`, `neutral`, `bad` ou `awful`), THEN O Sistema DEVE renderizar um indicador de humor distinto para aquele valor específico de `MoodValue`, independentemente do valor de `logCount`. IF `mood` é `null`, THEN O Sistema NÃO DEVE renderizar nenhum indicador de humor naquela célula.
3. O `Calendário_Semanal` DEVE exibir o valor numérico de `logCount` em cada `Célula_do_Dia`, correspondente ao valor recebido via props; para `logCount` ≥ 100, O Sistema DEVE exibir "99+" como representação visual.
4. O `Calendário_Semanal` DEVE buscar os dados de todas as 7 células (data, `logCount`, `mood`) em uma única viagem ao banco via `getWeekStatus`, retornando exatamente 7 linhas mesmo para dias sem registro.
5. O Sistema NÃO DEVE exibir contadores de "dias sem log consecutivos", streaks, badges de falha, nem qualquer métrica que induza culpa, para qualquer combinação de `DayStatus` recebida (semanas vazias, parciais ou completas).

---

### Requisito 4 — Abrir um dia específico

**User Story:** Como usuário do app, eu quero clicar em um dia do calendário, para que eu veja e adicione logs daquele dia especificamente.

#### Critérios de aceite

1. WHEN o usuário clica ou toca em uma `Célula_do_Dia`, O Sistema DEVE navegar para a visão do dia correspondente em uma única ação (1 clique ou tap), via elemento navegável com `href` no formato `/day/YYYY-MM-DD` correspondente àquela data.
2. WHILE o usuário está na visão do dia (`/day/[date]`), O Sistema DEVE manter visível e acessível um controle de retorno ao `Calendário_Semanal` que permita retornar em 1 ação, sem precisar usar o botão "voltar" do browser.
3. WHEN o dia clicado corresponde a uma data futura, O Sistema DEVE permitir a navegação para a visão daquele dia sem bloquear, desabilitar (`aria-disabled`) ou ocultar a `Célula_do_Dia`, renderizando-a como elemento navegável funcional.
4. IF a URL `/day/[date]` contém um parâmetro `date` que não é uma data ISO válida, THEN O Sistema DEVE retornar HTTP 404, sem expor detalhes técnicos internos ao usuário.

---

## Fora de escopo nesta spec

- Criação, edição e exclusão de logs (spec separada: `daily-log-system`).
- Captura instantânea via floating action button (spec separada: `instant-capture`).
- Lembretes e notificações (spec separada: `reminder-system`).
- Overview semanal agregado com tendências de humor (spec separada: `weekly-overview`).
- Autenticação e gerenciamento de sessão de usuário.
- Renderização visual pixel-perfect e testes de regressão visual.
