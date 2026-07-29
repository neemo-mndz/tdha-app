# Requirements Document

## Introduction

O recurso de Mood Tracking permite ao usuário registrar seu humor diário de forma rápida (um toque), com uma nota descritiva opcional. O humor é um atributo do dia (não um tipo de log), consistente com o princípio de que o dia é a unidade atômica e a semana é derivada. Cada dia tem no máximo um humor ativo, sobrescrevível livremente. O registro de humor é visualmente e estruturalmente separado do "Registro do dia" (texto livre).

## Glossary

- **Mood_Selector**: Componente de interface que apresenta as opções de humor em emoji para seleção por toque
- **Mood_Card**: Card "Humor de hoje" na tela principal, separado do card de registro de texto
- **Daily_Log_Card**: Card "Registro do dia" existente para texto livre (brain dump)
- **MoodValue**: Tipo enumerado com 5 valores possíveis: 'great', 'good', 'neutral', 'bad', 'awful'
- **Mood_Note**: Texto curto opcional (até 80 caracteres) associado ao humor do dia
- **Weekly_Calendar**: Componente de calendário semanal exibido na home page
- **Day_Cell**: Célula individual do calendário semanal representando um dia
- **Mood_Dot**: Indicador visual discreto (ponto colorido) na célula do calendário semanal que indica presença de humor registrado
- **System**: O aplicativo de acompanhamento diário para TDAH como um todo

## Requirements

### Requirement 1: Exibir seletor de humor

**User Story:** As a user, I want to see a mood selector with fixed emoji options, so that I can quickly identify and tap my current mood.

#### Acceptance Criteria

1. THE Mood_Card SHALL display the Mood_Selector with exactly 5 emoji options using the fixed mapping: awful→😢, bad→😞, neutral→😐, good→🙂, great→😊
2. THE Mood_Card SHALL render as a self-contained card element on the main screen with the title "Humor de hoje" and subtitle "Um toque só. Independente do que você escrever no registro do dia.", occupying its own layout block separate from the Daily_Log_Card
3. THE Mood_Selector SHALL arrange the 5 emoji options in a single horizontal row ordered left-to-right from most negative (awful) to most positive (great)
4. WHEN a day has no mood registered, THE Mood_Selector SHALL display all 5 options at equal visual weight with no option highlighted or dimmed relative to the others
5. THE Mood_Selector SHALL provide an accessible label for each emoji option indicating the corresponding MoodValue name so that assistive technologies can identify each option

### Requirement 2: Registrar humor com um toque

**User Story:** As a user, I want to register my mood with a single tap, so that the process takes seconds and requires no typing.

#### Acceptance Criteria

1. WHEN the user taps a mood option, THE Mood_Selector SHALL persist that MoodValue as the active mood for the selected day using the upsertDay pattern in a single action without requiring a confirmation step, where MoodValue is one of exactly 5 options: great, good, neutral, bad, awful
2. WHEN the user taps a mood option that is already active, THE Mood_Selector SHALL clear the mood for that day, setting the mood to null
3. WHEN the user taps a mood option different from the currently active mood, THE Mood_Selector SHALL replace the previous mood with the new selection without retaining intermediate mood history
4. WHEN a mood is saved successfully, THE Mood_Selector SHALL visually highlight the active option and dim the remaining 4 options within 100ms using the optimistic update pattern, before server confirmation
5. IF the server action to persist the mood fails, THEN THE Mood_Selector SHALL revert the optimistic UI to the previous mood state and display an inline error message indicating the save failed

### Requirement 3: Persistir humor na tabela days

**User Story:** As a user, I want my mood saved reliably as part of the day record, so that it is consistent with how the app already treats daily data.

#### Acceptance Criteria

1. THE System SHALL add a nullable text column `mood` to the days table using an additive schema migration that does not alter, rename, or remove any existing columns or indexes
2. THE System SHALL add a nullable text column `mood_note` to the days table using an additive schema migration that does not alter, rename, or remove any existing columns or indexes
3. THE System SHALL enforce at most one mood per user per day by storing mood as a column on the days row, relying on the existing unique index on (user_id, date) to prevent duplicates
4. WHEN a mood is persisted, THE System SHALL use the existing upsert-day pattern (INSERT ... ON CONFLICT DO NOTHING followed by SELECT) to guarantee the day row exists, then UPDATE the mood column on that row with the provided MoodValue
5. IF the mood column receives a value, THEN THE System SHALL only accept one of the five valid MoodValue strings: 'great', 'good', 'neutral', 'bad', 'awful'; any other non-null value SHALL be rejected by application-level validation before persistence
6. WHEN a mood is cleared by the user, THE System SHALL set the mood column to null on the corresponding day row without deleting the row or affecting other columns
7. THE System SHALL enforce a maximum length of 80 characters on the mood_note column at the application validation layer before persistence

### Requirement 4: Nota descritiva opcional

**User Story:** As a user, I want to optionally add a short word or phrase about my mood, so that I have more context only when I choose.

#### Acceptance Criteria

1. THE Mood_Card SHALL display the Mood_Note input field collapsed by default, revealed only when the user taps the trigger link labeled "adicionar uma palavra sobre esse humor (opcional)"
2. WHEN the user taps the trigger link while the Mood_Note input is visible, THE Mood_Card SHALL collapse the input field, hiding it from view
3. THE System SHALL allow saving the Mood_Note independently of whether a MoodValue is selected, and allow saving a MoodValue independently of whether a Mood_Note exists
4. WHILE the Mood_Note input field is visible, THE System SHALL display a character count indicator showing the current length out of the 80-character maximum (e.g., "12/80")
5. THE System SHALL limit the Mood_Note to a maximum of 80 characters and a minimum of 1 non-whitespace character
6. IF the user attempts to save a Mood_Note that is empty or contains only whitespace, THEN THE System SHALL discard the input and persist a null value for the mood_note column
7. WHEN the user taps the "Salvar" button with a valid Mood_Note (1–80 characters, at least 1 non-whitespace character), THE System SHALL persist the Mood_Note to the days table mood_note column
8. IF the Mood_Note input reaches the 80-character limit, THEN THE System SHALL prevent further character entry and visually highlight the character count indicator to signal the limit has been reached

### Requirement 5: Separação visual entre Humor e Registro do dia

**User Story:** As a user, I want the mood section and the daily log section to be clearly separate, so that I do not confuse where to enter what.

#### Acceptance Criteria

1. THE System SHALL render the Mood_Card and the Daily_Log_Card as two separate card container elements on the main screen, each with its own visible heading, separated by at least 16 px of vertical spacing and appearing in the order: Mood_Card above Daily_Log_Card
2. THE Daily_Log_Card SHALL NOT contain any mood-related input fields or mood display elements
3. THE Mood_Card SHALL NOT contain any free-text log input fields
4. THE Daily_Log_Card subtitle SHALL reference the Mood_Card by its relative position (e.g., "ali em cima") using present tense, and SHALL NOT use future-tense language (e.g., "futuramente") to describe the mood section
5. WHEN the main screen is rendered, THE System SHALL display the sections in the following top-to-bottom order: Calendar, Mood_Card, Today's Logs, Daily_Log_Card, Weekly Tasks

### Requirement 6: Indicador de humor no calendário semanal

**User Story:** As a user, I want to see at a glance which days have a mood registered in the weekly calendar, so that I get a visual overview without opening each day.

#### Acceptance Criteria

1. WHEN a day has a mood registered (mood is a valid MoodValue), THE Day_Cell SHALL display a Mood_Dot indicator that is visually differentiated from the existing log-count dot by using a different color and occupying a separate position within the cell, so that both indicators are simultaneously distinguishable
2. THE Day_Cell SHALL NOT display the specific mood emoji in the weekly calendar view (the full emoji is shown only in the Mood_Card)
3. WHEN a day has no mood registered (mood is null), THE Day_Cell SHALL NOT display any mood indicator
4. THE Weekly_Calendar query SHALL read the mood value from the days table instead of hard-coding null, returning the value as-is when it matches a valid MoodValue
5. IF the mood value read from the days table does not match any valid MoodValue ('great', 'good', 'neutral', 'bad', 'awful'), THEN THE Weekly_Calendar query SHALL treat that value as null and not display any Mood_Dot for that day
6. WHEN a Mood_Dot is displayed, THE Day_Cell SHALL include an accessible label (e.g., aria-label) indicating that a mood is registered for that day, without revealing the specific mood value

### Requirement 7: Independência do humor em relação a outras funcionalidades

**User Story:** As a user, I want the mood feature to be completely optional, so that no other app functionality depends on it.

#### Acceptance Criteria

1. THE System SHALL allow all existing features (logs, weekly tasks, reading companion) to complete their create, read, update, and delete operations successfully when the mood field is null
2. THE System SHALL NOT display any count, streak, percentage, or comparative metric related to mood registration frequency (e.g., "days without mood", "mood completion rate", "X days since last mood")
3. THE System SHALL NOT require mood registration as a prerequisite for creating logs, planning weeks, or using any other feature — all forms and actions SHALL submit successfully with mood omitted
4. WHEN the mood field is null for a given day, THE System SHALL hide the mood indicator entirely from the calendar day cell rather than displaying an empty, placeholder, or "not set" state
5. IF a user has never registered any mood value, THEN THE System SHALL render all screens (home, week view, day view, reading companion, profile) without error and without any prompt or nudge to register mood
