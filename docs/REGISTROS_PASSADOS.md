# Registros de dias anteriores

Ao selecionar uma data anterior a hoje no calendário da Home ou da semana, o card de registros mostra “Completar este dia”. O botão “+ Adicionar” abre uma linha com atividade e horário obrigatórios. Salvar inclui o registro na lista em ordem cronológica e limpa os campos para o próximo registro. O mesmo painel está na página `/day/[date]` para datas passadas. Hoje mantém a captura rápida existente.

A Server Action `createPastLog` valida a data civil, o horário e o offset do fuso da data informada, exige autenticação e aceita apenas dias anteriores ao dia atual em São Paulo. A data do registro é associada ao `Day` do usuário autenticado; o horário é convertido para UTC e gravado na mesma inserção. Não há migração de banco. Esta captura registra uma atividade livre, sem vínculo automático com tarefas semanais ou itens da agenda.

Falhas preservam os campos; o formulário bloqueia envio duplicado. Os resultados de carregamento e salvamento na Home são vinculados à data selecionada para evitar misturar dias ao navegar rapidamente.

Validação: testes de UI da Home e da página do dia, falha/reenvio, bloqueio de duplicação, ordem cronológica, validação e autenticação na ação, horários na virada do dia e integração no banco Neon isolado. O teste de integração só executa com AGENDA_INTEGRATION=1 e AGENDA_TEST_BRANCH=br-morning-darkness-acmbzml7; cria e remove sua própria conta sintética.
