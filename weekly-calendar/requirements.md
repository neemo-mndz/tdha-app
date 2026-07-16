# Requirements — Weekly Calendar (Core)

## Contexto

O calendário semanal é a tela principal do produto. Todo usuário, ao abrir o app, deve cair diretamente nesta tela. Ver `product.md` (steering) para princípios de design que restringem esta feature: sem culpa/streaks, ação central em <10s, calendário como UI central.

---

## User Story 1 — Visualizar a semana atual

**Como** usuário do app,
**Eu quero** ver minha semana atual assim que abro o app,
**Para que** eu tenha consciência imediata de onde estou na semana, sem precisar navegar.

### Critérios de aceite (EARS)

1. QUANDO o usuário abre o app, O SISTEMA DEVE exibir a semana corrente como tela inicial, sem etapas intermediárias de navegação.
2. O SISTEMA DEVE exibir os 7 dias da semana atual em uma única visualização, sem necessidade de scroll horizontal em viewport desktop padrão (≥1024px).
3. QUANDO a visualização é exibida, O SISTEMA DEVE destacar visualmente o dia atual de forma distinta dos demais dias.
4. O SISTEMA DEVE definir o início da semana de forma configurável (padrão: segunda-feira), sem exigir configuração do usuário no MVP.
5. SE o usuário estiver em uma semana diferente da atual (ex: navegou para o passado), ENTÃO O SISTEMA DEVE exibir um controle único e visível para retornar à semana atual.

---

## User Story 2 — Navegar entre semanas

**Como** usuário do app,
**Eu quero** navegar para semanas passadas ou futuras,
**Para que** eu possa relembrar o que aconteceu ou planejar adiante, sem me sentir preso à semana atual.

### Critérios de aceite (EARS)

1. QUANDO o usuário aciona "semana anterior" ou "próxima semana", O SISTEMA DEVE atualizar a visualização para a semana correspondente em no máximo 1 interação (1 tap/clique).
2. O SISTEMA DEVE preservar a URL da semana visualizada (rota dinâmica por data de início da semana), permitindo deep-linking e retorno via botão "voltar" do navegador.
3. QUANDO o usuário navega para uma semana sem nenhum log registrado, O SISTEMA NÃO DEVE exibir nenhuma mensagem de "falha", cobrança ou alerta negativo — apenas o estado vazio neutro.

---

## User Story 3 — Ver o status de cada dia de relance

**Como** usuário do app,
**Eu quero** ver rapidamente quais dias têm registros e um resumo mínimo de cada um,
**Para que** eu tenha uma leitura da semana em segundos, sem abrir cada dia individualmente.

### Critérios de aceite (EARS)

1. QUANDO um dia possui pelo menos um log, O SISTEMA DEVE exibir um indicador visual de presença de log naquele dia (ex: um marcador/dot).
2. SE o dia possui um input de humor (mood) registrado, ENTÃO O SISTEMA DEVE exibir um indicador de humor visualmente distinto por dia (ex: cor ou ícone), de forma opcional e não obrigatória.
3. O SISTEMA DEVE exibir um resumo mínimo por dia (ex: contagem de logs) sem exigir abertura da visão do dia.
4. O SISTEMA NÃO DEVE exibir contadores de "dias sem log consecutivos" nem qualquer métrica que induza culpa.

---

## User Story 4 — Abrir um dia específico

**Como** usuário do app,
**Eu quero** clicar em um dia do calendário,
**Para que** eu veja e adicione logs daquele dia especificamente.

### Critérios de aceite (EARS)

1. QUANDO o usuário clica em uma célula de dia, O SISTEMA DEVE navegar para a visão do dia correspondente em uma única ação (1 clique/tap).
2. O SISTEMA DEVE manter a navegação de volta ao calendário semanal acessível em 1 ação a partir da visão do dia.
3. QUANDO o dia clicado é um dia futuro, O SISTEMA DEVE permitir a visualização (ex: para lembretes futuros) sem bloquear o acesso.

---

## Fora de escopo nesta spec

- Lógica de criação/edição de logs (spec separada: `daily-log-system`).
- Captura instantânea via floating action button (spec separada: `instant-capture`).
- Lembretes (spec separada: `reminder-system`).
- Overview semanal agregado com tendências de humor (spec separada: `weekly-overview`).
