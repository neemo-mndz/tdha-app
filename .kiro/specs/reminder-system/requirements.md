# Requirements Document

## Introduction

Esta spec cobre o sistema de lembretes básicos do **semana.**, permitindo ao usuário configurar notificações por horário para ser lembrado gentilmente de registrar o dia. As notificações utilizam a Web Notification API com Service Worker para agendamento client-side, sem serviço externo de push. A tela de configuração fica em `/settings/reminders`, acessível pela navegação principal.

Princípio fundamental: ZERO culpa/cobrança — mensagens são sempre neutras e gentis.

---

## Glossary

- **Sistema**: o aplicativo **semana.** como um todo.
- **Lembrete**: registro persistente contendo hora e minuto em que o usuário deseja ser notificado; pode estar ativo ou inativo.
- **Service_Worker**: script registrado no navegador que roda em background e é responsável por verificar os horários dos Lembretes e disparar notificações.
- **Notification_API**: Web Notification API do navegador, usada para exibir notificações desktop/mobile.
- **Tela_de_Lembretes**: página em `/settings/reminders` onde o usuário gerencia seus Lembretes.
- **Tabela_Reminders**: tabela `reminders` no banco de dados contendo id, userId, hour, minute, active e createdAt.

---

## Requirements

### Requirement 1 — Criação de Lembretes

**User Story:** Como usuário do app, eu quero criar lembretes informando apenas o horário desejado, para que eu possa configurar notificações sem fricção desnecessária.

#### Acceptance Criteria

1. QUANDO o usuário submete um novo Lembrete com hora (0–23) e minuto (0–59) válidos, O Sistema DEVE criar um registro na Tabela_Reminders com status ativo e exibi-lo na Tela_de_Lembretes em até 1 segundo.
2. IF o usuário submete um Lembrete com hora fora do intervalo 0–23 ou minuto fora do intervalo 0–59, THEN O Sistema DEVE rejeitar a criação e exibir mensagem de erro inline sem recarregar a página.
3. O Sistema DEVE criar Lembretes sem exigir título, categoria ou qualquer campo adicional além de hora e minuto.
4. QUANDO o usuário possui 20 Lembretes ativos e tenta criar um novo Lembrete, O Sistema DEVE bloquear a criação e informar o limite de forma neutra: "Limite de 20 lembretes atingido."
5. O Sistema DEVE contar apenas Lembretes ativos para o limite de 20; Lembretes inativos não contam para o limite.

---

### Requirement 2 — Notificações Diárias Recorrentes

**User Story:** Como usuário do app, eu quero receber uma notificação gentil no horário configurado todos os dias, para que eu seja lembrado de registrar o dia sem precisar depender da minha memória.

#### Acceptance Criteria

1. WHILE um Lembrete está ativo, O Service_Worker DEVE verificar os horários dos Lembretes a cada 60 segundos e disparar uma notificação via Notification_API quando o horário atual coincide com o horário configurado.
2. QUANDO uma notificação de Lembrete é disparada, O Sistema DEVE exibir uma das seguintes mensagens, escolhida aleatoriamente: "Hora de registrar o seu dia." ou "Seu espaço está aqui quando você quiser."
3. O Sistema NÃO DEVE incluir nas notificações de Lembrete qualquer linguagem de cobrança, culpa, pressão, urgência ou referência a dias sem registro.
4. WHILE um Lembrete está inativo, O Service_Worker DEVE ignorar o Lembrete e não disparar notificações para o horário correspondente.
5. O Service_Worker DEVE disparar no máximo uma notificação por Lembrete por dia, evitando repetições dentro da mesma janela de minuto em verificações consecutivas.

---

### Requirement 3 — Ativação e Desativação de Lembretes

**User Story:** Como usuário do app, eu quero poder desativar e reativar lembretes sem excluí-los, para que eu tenha flexibilidade de pausar lembretes temporariamente sem perder a configuração.

#### Acceptance Criteria

1. QUANDO o usuário desativa um Lembrete ativo, O Sistema DEVE atualizar o status do Lembrete para inativo na Tabela_Reminders e suspender o disparo de notificações correspondentes sem excluir o registro.
2. QUANDO o usuário reativa um Lembrete inativo, O Sistema DEVE atualizar o status para ativo e retomar o disparo de notificações no horário configurado a partir do dia seguinte.
3. O Sistema DEVE exibir Lembretes ativos e inativos na mesma lista na Tela_de_Lembretes, diferenciados visualmente pelo estado do toggle.
4. QUANDO o usuário reativa um Lembrete e já possui 20 Lembretes ativos, O Sistema DEVE bloquear a reativação e informar o limite de forma neutra.

---

### Requirement 4 — Exclusão de Lembretes

**User Story:** Como usuário do app, eu quero excluir lembretes permanentemente, para que eu possa remover horários que não fazem mais sentido.

#### Acceptance Criteria

1. QUANDO o usuário exclui um Lembrete, O Sistema DEVE remover o registro permanentemente da Tabela_Reminders e cancelar quaisquer notificações futuras associadas ao horário excluído.
2. O Sistema DEVE executar a exclusão sem solicitar confirmação adicional, removendo o item da lista com feedback visual imediato.

---

### Requirement 5 — Tela de Configuração de Lembretes

**User Story:** Como usuário do app, eu quero visualizar e gerenciar meus lembretes em uma tela dedicada acessível pela navegação, para que eu tenha controle centralizado sobre meus horários de notificação.

#### Acceptance Criteria

1. O Sistema DEVE disponibilizar a Tela_de_Lembretes na rota `/settings/reminders`, acessível a partir de um link na navegação principal do app.
2. O Sistema DEVE exibir a lista de Lembretes ordenada por horário agendado em ordem crescente (hora, depois minuto); Lembretes ativos e inativos DEVEM aparecer na mesma lista.
3. QUANDO a lista está vazia, O Sistema DEVE exibir uma mensagem neutra: "Nenhum lembrete configurado." sem cobrança ou incentivo negativo.
4. O Sistema DEVE exibir cada Lembrete na lista com: horário no formato HH:MM, toggle de ativação/desativação e botão de exclusão.
5. O Sistema DEVE exibir um formulário compacto (campos de hora e minuto + botão criar) acima da lista para criação rápida de novos Lembretes.

---

### Requirement 6 — Permissão de Notificação

**User Story:** Como usuário do app, eu quero entender o que fazer se as notificações estiverem bloqueadas, para que eu possa tomar uma ação informada sem sentir culpa.

#### Acceptance Criteria

1. IF o usuário não concedeu permissão de notificação ao app e tenta criar ou ativar um Lembrete, THEN O Sistema DEVE exibir uma mensagem explicativa informando que notificações estão bloqueadas e instruindo o usuário a habilitar a permissão nas configurações do navegador/sistema operacional.
2. O Sistema NÃO DEVE solicitar a permissão de notificação novamente de forma automática após a primeira recusa; a mensagem explicativa DEVE ser a única resposta ao bloqueio.
3. WHILE a permissão de notificação está negada, O Sistema DEVE permitir ao usuário criar e gerenciar Lembretes normalmente na Tela_de_Lembretes; apenas o disparo de notificações será suprimido.
4. QUANDO a permissão de notificação é "default" (nunca solicitada), O Sistema DEVE solicitar a permissão uma única vez ao usuário criar o primeiro Lembrete.

---

## Fora de escopo nesta spec

- Notificações push via serviço externo (FCM, APNs, OneSignal).
- Customização da mensagem de notificação pelo usuário.
- Lembretes recorrentes com dias específicos da semana.
- Snooze/adiar notificações.
- Som customizado de notificação.
