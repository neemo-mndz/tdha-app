# Requirements Document

## Introduction

Este documento especifica os requisitos para o módulo de Perfil do Usuário e Exportação de Relatório Semanal do app semana. O Perfil permite ao usuário gerenciar seus dados pessoais (nome, foto, data de nascimento, senha) de forma simples e acessível pelo header. O Relatório Semanal permite exportar um resumo estruturado da semana (logs, tarefas, leitura) em PDF ou XLS para compartilhar com o psicólogo — transformando o registro diário em uma ferramenta terapêutica concreta.

Princípio transversal: **validação leve e não intrusiva**. Erros são exibidos inline, sem modais bloqueantes. Campos opcionais nunca impedem ações principais. Feedback de sucesso é sutil e desaparece naturalmente.

**Ajuste crítico: o sistema NÃO exige preenchimento do perfil para uso do app.** Todos os campos do perfil (nome, avatar, data de nascimento) são estritamente opcionais. O app funciona integralmente mesmo que o perfil esteja completamente vazio. Nenhuma funcionalidade (registros, tarefas, leitura, exportação) é condicionada ao preenchimento do perfil. O perfil existe como conveniência, não como pré-requisito.

## Glossary

- **Profile_Page**: Página de perfil/configurações do usuário acessível em `/profile` onde dados pessoais são exibidos e editados
- **Avatar_Uploader**: Componente de upload de foto de perfil que aceita imagens, redimensiona automaticamente e armazena o resultado
- **Password_Form**: Formulário de alteração de senha com campos de senha atual, nova senha e confirmação
- **Report_Generator**: Módulo responsável por gerar relatórios semanais em formato PDF ou XLS
- **PDF_Report**: Documento A4 estilizado contendo o resumo semanal do usuário
- **XLS_Report**: Planilha Excel (.xlsx) contendo os dados semanais do usuário em formato tabular
- **Day_Selector**: Componente de seleção de dias para inclusão no relatório exportado
- **User**: Pessoa autenticada no app semana.
- **Week_Data**: Conjunto de logs, progresso de tarefas e registros de leitura de um período selecionado

## Requirements

### Requirement 1: Acesso ao Perfil

**User Story:** Como User, quero acessar minha página de perfil a partir do header do app, para gerenciar minhas informações pessoais rapidamente.

#### Acceptance Criteria

1. THE Profile_Page SHALL ser acessível via um link de perfil (avatar ou ícone de pessoa) no app header, na rota `/profile`
2. WHEN the User clicks the profile link in the header, THE Profile_Page SHALL display the current user name, email, avatar, and birth date, showing placeholders for fields not yet filled
3. IF the User is not authenticated, THEN THE Profile_Page SHALL redirect to the login page
4. THE Profile_Page SHALL include a navigation link to return to the home page
5. THE Profile_Page SHALL display all fields as optional and passive; no mandatory-fill prompts, banners, or blocking modals requesting the User to complete their profile SHALL appear

### Requirement 2: Edição de Avatar

**User Story:** Como User, quero fazer upload e alterar minha foto de perfil, para personalizar minha conta.

#### Acceptance Criteria

1. WHEN the User clicks the avatar area, THE Avatar_Uploader SHALL open the file selector directly (upload direto, sem modal intermediário)
2. WHEN the User selects a valid image file, THE Avatar_Uploader SHALL automatically resize the image to a maximum of 256x256 pixels and crop to a square aspect ratio before storing
3. WHEN the Avatar_Uploader finishes processing the image, THE Avatar_Uploader SHALL store the result as a base64 data URL in the user profile and update the displayed avatar within 3 seconds of file selection
4. THE Avatar_Uploader SHALL accept image files in JPEG, PNG, or WebP format with a maximum file size of 2 MB before processing
5. IF the User selects a file exceeding 2 MB, THEN THE Avatar_Uploader SHALL display an inline error message "Imagem deve ter no máximo 2 MB" and preserve the current avatar
6. IF the User selects a file with an unsupported format, THEN THE Avatar_Uploader SHALL display an inline error message "Formato aceito: JPEG, PNG ou WebP" and preserve the current avatar
7. WHILE no avatar is set, THE Profile_Page SHALL display a default placeholder circle with the user initials (first letter of first and last name, or first letter of email if no name is set)
8. IF the upload or processing fails due to a server error, THEN THE Avatar_Uploader SHALL display an inline error message "Erro ao salvar foto. Tente novamente." and preserve the current avatar
9. WHILE the avatar is being uploaded and processed, THE Avatar_Uploader SHALL display a loading indicator over the avatar area

### Requirement 3: Edição de Nome

**User Story:** Como User, quero editar meu nome de exibição, para que meu nome apareça corretamente no app e nos relatórios exportados.

#### Acceptance Criteria

1. WHEN the User submits a new name, THE Profile_Page SHALL update the stored name and display the updated name without requiring a full page reload
2. THE Profile_Page SHALL accept names between 2 and 100 characters after trimming leading and trailing whitespace
3. IF the User submits an empty name, a whitespace-only name, or a name shorter than 2 characters after trimming, THEN THE Profile_Page SHALL display a validation error "Nome deve ter pelo menos 2 caracteres"
4. IF the User submits a name longer than 100 characters, THEN THE Profile_Page SHALL display a validation error "Nome deve ter no máximo 100 caracteres"
5. IF the name update fails due to a server error, THEN THE Profile_Page SHALL display an error message "Erro ao salvar. Tente novamente." and retain the previous name value

### Requirement 4: Edição de Data de Nascimento

**User Story:** Como User, quero definir ou alterar minha data de nascimento, para que minha idade fique registrada como contexto pessoal.

#### Acceptance Criteria

1. WHEN the User submits a birth date, THE Profile_Page SHALL store the date and display the calculated age in whole years beside the date field
2. THE Profile_Page SHALL accept birth dates that result in an age between 13 and 120 years, calculated from the current date
3. IF the User submits a birth date resulting in an age outside the 13–120 range, THEN THE Profile_Page SHALL display a validation error "Idade deve estar entre 13 e 120 anos" and retain the previously stored birth date
4. IF the User submits an invalid date value, THEN THE Profile_Page SHALL display a validation error "Data inválida" and retain the previously stored birth date

### Requirement 5: Alteração de Senha

**User Story:** Como User, quero alterar minha senha com segurança, para manter a segurança da minha conta.

#### Acceptance Criteria

1. WHEN the User submits the password change form with a valid current password and matching new password and confirmation, THE Password_Form SHALL update the stored password hash and clear all password input fields
2. IF the User provides an incorrect current password, THEN THE Password_Form SHALL display an error "Senha atual incorreta" and preserve the new password and confirmation field values
3. IF the new password and confirmation do not match, THEN THE Password_Form SHALL display an error "As senhas não coincidem"
4. THE Password_Form SHALL require a new password with at least 8 and at most 128 characters
5. IF the new password has fewer than 8 characters, THEN THE Password_Form SHALL display a validation error "A senha deve ter pelo menos 8 caracteres"
6. IF the new password has more than 128 characters, THEN THE Password_Form SHALL display a validation error "A senha deve ter no máximo 128 caracteres"
7. WHEN the password is changed successfully, THE Password_Form SHALL display a success message "Senha alterada com sucesso" that disappears after 5 seconds
8. WHILE the password change form is being submitted, THE Password_Form SHALL disable the submit button and display a loading indicator
9. IF the server returns an error during the password change operation, THEN THE Password_Form SHALL re-enable the submit button and display an error message "Erro ao alterar senha. Tente novamente."

### Requirement 6: Seleção de Dias para Relatório

**User Story:** Como User, quero selecionar quais dias incluir no meu relatório semanal, para compartilhar apenas os dias relevantes com meu psicólogo.

#### Acceptance Criteria

1. THE Day_Selector SHALL display all 7 days of the current week (segunda a domingo) with a visual indicator (dot or badge) for days that contain at least one log entry
2. WHEN the User selects or deselects a day, THE Day_Selector SHALL update the visual state (checked/unchecked) immediately without a server round-trip
3. THE Day_Selector SHALL pre-select all days that contain at least one log entry by default
4. THE Day_Selector SHALL allow selecting between 1 and 7 days
5. IF the User attempts to generate a report with zero days selected, THEN THE Report_Generator SHALL display an inline error "Selecione pelo menos um dia" and NOT initiate the export
6. THE Day_Selector SHALL be accessible via the Profile_Page in a dedicated section titled "Exportar relatório semanal"
7. THE Day_Selector SHALL allow the User to navigate to previous weeks to export historical data

### Requirement 7: Exportação em PDF

**User Story:** Como User, quero exportar meus dados semanais como um PDF A4 estilizado, para levar um resumo profissional à minha sessão de terapia.

#### Acceptance Criteria

1. WHEN the User requests a PDF export with selected days, THE Report_Generator SHALL generate an A4-formatted PDF document within 10 seconds
2. THE PDF_Report SHALL include: user name (or "Usuário" as fallback), selected date range formatted as "DD/MM/YYYY", daily logs with timestamps in "HH:mm" format, task progress per day showing task name with completed quantity out of goal quantity, and reading activity indicating which days the user read and the book title
3. THE PDF_Report SHALL present data grouped by day with section headers for each day, consistent font sizing, and adequate spacing between sections so that all content is readable at 100% zoom without magnification
4. THE PDF_Report SHALL be rendered entirely in Portuguese (pt-BR) for all labels, headers, and date formats
5. WHEN the PDF generation is complete, THE Report_Generator SHALL trigger a browser download with filename format "semana_[nome]_[data-inicio]_[data-fim].pdf" where [nome] uses the user display name (lowercase, spaces replaced by hyphens) if set, or "usuario" as fallback
6. IF no data exists for any of the selected days, THEN THE PDF_Report SHALL include a message "Nenhum registro encontrado para o período selecionado"
7. IF PDF generation fails due to a system error, THEN THE Report_Generator SHALL display an error message "Erro ao gerar PDF. Tente novamente." and preserve the current day selection state
8. THE PDF_Report SHALL render correctly regardless of whether the user has name, avatar, or birth date set

### Requirement 8: Exportação em XLS

**User Story:** Como User, quero exportar meus dados semanais como uma planilha Excel, para compartilhar dados estruturados com meu psicólogo ou manter um arquivo pessoal.

#### Acceptance Criteria

1. WHEN the User requests an XLS export with selected days, THE Report_Generator SHALL generate an .xlsx file within 10 seconds
2. THE XLS_Report SHALL contain three separate sheets named "Registros", "Tarefas", and "Leitura", each containing only data from the selected days
3. THE XLS_Report SHALL include the user name (or "Usuário" as fallback) and selected date range in the first row of each sheet as header information
4. THE XLS_Report SHALL use Portuguese (pt-BR) for all labels, headers, and date formats
5. WHEN the XLS generation is complete, THE Report_Generator SHALL trigger a browser download with filename format "semana_[nome]_[data-inicio]_[data-fim].xlsx" where [nome] uses the user display name (lowercase, spaces replaced by hyphens) if set, or "usuario" as fallback
6. IF no data exists for any of the selected days, THEN THE XLS_Report SHALL contain a single sheet with a message "Nenhum registro encontrado para o período selecionado"
7. IF the XLS generation fails due to a processing error, THEN THE Report_Generator SHALL display an error message "Erro ao gerar planilha. Tente novamente." and no file shall be downloaded

### Requirement 9: Dados do Relatório

**User Story:** Como User, quero que meu relatório contenha todos os dados relevantes da semana, para que meu psicólogo tenha uma visão completa da minha semana.

#### Acceptance Criteria

1. THE Report_Generator SHALL retrieve daily logs with content text and creation timestamps for each selected day
2. THE Report_Generator SHALL retrieve task progress from the week plan covering the selected days, including task name, goal quantity, and completed quantity
3. THE Report_Generator SHALL retrieve reading activity for each selected day, including the date and the title of the book being read
4. THE Report_Generator SHALL order daily logs in ascending chronological order (earliest first) within each day
5. THE Report_Generator SHALL group all data by day, ordered from the earliest to the latest selected date
6. IF a selected day has no logs, no task progress, and no reading activity, THEN THE Report_Generator SHALL include that day in the report with an indication "Sem registros neste dia"
7. IF no week plan exists for the period covering the selected days, THEN THE Report_Generator SHALL omit the task progress section entirely from the report rather than showing empty task data

### Requirement 10: Proteção de Dados do Perfil

**User Story:** Como User, quero que apenas eu possa ver e editar meu perfil, para garantir a privacidade dos meus dados pessoais.

#### Acceptance Criteria

1. THE Profile_Page SHALL only display and allow editing of data belonging to the authenticated User identified by session
2. THE Report_Generator SHALL only retrieve and export data belonging to the authenticated User identified by session
3. IF a request to the profile or export endpoints does not contain a valid session, THEN THE Profile_Page SHALL return an authentication error and redirect to the login page
4. THE Profile_Page SHALL NOT expose internal identifiers (user ID, session token) in the rendered HTML or client-side JavaScript
