# Requirements Document

## Introduction

Esta spec cobre as features centrais do MVP do **semana.**, um app de registro diário e acompanhamento semanal para pessoas com TDAH. O objetivo é oferecer um sistema de suporte cognitivo com fricção mínima, sem mecânicas de cobrança ou culpa.

As features do calendário semanal (visualizar semana, navegar entre semanas, ver status dos dias, abrir um dia) estão especificadas separadamente em `weekly-calendar/requirements.md` e **não são duplicadas aqui**.

Esta spec cobre:
1. Sistema de logs diários
2. Captura instantânea (FAB + modal)
3. Saudação dinâmica e header contextual
4. Biblioteca de tarefas
5. Plano semanal de tarefas
6. Contadores de tarefas semanais
7. Lembretes básicos

---

## Glossary

- **Sistema**: o aplicativo **semana.** como um todo.
- **Log**: registro de texto livre criado pelo usuário para um dia específico, com timestamp automático.
- **Dia**: unidade atômica de dado; o container de todos os logs de uma data específica.
- **Semana**: agregado derivado de 7 dias consecutivos; nunca preenchida diretamente pelo usuário.
- **Captura_Instantânea**: log criado via FAB sem necessidade de estruturação prévia.
- **Biblioteca_de_Tarefas**: coleção persistente de templates de tarefas reutilizáveis entre semanas.
- **Tarefa**: template da biblioteca que representa uma atividade recorrente com quantidade padrão.
- **Plano_Semanal**: subconjunto ativo da Biblioteca_de_Tarefas ativado para uma semana específica, com meta de quantidade configurável.
- **Contador**: campo numérico `feito/meta` associado a cada tarefa do Plano_Semanal; informativo, nunca punitivo.
- **Bump**: incremento manual do Contador via toque direto, sem criar um Log.
- **Lembrete**: notificação agendada por horário configurada pelo usuário.
- **FAB**: Floating Action Button — botão de ação flutuante fixo na tela.
- **Chip_de_Tarefa**: elemento de seleção na interface de criação de log para vincular o log a uma tarefa.

---

## Requirements

### Requirement 1 — Sistema de Logs Diários

**User Story:** Como usuário do app, eu quero registrar o que aconteceu no meu dia em texto livre, para que eu tenha um histórico consultável sem precisar organizar o pensamento antes de escrever.

#### Acceptance Criteria

1. QUANDO o usuário submete um texto não-vazio (ignorando espaços em branco isolados) no campo de registro do dia, O Sistema DEVE criar um Log associado à data do dia corrente no fuso horário local do navegador, com o texto informado e um timestamp no formato `HH:MM` baseado no horário local do dispositivo no momento da criação.
2. O Sistema DEVE exibir os Logs do dia selecionado em ordem cronológica crescente (do mais antigo ao mais recente); QUANDO um dia contém mais de 50 Logs, O Sistema DEVE exibir os 50 mais recentes e disponibilizar um controle para carregar Logs anteriores sem recarregar a página.
3. QUANDO o usuário submete um Log cujo campo de texto contém apenas espaços em branco ou está vazio, O Sistema DEVE ignorar a submissão sem exibir mensagem de erro e sem limpar o conteúdo do campo.
4. O Sistema DEVE aceitar texto livre com até 2000 caracteres por Log; QUANDO o usuário tenta submeter um Log com mais de 2000 caracteres, O Sistema DEVE rejeitar a submissão, preservar o texto no campo e exibir um indicador não-modal informando o limite de caracteres.
5. QUANDO um Log é criado com sucesso, O Sistema DEVE limpar o campo de texto e reposicionar o foco no campo para permitir novo registro imediato.
6. QUANDO um Log é criado para um dia que ainda não possuía registros, O Sistema DEVE atualizar o indicador visual daquele dia no calendário semanal sem necessidade de recarregar a página.
7. IF o salvamento de um Log falhar por erro de rede, THEN O Sistema DEVE exibir um aviso inline não-modal abaixo do campo de texto, preservar o texto digitado no campo e não fechar nem redirecionar a tela.
8. QUANDO um Log é exibido na lista de logs do dia, O Sistema DEVE mostrar o timestamp e o texto do Log; SE o Log tiver uma Tarefa vinculada, ENTÃO O Sistema DEVE exibir o nome da Tarefa como um marcador visual distinto ao lado do texto.
9. O Sistema NÃO DEVE exibir em nenhuma tela de logs: contadores de dias sem registro, mensagens de cobrança, indicadores de "sequência quebrada" ou qualquer métrica que comunique ausência de atividade de forma negativa.

---

### Requirement 2 — Captura Instantânea

**User Story:** Como usuário do app, eu quero capturar um pensamento ou acontecimento rapidamente sem precisar decidir a qual dia pertence, para que eu não perca o registro por excesso de fricção no momento da captura.

#### Acceptance Criteria

1. O Sistema DEVE exibir um FAB fixo e sempre visível no canto inferior direito da tela, independentemente da tela ativa.
2. QUANDO o usuário aciona o FAB, O Sistema DEVE abrir o modal de Captura_Instantânea em menos de 300ms, sem navegar para outra página.
3. QUANDO o modal de Captura_Instantânea é aberto, O Sistema DEVE posicionar o foco automaticamente no campo de texto.
4. QUANDO o usuário submete a Captura_Instantânea com texto não-vazio (conteúdo com ao menos um caractere que não seja espaço em branco), O Sistema DEVE criar um Log associado à data do dia corrente no fuso horário local do navegador, com timestamp `HH:MM` local, e fechar o modal.
5. QUANDO o usuário submete a Captura_Instantânea com campo vazio ou contendo apenas espaços em branco, O Sistema DEVE ignorar a submissão sem fechar o modal e sem exibir mensagem de erro.
6. QUANDO o usuário aciona "Cancelar" no modal de Captura_Instantânea, O Sistema DEVE fechar o modal sem salvar nenhum dado e preservar qualquer estado da tela anterior.
7. WHEN o usuário clica fora do modal de Captura_Instantânea (no backdrop), THE Sistema SHALL fechar o modal sem salvar nenhum dados.
8. IF a submissão da Captura_Instantânea falhar por erro de rede, THEN O Sistema DEVE exibir um aviso inline dentro do modal sem fechá-lo, preservar o texto digitado no campo e não tentar reenviar automaticamente mais de uma vez.
9. O fluxo completo de captura — abrir FAB, digitar um texto de até 50 caracteres e salvar — DEVE ser concluído em menos de 10 segundos em condições normais de rede.

---

### Requirement 3 — Saudação Dinâmica e Header Contextual

**User Story:** Como usuário do app, eu quero ver uma saudação contextualizada ao período do dia e informações temporais relevantes ao abrir o app, para que eu tenha orientação imediata sobre onde estou no tempo sem esforço cognitivo.

#### Acceptance Criteria

1. QUANDO o usuário visualiza a tela principal, O Sistema DEVE exibir uma saudação textual determinada pelo horário local do dispositivo: "Bom dia" para 00:00–11:59, "Boa tarde" para 12:00–17:59, e "Boa noite" para 18:00–23:59.
2. QUANDO o usuário visualiza a tela principal, O Sistema DEVE exibir o nome do dia da semana por extenso e a data no formato `[dia da semana], [número do dia] de [mês por extenso]` em português (pt-BR), calculados a partir da data local do dispositivo.
3. O Sistema DEVE exibir imediatamente abaixo do título de saudação o subtítulo fixo em português: "Seu espaço para registrar o dia, sem pressão."
4. QUANDO o usuário visualiza o header da tela principal, O Sistema DEVE exibir um badge com o número de dias restantes no mês corrente no formato "faltam N dias no mês", onde N é calculado como `(último dia do mês) − (dia atual)`, excluindo o dia atual da contagem.
5. WHEN a data local do dispositivo for o último dia do mês (N = 0), THE Sistema SHALL exibir "último dia do mês" no badge do header, substituindo o formato numérico.
6. WHEN a tela principal permanece aberta e o horário local do dispositivo cruza uma fronteira de período (ex: 11:59 → 12:00) ou a data muda (meia-noite), THE Sistema SHALL atualizar a saudação e o badge de dias restantes em no máximo 60 segundos após a transição, sem recarregar a página.
7. WHEN o usuário retoma o app a partir do background após uma mudança de data ou período, THE Sistema SHALL exibir a saudação e o badge já atualizados na primeira renderização visível da tela principal.

---

### Requirement 4 — Biblioteca de Tarefas

**User Story:** Como usuário do app, eu quero criar e gerenciar uma coleção de tarefas recorrentes reutilizáveis, para que eu possa ativá-las para diferentes semanas sem precisar redigitá-las toda vez.

#### Acceptance Criteria

1. O Sistema DEVE manter uma Biblioteca_de_Tarefas persistente, independente de qualquer semana específica, cujos dados sobrevivam ao fechamento e reabertura do app.
2. QUANDO o usuário adiciona uma nova Tarefa à Biblioteca_de_Tarefas informando nome e quantidade padrão, O Sistema DEVE criar o registro e exibi-lo na lista da biblioteca em até 1 segundo.
3. IF o usuário tenta adicionar uma Tarefa com nome vazio ou contendo apenas espaços em branco, THEN O Sistema DEVE manter o foco no campo de nome sem criar o registro e sem exibir mensagem de erro.
4. O Sistema DEVE aceitar nomes de Tarefa com até 100 caracteres; QUANDO o usuário digita o 101º caractere no campo de nome, O Sistema DEVE bloquear a entrada desse caractere.
5. O Sistema DEVE aceitar quantidade padrão de Tarefa como número inteiro entre 1 e 99; QUANDO o usuário informa um valor fora desse intervalo no campo de quantidade, O Sistema DEVE redefinir o campo para o valor limite mais próximo (1 ou 99) antes de salvar.
6. QUANDO o usuário edita o nome de uma Tarefa existente na Biblioteca_de_Tarefas, O Sistema DEVE atualizar o nome na biblioteca sem alterar o Plano_Semanal de semanas em que a tarefa já foi ativada.
7. QUANDO o usuário edita a quantidade padrão de uma Tarefa existente na Biblioteca_de_Tarefas, O Sistema DEVE atualizar o valor padrão na biblioteca sem alterar a meta do Plano_Semanal de semanas em que a tarefa já foi ativada.
8. QUANDO o usuário aciona "remover" em uma Tarefa da Biblioteca_de_Tarefas, O Sistema DEVE solicitar confirmação antes de excluir; QUANDO a exclusão é confirmada, O Sistema DEVE remover o registro da biblioteca sem alterar o Plano_Semanal de semanas em que a tarefa já foi ativada.
9. O Sistema DEVE exibir a Biblioteca_de_Tarefas no modal "Editar tarefas", acessível a partir do painel de tarefas da semana na tela principal.
10. IF a Biblioteca_de_Tarefas estiver vazia, THEN O Sistema DEVE exibir uma mensagem neutra informando que nenhuma tarefa foi criada ainda, sem cobrança ou incentivo negativo.

---

### Requirement 5 — Plano Semanal de Tarefas

**User Story:** Como usuário do app, eu quero selecionar quais tarefas da minha biblioteca fazem sentido para a semana atual e definir a meta de cada uma, para que eu tenha um plano semanal flexível sem precisar recriar as tarefas do zero.

#### Acceptance Criteria

1. QUANDO o usuário abre o modal "Planejar semana", O Sistema DEVE exibir todas as Tarefas da Biblioteca_de_Tarefas com checkbox de ativação e campo de quantidade editável; SE a tarefa já estiver ativa no Plano_Semanal, ENTÃO o campo de quantidade DEVE ser pré-preenchido com a meta já definida; CASO CONTRÁRIO, DEVE usar a quantidade padrão da Tarefa na biblioteca.
2. QUANDO o usuário salva o Plano_Semanal com pelo menos um checkbox marcado, O Sistema DEVE ativar apenas as Tarefas cujos checkboxes estão marcados, persistir a meta de quantidade informada e atualizar o painel de tarefas da tela principal; a meta de quantidade DEVE ser um inteiro entre 1 e 9999.
3. WHEN o usuário salva o Plano_Semanal com zero checkboxes marcados, THE Sistema SHALL salvar o plano como vazio e exibir o estado neutro no painel de tarefas da tela principal.
4. WHEN o usuário reduz a meta de quantidade de uma Tarefa no Plano_Semanal para um valor menor que o progresso já registrado (`done`), THE Sistema SHALL preservar o valor de `done` atual sem reduzi-lo e atualizar apenas a meta.
5. WHEN o usuário salva o Plano_Semanal e remove a ativação de uma Tarefa que já possuía progresso registrado, THE Sistema SHALL preservar os Logs já criados com vínculo naquela tarefa sem modificação.
6. WHILE o Plano_Semanal ativo da semana atual contém ao menos uma Tarefa, O Sistema DEVE listar cada Tarefa ativa com seu Contador `feito/meta` no painel lateral direito da tela principal; o Contador DEVE refletir o progresso atual sem exigir recarregamento da página após um Log ser salvo.
7. IF a semana não possui Plano_Semanal definido ou o plano foi salvo sem nenhuma tarefa ativa, THEN O Sistema DEVE exibir o estado vazio neutro "Nenhuma tarefa planejada ainda. Use 'Planejar semana'." no painel de tarefas, sem mensagem de cobrança.
8. O Sistema DEVE disponibilizar um Plano_Semanal independente por semana (identificado pela data de início da semana), de forma que alterações no plano de uma semana não afetem o plano de semanas anteriores ou futuras.
9. IF a Biblioteca_de_Tarefas estiver vazia quando o usuário abre o modal "Planejar semana", THEN O Sistema DEVE exibir uma mensagem neutra orientando o usuário a adicionar tarefas na biblioteca primeiro.

---

### Requirement 6 — Contadores de Tarefas Semanais

**User Story:** Como usuário do app, eu quero acompanhar quantas vezes realizei cada tarefa da minha semana, para que eu tenha consciência do meu progresso de forma informativa e sem sentir pressão por metas não atingidas.

#### Acceptance Criteria

1. QUANDO o usuário salva um Log com uma Tarefa vinculada via Chip_de_Tarefa, O Sistema DEVE incrementar o campo `done` da Tarefa correspondente no Plano_Semanal em 1 unidade e atualizar o Contador exibido no painel de tarefas sem exigir ação adicional nem recarregar a página.
2. QUANDO o usuário aciona o Bump diretamente no Contador de uma Tarefa no painel semanal, O Sistema DEVE incrementar o campo `done` daquela Tarefa em 1 unidade sem criar um Log.
3. WHILE o campo `done` de uma Tarefa ativa é menor que o campo `meta`, O Sistema DEVE exibir o Contador sem nenhum indicador visual de falha, urgência, atraso ou quantidade faltante; especificamente, O Sistema NÃO DEVE exibir cores de alerta, ícones de aviso ou textos como "faltam N".
4. WHEN o campo `done` de uma Tarefa ativa atinge ou supera o campo `meta`, THE Sistema SHALL aplicar um indicador visual positivo distinto ao Contador (ex: cor ou ícone de conclusão) sem utilizar linguagem ou símbolos punitivos.
5. O Sistema NÃO DEVE impedir o Bump quando `done` já é igual a `meta`; o usuário pode incrementar além da meta sem restrição e sem mensagem de aviso.
6. O Sistema DEVE exibir o Contador de cada Tarefa ativa no Plano_Semanal estritamente no formato `done/meta` (ex: "2/3"); uma Tarefa ativa é aquela incluída no Plano_Semanal da semana sendo visualizada com meta ≥ 1.
7. O Sistema NÃO DEVE exibir, em nenhum elemento da UI dos Contadores, linguagem que comunique déficit: são exemplos proibidos "faltam N", "você não fez X", "atrasado", "incompleto".
8. QUANDO o usuário abre a interface de criação de Log, O Sistema DEVE exibir os Chips_de_Tarefa correspondentes a todas as Tarefas ativas do Plano_Semanal da semana atual; O Sistema DEVE incluir sempre um chip "nenhuma" que é selecionado por padrão ao abrir a interface.
9. WHEN o usuário seleciona um Chip_de_Tarefa, THE Sistema SHALL aplicar o estado visual "selecionado" ao chip escolhido e remover o estado "selecionado" de qualquer outro chip anteriormente ativo, incluindo o chip "nenhuma".
10. WHEN um Log vinculado a uma Tarefa é excluído, THE Sistema SHALL decrementar o campo `done` da Tarefa correspondente em 1 unidade, sem reduzir `done` abaixo de 0.

---

### Requirement 7 — Lembretes Básicos

**User Story:** Como usuário do app, eu quero configurar lembretes por horário, para que o app me lembre gentilmente de registrar o dia sem depender exclusivamente da minha própria iniciativa.

#### Acceptance Criteria

1. O Sistema DEVE permitir ao usuário criar um Lembrete especificando hora (0–23) e minuto (0–59), sem exigir título, categoria ou qualquer campo adicional além do horário.
2. QUANDO o horário de um Lembrete é atingido, O Sistema DEVE enviar uma notificação diária recorrente para o dispositivo do usuário; a notificação DEVE ser enviada todos os dias enquanto o Lembrete estiver ativo, no horário configurado.
3. O Sistema DEVE permitir ao usuário manter simultaneamente entre 1 e 20 Lembretes ativos; QUANDO o usuário tenta criar um 21º Lembrete ativo, O Sistema DEVE bloquear a criação e informar o limite de forma neutra.
4. QUANDO o usuário desativa um Lembrete, O Sistema DEVE suspender o envio das notificações correspondentes sem excluir o Lembrete da lista; o Lembrete DEVE permanecer visível na lista com estado inativo.
5. QUANDO o usuário exclui um Lembrete, O Sistema DEVE remover o registro permanentemente e cancelar quaisquer notificações futuras associadas.
6. O Sistema DEVE exibir a lista de Lembretes em uma tela de configuração acessível a partir da navegação principal, ordenada pelo horário agendado (crescente); Lembretes ativos e inativos DEVEM ser visíveis na mesma lista.
7. IF o usuário não tiver concedido permissão de notificação ao app no momento em que tenta ativar ou criar um Lembrete, THEN O Sistema DEVE exibir uma mensagem explicativa informando que notificações estão bloqueadas e instruindo o usuário a habilitar a permissão nas configurações do sistema operacional; O Sistema NÃO DEVE solicitar a permissão novamente de forma automática após a primeira recusa.
8. WHEN a notificação de um Lembrete é disparada, THE Sistema SHALL exibir uma mensagem que não contenha linguagem de cobrança, culpa ou pressão; a mensagem DEVE ser uma das seguintes ou equivalente neutro: "Hora de registrar o seu dia." ou "Seu espaço está aqui quando você quiser."

---

## Fora de escopo nesta spec

- Visualização do calendário semanal e navegação entre semanas (spec separada: `weekly-calendar`).
- Seletor de humor/mood por dia (Fase 2 — spec futura).
- Timeline semanal narrativa e reflexão semanal (Fase 4 — spec futura).
- Tags, busca e filtros (Fase 5 — spec futura).
- Autenticação e gerenciamento de conta de usuário.
- Exportação de dados.
