# Product Hierarchy - Semana. App

## 1. Core Purpose
Um companheiro semanal para registros, leitura e tarefas sem pressão, especialmente projetado para usuários com TDAH.

## 2. Main Sections (Top-Level Navigation)

### 2.1 Home/Dashboard
**Página inicial** - Visão geral semanal do usuário
- **HomeGreetingLive**: Saudação personalizada baseada no horário + data
- **HomeCalendarSection**: Calendário semanal visual com status dos dias
- **DailyLogPanel**: Registro rápido diário (brain dump) com opção de vincular a tarefas
- **MoodCard**: Registro de humor com emoji e opcional nota
- **TodayLogsCard**: Visualização dos registros do dia com filtros por tag
- **WeeklyTasksPanel**: Acompanhamento semanal de tarefas com progresso (feito/meta)

### 2.2 Reading Companion
**Companheiro de leitura** - Sistema de acompanhamento de leitura
- **CurrentBookCard**: Livro em leitura atual com progresso
- **ReadingButton**: Botão para marcar leitura do dia
- **MiniWeekCalendar**: Calendário compacto mostrando dias de leitura
- **NoteForm**: Formulário para anotar durante a leitura
- **NotesList**: Lista de notas do livro atual
- **BookQueueList**: Lista de livros na fila para ler depois
- **FinishedBooksList**: Lista de livros concluídos com resenhas
- **AddBookInline**: Adicionar livros diretamente na fila
- **FinishBookModal**: Modal para finalizar livro e escrever resenha

### 2.3 Profile
**Perfil do usuário** - Gerenciamento de conta e preferências
- **AvatarUploader**: Upload e exibição de foto de perfil
- **NameForm**: Edição do nome de exibição
- **BirthDateForm**: Configuração da data de nascimento
- **Email Display**: Visualização somente leitura do email
- **PasswordForm**: Alteração de senha
- **DaySelector**: Seleção de dias para relatório semanal
- **ReportActions**: Geração e exportação de relatórios em PDF/Excel

### 2.4 History
**Histórico** - Busca e revisão de registros passados
- **Search Input**: Busca em tempo real por conteúdo de registros
- **TagChips**: Filtro por tags pessoais
- **WeekFilter**: Navegação por semanas (anterior/próxima)
- **View Toggle**: Alternar entre visualização semanal agrupada e lista contínua
- **Activity Heatmap**: Visualização de presença nas últimas 3 semanas
- **Result List**: Exibição dos registros encontrados com metadata (data, hora, tarefa, tags)
- **TagManager**: Gerenciamento das tags pessoais (criação, edição, exclusão)

### 2.5 Settings
**Configurações** - Preferências do sistema e personalização
- **ReminderForm**: Criação de lembretes recorrentes (horário:minuto)
- **ReminderList**: Visualização e gerenciamento de lembretes existentes
- **ReminderItem**: Item individual de lembrete com toggle ativo/inativo e exclusão
- **NotificationBanner**: Solicitação e status de permissão de notificações
- **Service Worker Integration**: Registro e sincronização de lembretes para notificações em background

## 3. Component Hierarchy Details

### 3.1 Shared UI Patterns
- **Panel Container**: `div.panel` com `h2.panel__title` + `p.panel__subtitle` + conteúdo
- **Stack Layout**: `div.stack` para empilhamento vertical de componentes
- **Action Bars**: Contêineres para botões de ação primários e secundários
- **Empty States**: Mensagens ilustrativas quando não há conteúdo
- **Loading States**: Indicadores sutis durante operações assíncronas
- **Error Display**: Mensagens de erro em vermelho suave (`#C6685A`) abaixo dos campos

### 3.2 Form Patterns
- **Controlled Components**: useState para gerenciamento de valores
- **Validation**: Validação client-side imediata + server-side via Zod
- **Submit Handling**: Prevenção de comportamento padrão + tratamento assíncrono
- **Loading States**: Botões com estado de carregamento visual
- **Reset Limpar**: Limpeza automática de campos após sucesso
- **Keyboard Atalhos**: Enter + Ctrl/Meta para submit em textareas

### 3.3 Data Flow Patterns
- **Optimistic Updates**: Atualização imediata da UI + reconciliação assíncrona
- **Service Workers**: Registro e sincronização para funcionalidades offline/background
- **Path Revalidation**: Invalidação estratégica de cache após mutações
- **Debouncing**: Atraso de 300ms em buscas para reduzir requests desnecessários
- **Memoization**: useMemo para agrupamento e cálculos expensive

## 4. TDAH-Specific Design Considerations Observed

### 4.1 Reducing Cognitive Load
- **Uma coisa de cada vez**: Foco em um livro por vez na leitura
- **Sem cobrança explícita**: Linguagem que remove pressão ("sem pressão", "informativa")
- **Brain dump permitido**: Registro diário sem formatação obrigatória
- **Progresso visual simples**: Contadores claros (feito/meta) sem métricas complexas

### 4.2 Time Blindness Mitigation
- **Agrupamento semanal**: Visão semanal em vez diária/mensal para melhor compreensão temporal
- **Heatmap de atividade**: Visualização intuitiva de padrões semanais
- **Calendários anchors**: Marcadores visuais de tempo (dias com leitura, humor registrado)
- **Lembretes recorrentes**: Notificações em horários configurados para ancoragem temporal

### 4.3 Task Initiation Support
- **Barreira baixa de entrada**: Campos grandes, placeholders convidativos ("O que aconteceu?")
- **Atalhos de teclado**: Ctrl+Enter para registro rápido
- **Integração de tarefas**: Vínculo opcional entre registros e tarefas semanais
- **Visualização imediata**: Feedback instantâneo após ações

### 4.4 Emotional Regulation Support
- **Tracking de humor**: Registro simples de estado emocional com emojis
- **Journaling livre**: Espaço para processamento emocional sem estrutura rígida
- **Visualização de padrões**: Identificação de tendências ao longo do tempo
- **Language acolhedor**: Tom suave, sem julgamento ou cobrança

## 5. Technical Constraints & Opportunities

### 5.1 Current Limitations
- **Mobile Experience**: Não verificado neste audit, pode precisar de adaptação
- **Customization Limitada**: Poucas opções de personalização visual ou de fluxo
- **Integração Externa**: Limitada a exportação de relatórios (não há sync com outros apps)
- **Complexidade de Tags**: Gerenciamento de tags poderia ser mais intuitivo

### 5.2 Redesign Opportunities
- **Onboarding Improvements**: Tours ou dicas contextuais para novos usuários
- **Visual Hierarchy**: Destacar ações primárias vs secundárias com mais clareza
- **Consistency Interactions**: Padrões uniformes para modals, botões, feedback
- **Accessibility Aprimorado**: Foco em contraste, navegação por teclado, labels descritivos
- **Performance**: Avaliar impacto das atualizações otimistas em dispositivos mais lentos