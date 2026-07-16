# Requirements Document

## Introduction

Este documento especifica os requisitos de autenticação de usuários para o **semana.** — um app de registro diário e acompanhamento semanal para pessoas com TDAH. A autenticação é a Fase 2 do desenvolvimento: o MVP já está funcional com um `userId` hardcoded (`00000000-0000-0000-0000-000000000001`), e este sistema substituirá esse stub por autenticação real com email e senha.

O sistema de autenticação deve seguir os princípios do app: fricção mínima, linguagem gentil e de suporte, sem barreiras desnecessárias. A sessão deve persistir entre fechamentos do navegador por padrão, respeitando o perfil de uso de pessoas com TDAH que podem esquecer credenciais ou abandonar fluxos complexos.

Esta spec habilita as fases futuras (exportação de dados, área de utilitários) que dependem de identificação real do usuário.

---

## Glossary

- **Sistema**: o aplicativo **semana.** como um todo.
- **Auth_Service**: módulo responsável por gerenciar registro, login, logout e validação de sessão.
- **Usuário_Autenticado**: pessoa que completou o fluxo de login ou registro e possui uma sessão ativa válida.
- **Sessão**: token ou cookie persistente que identifica o Usuário_Autenticado entre requisições, sem exigir novo login a cada acesso.
- **Rota_Protegida**: qualquer rota dentro do grupo `(app)` que exige sessão ativa para ser acessada.
- **Rota_Pública**: rota acessível sem sessão ativa (páginas de login e registro).
- **Formulário_de_Registro**: interface onde o usuário cria uma conta informando email e senha.
- **Formulário_de_Login**: interface onde o usuário existente informa email e senha para iniciar sessão.
- **Password_Hash**: representação criptográfica irreversível da senha armazenada no banco de dados.

---

## Requirements

### Requirement 1: Registro de Conta com Email e Senha

**User Story:** Como visitante do app, eu quero criar uma conta usando meu email e uma senha, para que eu tenha acesso pessoal e seguro ao meu espaço de registros.

#### Acceptance Criteria

1. QUANDO o visitante acessa a Rota_Pública de registro, O Sistema DEVE exibir o Formulário_de_Registro contendo: campo de email (máximo 254 caracteres), campo de senha, campo de confirmação de senha e botão de submissão.
2. QUANDO o visitante submete o Formulário_de_Registro com email válido (formato RFC 5322 simplificado, máximo 254 caracteres), senha com pelo menos 8 e no máximo 128 caracteres, e confirmação de senha idêntica à senha, O Auth_Service DEVE criar um novo registro de usuário no banco de dados com o email normalizado (lowercase, trim) e o Password_Hash da senha fornecida.
3. QUANDO o registro é criado com sucesso, O Auth_Service DEVE iniciar uma Sessão automaticamente e redirecionar o Usuário_Autenticado para a página principal do app.
4. IF o visitante submete o Formulário_de_Registro com um email já cadastrado no banco de dados, THEN O Sistema DEVE exibir uma mensagem de erro inline no campo de email informando "Esse email já está cadastrado" sem revelar dados adicionais sobre a conta existente.
5. IF o visitante submete o Formulário_de_Registro com email em formato inválido, THEN O Sistema DEVE exibir uma mensagem de erro inline no campo de email informando "Insira um email válido" sem submeter o formulário ao servidor.
6. IF o visitante submete o Formulário_de_Registro com senha menor que 8 caracteres ou maior que 128 caracteres, THEN O Sistema DEVE exibir uma mensagem de erro inline no campo de senha informando "A senha precisa ter entre 8 e 128 caracteres" sem submeter o formulário ao servidor.
7. IF o visitante submete o Formulário_de_Registro com confirmação de senha diferente da senha, THEN O Sistema DEVE exibir uma mensagem de erro inline no campo de confirmação informando "As senhas não coincidem" sem submeter o formulário ao servidor.
8. O Auth_Service DEVE armazenar senhas exclusivamente como Password_Hash gerado por algoritmo bcrypt ou argon2; o Sistema NÃO DEVE armazenar senhas em texto plano em nenhum campo ou log.
9. WHILE o Formulário_de_Registro está sendo submetido ao servidor, O Sistema DEVE desabilitar o botão de submissão e exibir um indicador de carregamento até que a resposta seja recebida ou até que 30 segundos se passem sem resposta.
10. O Formulário_de_Registro DEVE exibir um link para o Formulário_de_Login com texto "Já tem conta? Entre aqui" abaixo do botão de submissão.
11. IF o servidor retorna um erro inesperado (não relacionado a email duplicado) durante o registro, THEN O Sistema DEVE reabilitar o botão de submissão, ocultar o indicador de carregamento e exibir uma mensagem de erro informando que o registro falhou e que o visitante deve tentar novamente, preservando os valores já preenchidos nos campos do formulário.

---

### Requirement 2: Login com Email e Senha

**User Story:** Como usuário cadastrado, eu quero entrar na minha conta usando meu email e senha, para que eu acesse meus registros de onde eu estiver.

#### Acceptance Criteria

1. QUANDO o usuário acessa a Rota_Pública de login, O Sistema DEVE exibir o Formulário_de_Login contendo: campo de email, campo de senha e botão de submissão.
2. QUANDO o usuário submete o Formulário_de_Login com email válido e senha que correspondem a um registro existente (comparando o email normalizado — lowercase e trim — contra o banco de dados), O Auth_Service DEVE iniciar uma Sessão e redirecionar o Usuário_Autenticado para a página principal do app.
3. IF o usuário submete o Formulário_de_Login com email que não existe no banco de dados ou com senha que não corresponde ao Password_Hash armazenado, THEN O Sistema DEVE exibir uma mensagem de erro genérica indicando credenciais inválidas sem indicar qual campo está errado, e DEVE manter os valores preenchidos no campo de email (limpando apenas o campo de senha).
4. IF o usuário submete o Formulário_de_Login com campo de email vazio ou campo de senha vazio, THEN O Sistema DEVE exibir mensagem de erro inline nos campos vazios informando "Campo obrigatório" sem submeter o formulário ao servidor.
5. IF o usuário submete o Formulário_de_Login com email em formato inválido (não conformante com formato RFC 5322 simplificado), THEN O Sistema DEVE exibir uma mensagem de erro inline no campo de email informando "Insira um email válido" sem submeter o formulário ao servidor.
6. WHILE o Formulário_de_Login está sendo submetido ao servidor, O Sistema DEVE desabilitar o botão de submissão e exibir um indicador de carregamento; IF o servidor não responde dentro de 30 segundos, THEN O Sistema DEVE reabilitar o botão de submissão e exibir uma mensagem de erro informando falha de comunicação com o servidor.
7. IF o mesmo endereço de email acumula 5 tentativas de login com falha consecutivas dentro de um intervalo de 15 minutos, THEN O Auth_Service DEVE rejeitar novas tentativas de login para esse email durante 5 minutos, retornando uma mensagem informando que o usuário deve aguardar antes de tentar novamente.
8. O Formulário_de_Login DEVE exibir um link para o Formulário_de_Registro com texto "Não tem conta? Crie a sua" abaixo do botão de submissão.
9. IF o Usuário_Autenticado (com sessão ativa) acessa a Rota_Pública de login ou registro, THEN O Sistema DEVE redirecionar automaticamente para a página principal do app sem exibir o formulário.

---

### Requirement 3: Proteção de Rotas

**User Story:** Como usuário do app, eu quero que meus dados só sejam acessíveis quando eu estiver logado, para que ninguém sem autorização veja meus registros pessoais.

#### Acceptance Criteria

1. WHEN um visitante sem Sessão ativa tenta acessar qualquer Rota_Protegida, THE Auth_Service SHALL redirecionar o visitante para a Rota_Pública de login sem exibir conteúdo da Rota_Protegida e sem expor nomes de rotas ou parâmetros da URL original na página de login.
2. WHEN um Usuário_Autenticado com Sessão ativa acessa qualquer Rota_Protegida, THE Auth_Service SHALL permitir o acesso e fornecer o userId real (UUID) do Usuário_Autenticado, obtido da Sessão validada, para os componentes e queries da rota.
3. WHEN uma requisição é feita a qualquer Rota_Protegida, THE Auth_Service SHALL validar a Sessão antes de renderizar qualquer conteúdo, verificando que: (a) o token/cookie de Sessão está presente na requisição, (b) a Sessão não ultrapassou seu prazo de expiração, e (c) o userId da Sessão corresponde a um registro existente na tabela `users` do banco de dados.
4. IF a Sessão de um Usuário_Autenticado expira ou é invalidada enquanto o usuário está navegando, THEN THE Auth_Service SHALL redirecionar o usuário para a Rota_Pública de login na próxima navegação a uma Rota_Protegida ou na próxima Server Action invocada, exibindo apenas a interface padrão de login sem mensagens de erro adicionais.
5. THE Auth_Service SHALL utilizar o userId real do Usuário_Autenticado obtido da Sessão ativa em todas as queries e server actions do grupo `(app)`, substituindo o valor hardcoded (`00000000-0000-0000-0000-000000000001`) que existe na função `getCurrentUserId()` em `lib/auth.ts`.
6. IF a validação de Sessão falha por indisponibilidade do banco de dados ou erro interno do servidor, THEN THE Auth_Service SHALL tratar a requisição como não autenticada e redirecionar o visitante para a Rota_Pública de login, sem expor detalhes técnicos do erro ao usuário.

---

### Requirement 4: Gerenciamento de Sessão

**User Story:** Como usuário do app, eu quero permanecer logado entre sessões do navegador sem precisar digitar minha senha toda vez, para que eu possa acessar o app rapidamente quando preciso registrar algo.

#### Acceptance Criteria

1. QUANDO o Auth_Service cria uma Sessão (após login ou registro bem-sucedido), O Sistema DEVE persistir a Sessão de forma que sobreviva ao fechamento e reabertura do navegador, sem exigir ação adicional do usuário (comportamento "lembrar de mim" por padrão).
2. O Auth_Service DEVE definir o tempo de expiração da Sessão para no mínimo 30 dias a partir da criação ou da última renovação.
3. QUANDO o Usuário_Autenticado faz uma requisição autenticada a qualquer Rota_Protegida, O Auth_Service DEVE renovar o prazo de expiração da Sessão, redefinindo-o para 30 dias a partir da requisição atual.
4. QUANDO o Usuário_Autenticado aciona a ação de logout, O Auth_Service DEVE invalidar a Sessão ativa no servidor, remover o cookie de sessão do navegador e redirecionar o usuário para a Rota_Pública de login.
5. O Sistema DEVE exibir uma opção de logout acessível a partir de qualquer Rota_Protegida, posicionada na área de navegação ou settings do app, visível sem necessidade de scroll.
6. O Auth_Service DEVE armazenar sessões com cookie HTTP-only, Secure (em produção) e SameSite=Lax para prevenir ataques XSS e CSRF básicos; o atributo max-age do cookie DEVE corresponder ao tempo de expiração da Sessão no servidor.
7. IF o servidor recebe uma requisição com cookie de Sessão que não corresponde a nenhum registro válido ou não-expirado no banco de dados, THEN O Auth_Service DEVE tratar a requisição como não autenticada e seguir o fluxo de redirecionamento para login definido no Requirement 3.

---

### Requirement 5: Integração com Dados Existentes

**User Story:** Como usuário do app, eu quero que, ao criar minha conta, todos os dados que eu registrar estejam vinculados à minha conta real, para que meu histórico fique associado corretamente ao meu perfil.

#### Acceptance Criteria

1. QUANDO um novo usuário se registra, O Auth_Service DEVE criar um registro na tabela `users` do banco de dados com `id` gerado automaticamente (UUID v4) e associar esse `id` como userId em todas as operações subsequentes do Usuário_Autenticado.
2. O Auth_Service DEVE adicionar os campos `email` (text, not null, unique) e `password_hash` (text, not null) à tabela `users` existente no schema do banco de dados, preservando os campos e dados já existentes.
3. QUANDO a função `getCurrentUserId()` em `lib/auth.ts` é invocada por uma Server Action, O Auth_Service DEVE retornar o `id` (UUID) do Usuário_Autenticado obtido da Sessão ativa; IF não há Sessão ativa em uma Server Action, THEN a função DEVE lançar um erro que interrompe a operação e resulta em resposta de falha ao cliente.
4. QUANDO a função `getCurrentUserId()` em `lib/auth.ts` é invocada por um Server Component, O Auth_Service DEVE retornar o `id` (UUID) do Usuário_Autenticado obtido da Sessão ativa; IF não há Sessão ativa em um Server Component, THEN a função DEVE redirecionar o usuário para a Rota_Pública de login.
5. O Sistema DEVE incluir um filtro por `userId` da Sessão ativa em toda query de leitura e em toda operação de escrita referente a dados do usuário (logs, days, tasks, weekPlans, weekPlanTasks, reminders), de modo que nenhuma query retorne ou modifique registros pertencentes a outro usuário.
6. IF um Usuário_Autenticado tenta acessar ou modificar um recurso (log, day, task, weekPlan, weekPlanTask, reminder) cujo `userId` não corresponde ao seu próprio, THEN O Sistema DEVE retornar resultado vazio para leituras ou rejeitar a operação para escritas, sem revelar a existência do recurso.
7. O Auth_Service DEVE normalizar emails antes de salvar e comparar: converter para lowercase e remover espaços em branco nas extremidades (trim).

---

### Requirement 6: Interface de Autenticação (UX)

**User Story:** Como pessoa com TDAH usando o app, eu quero que o fluxo de login e registro seja o mais simples e rápido possível, para que eu não desista de usar o app por causa de barreiras no acesso.

#### Acceptance Criteria

1. O Sistema DEVE exibir nas páginas de login e registro a identidade visual do app (logo "semana." e subtítulo de suporte) utilizando os mesmos tokens de tipografia, cores e espaçamento definidos no restante da interface.
2. QUANDO a página de login ou registro termina de carregar, O Formulário_de_Login e o Formulário_de_Registro DEVEM posicionar automaticamente o foco no primeiro campo (email) de modo que o usuário possa começar a digitar sem clicar.
3. O Sistema DEVE permitir submissão dos formulários tanto por clique no botão quanto por pressionar Enter em qualquer campo do formulário.
4. QUANDO uma mensagem de erro é exibida em qualquer formulário de autenticação, O Sistema DEVE garantir que a mensagem: (a) não contenha palavras que atribuam culpa ao usuário (ex: "você errou", "incorreto por sua culpa"), (b) descreva o problema em no máximo 80 caracteres, e (c) inclua orientação de como resolver (ex: "Insira um email válido" em vez de apenas "Erro no email").
5. QUANDO o usuário modifica o valor de um campo que está exibindo mensagem de erro inline, O Sistema DEVE remover a mensagem de erro desse campo em até 300ms após o início da edição.
6. O Sistema NÃO DEVE exigir requisitos de complexidade de senha além do mínimo de 8 caracteres e máximo de 128 caracteres (sem requisitos de maiúsculas, números, caracteres especiais ou outras regras que aumentem fricção cognitiva).
7. O Sistema DEVE configurar os campos de email com `type="email"` e `autocomplete="email"`, e os campos de senha com `type="password"` e `autocomplete="current-password"` (login) ou `autocomplete="new-password"` (registro), para habilitar preenchimento automático pelo navegador e gerenciadores de senha.
8. WHILE qualquer formulário de autenticação está visível, O Sistema NÃO DEVE exibir FAB, navegação principal nem qualquer elemento de UI que pertença exclusivamente às Rotas_Protegidas.

---

## Fora de escopo nesta spec

- Recuperação de senha ("esqueci minha senha") — será implementada em iteração futura.
- Login social (Google, GitHub, etc.) — será avaliado em iteração futura.
- Verificação de email — não será exigida no primeiro lançamento.
- Autenticação de dois fatores (2FA).
- Migração de dados do userId hardcoded para um usuário real — o stub será simplesmente substituído; dados de desenvolvimento existentes não precisam ser migrados.
- Exportação de dados (Fase 3) e área de utilitários (Fase 4).
