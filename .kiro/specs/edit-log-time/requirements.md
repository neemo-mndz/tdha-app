# Requirements Document

## Introduction

Esta funcionalidade permite que o usuário edite o horário (timestamp) de um log existente. Atualmente, os logs são criados com o horário automático (`createdAt = now()`), mas o usuário pode precisar registrar algo retroativamente (ex.: esqueceu de registrar no momento certo). A edição de horário permite corrigir o timestamp sem alterar o conteúdo ou excluir/recriar o log.

## Glossary

- **Sistema_de_Logs**: Módulo responsável por criar, exibir, editar e excluir registros diários do usuário
- **Log**: Registro textual com timestamp associado a um dia específico do usuário
- **Horário_do_Log**: O campo `createdAt` (timestamp com timezone) que indica quando o registro ocorreu
- **Seletor_de_Horário**: Componente de interface que permite ao usuário escolher hora e minuto para o log
- **Usuário_Autenticado**: Pessoa que possui sessão ativa no sistema

## Requirements

### Requirement 1: Editar horário de um log existente

**User Story:** Como usuário, eu quero editar o horário de um log existente, para que eu possa corrigir o timestamp quando esqueço de registrar algo no momento correto.

#### Acceptance Criteria

1. WHEN o Usuário_Autenticado solicita a edição de horário de um Log, THE Sistema_de_Logs SHALL exibir o Seletor_de_Horário pré-preenchido com o horário atual do Log no formato HH:mm
2. WHEN o Usuário_Autenticado confirma um novo horário válido, THE Sistema_de_Logs SHALL atualizar o campo `createdAt` do Log para o horário selecionado mantendo a mesma data (dia) do Log original e preservando o timezone do sistema
3. WHEN o horário de um Log é atualizado com sucesso, THE Sistema_de_Logs SHALL reordenar a lista de logs do dia de acordo com a nova ordem cronológica (ascendente por `createdAt`)
4. THE Sistema_de_Logs SHALL restringir a seleção de horário ao intervalo de 00:00 a 23:59 do dia ao qual o Log pertence
5. IF a atualização de horário falhar por erro do servidor, THEN THE Sistema_de_Logs SHALL exibir mensagem de erro "Erro ao salvar horário. Tente novamente." e manter o horário anterior inalterado

### Requirement 2: Validação do horário informado

**User Story:** Como usuário, eu quero receber feedback claro quando informo um horário inválido, para que eu possa corrigir a entrada.

#### Acceptance Criteria

1. IF o Usuário_Autenticado submeter um horário com formato inválido (fora do padrão HH:mm, onde HH e mm devem conter exatamente 2 dígitos cada), THEN THE Sistema_de_Logs SHALL exibir mensagem de erro indicando que o formato esperado é HH:mm, e manter o horário anterior do Log inalterado no banco de dados
2. IF o Usuário_Autenticado submeter um horário com hora fora do intervalo 0-23 ou minuto fora do intervalo 0-59, THEN THE Sistema_de_Logs SHALL rejeitar a alteração, manter o horário anterior do Log inalterado, e exibir mensagem de erro indicando o intervalo válido (horas: 00-23, minutos: 00-59)
3. WHEN o Usuário_Autenticado submeter uma alteração de horário, THE Sistema_de_Logs SHALL validar o horário no servidor antes de persistir a alteração; IF a validação falhar, THEN THE Sistema_de_Logs SHALL retornar erro e não modificar o registro existente
4. IF o Usuário_Autenticado submeter o campo de horário vazio ou contendo apenas espaços em branco, THEN THE Sistema_de_Logs SHALL exibir mensagem de erro indicando que o horário é obrigatório e manter o horário anterior do Log inalterado

### Requirement 3: Autorização para edição de horário

**User Story:** Como usuário, eu quero que apenas eu possa editar o horário dos meus logs, para que meus dados permaneçam seguros.

#### Acceptance Criteria

1. WHEN um Usuário_Autenticado solicita edição de horário de um Log que lhe pertence, THE Sistema_de_Logs SHALL processar a alteração e retornar confirmação de sucesso
2. IF um Usuário_Autenticado tentar editar o horário de um Log que pertence a outro usuário, THEN THE Sistema_de_Logs SHALL rejeitar a operação, manter o horário original inalterado e retornar mensagem de erro indicando falta de autorização
3. IF um Usuário_Autenticado tentar editar o horário de um Log que não existe, THEN THE Sistema_de_Logs SHALL rejeitar a operação e retornar mensagem de erro indicando que o recurso não foi encontrado

### Requirement 4: Interface de edição de horário

**User Story:** Como usuário, eu quero uma forma intuitiva de alterar o horário exibido ao lado do log, para que a experiência seja rápida e fluida.

#### Acceptance Criteria

1. WHILE o Usuário_Autenticado está no modo de edição de um Log, THE Sistema_de_Logs SHALL exibir o Seletor_de_Horário junto ao campo de edição de conteúdo, pré-preenchido com o horário atual do log
2. THE Seletor_de_Horário SHALL aceitar entrada no formato HH:mm dentro do intervalo 00:00 a 23:59, com incrementos de 1 minuto
3. WHEN o Usuário_Autenticado confirma a edição do Log, THE Sistema_de_Logs SHALL persistir o novo horário selecionado e exibi-lo ao lado do log na listagem
4. WHEN o Usuário_Autenticado cancela a edição, THE Sistema_de_Logs SHALL descartar as alterações de horário e manter o último valor salvo
5. IF o Usuário_Autenticado insere um valor fora do intervalo 00:00–23:59 ou em formato diferente de HH:mm, THEN THE Seletor_de_Horário SHALL impedir o envio do formulário e exibir uma mensagem de erro indicando o formato esperado
6. THE Seletor_de_Horário SHALL ser operável via teclas Tab, setas direcionais e Enter, e possuir um atributo aria-label que identifique o campo como seletor de horário do registro
