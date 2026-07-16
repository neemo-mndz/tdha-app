# Implementation Plan: Reminder System

## Overview

Implementação do sistema de lembretes client-side para o app semana. — CRUD com Server Actions + Drizzle, validação Zod, UI com useOptimistic, e Service Worker para disparo de notificações via Web Notification API.

## Tasks

- [x] 1. Database schema and validation
  - [x] 1.1 Add `reminders` table to Drizzle schema
    - Add table with columns: id (uuid PK), user_id (FK to users), hour (integer), minute (integer), active (boolean default true), created_at (timestamptz)
    - Add remindersRelations with user relation
    - Export Reminder type
    - _Requirements: 1.1, 1.3_

  - [x] 1.2 Create Zod validation schemas
    - Create `lib/validation/reminder.schema.ts`
    - Define `createReminderSchema` with hour (int 0-23) and minute (int 0-59)
    - Define `toggleReminderSchema` with reminderId (uuid)
    - Define `deleteReminderSchema` with reminderId (uuid)
    - Export inferred types
    - _Requirements: 1.1, 1.2_

  - [ ]* 1.3 Write property tests for validation schema
    - **Property 1: Valid time inputs always create an active reminder**
    - **Property 2: Invalid time inputs are always rejected**
    - **Validates: Requirements 1.1, 1.2**

- [x] 2. Database queries
  - [x] 2.1 Create `lib/db/queries/reminders.ts`
    - Implement `getReminders(userId)` — returns all reminders sorted by (hour ASC, minute ASC)
    - Implement `getReminderById(id)` — returns single reminder or null
    - Implement `countActiveReminders(userId)` — returns count of active reminders
    - Implement `insertReminder({ userId, hour, minute, active })`
    - Implement `updateReminderActive(id, active)` — toggles active field
    - Implement `deleteReminderById(id)` — removes record
    - _Requirements: 1.1, 3.1, 4.1, 5.2_

  - [ ]* 2.2 Write property test for sort order
    - **Property 9: Reminder list is sorted by time ascending**
    - **Validates: Requirements 5.2**

- [x] 3. Server Actions
  - [x] 3.1 Create `lib/actions/reminders.ts`
    - Implement `createReminder` — validates input, checks active limit (20), inserts, revalidates `/settings/reminders`
    - Implement `toggleReminder` — validates, checks ownership, checks limit on reactivation, toggles, revalidates
    - Implement `deleteReminder` — validates, checks ownership, deletes, revalidates
    - All actions follow existing pattern: parse → auth → business logic → revalidate → return ActionResult
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 3.1, 3.2, 3.4, 4.1_

  - [ ]* 3.2 Write property test for active limit counting
    - **Property 3: Active limit counts only active reminders**
    - **Validates: Requirements 1.4, 1.5, 3.4**

  - [ ]* 3.3 Write property test for toggle round-trip
    - **Property 4: Toggle is a round-trip operation**
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 3.4 Write property test for deletion
    - **Property 8: Deletion removes record permanently**
    - **Validates: Requirements 4.1**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Settings page and UI components
  - [x] 5.1 Create settings layout at `app/(app)/settings/layout.tsx`
    - Simple layout wrapper for the settings section
    - _Requirements: 5.1_

  - [x] 5.2 Create reminders page at `app/(app)/settings/reminders/page.tsx`
    - Server Component that fetches reminders for current user
    - Passes sorted reminders to client components
    - _Requirements: 5.1, 5.2_

  - [x] 5.3 Create `components/reminders/ReminderForm.tsx`
    - Client Component with hour (0-23) and minute (0-59) inputs + create button
    - Uses `useOptimistic` for immediate feedback
    - Calls `createReminder` Server Action
    - Shows inline error for validation failures or limit reached
    - _Requirements: 1.1, 1.2, 1.4, 5.5_

  - [x] 5.4 Create `components/reminders/ReminderList.tsx` and `ReminderItem.tsx`
    - ReminderList: renders sorted list or empty state message "Nenhum lembrete configurado."
    - ReminderItem: displays HH:MM formatted time, toggle switch, delete button
    - Uses `useOptimistic` for immediate toggle/delete feedback
    - Calls `toggleReminder` and `deleteReminder` Server Actions
    - _Requirements: 3.1, 3.3, 4.1, 4.2, 5.2, 5.3, 5.4_

  - [x] 5.5 Create `components/reminders/NotificationBanner.tsx`
    - Client Component checking `Notification.permission`
    - Shows explanatory message when permission is "denied"
    - Requests permission once when "default" and user creates first reminder
    - Never re-requests after denial
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 5.6 Add navigation link to settings/reminders
    - Add link in the app layout or main navigation to `/settings/reminders`
    - _Requirements: 5.1_

- [x] 6. Service Worker for notifications
  - [x] 6.1 Create `public/sw-reminders.js`
    - Listen for "SYNC_REMINDERS" messages to receive reminder list
    - setInterval(60_000) loop checking current time against active reminders
    - Deduplication: track last fired date per reminder ID, skip if already fired today
    - Show notification with random message from allowed pool
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 6.2 Create `lib/utils/register-sw.ts` and sync helper
    - `registerReminderSW()` — registers the service worker
    - `syncRemindersToSW(reminders)` — posts reminder list to SW via postMessage
    - _Requirements: 2.1_

  - [x] 6.3 Wire SW sync into UI components
    - After successful create/toggle/delete, call `syncRemindersToSW` with updated list
    - Register SW on mount of the reminders page
    - _Requirements: 2.1, 2.4_

  - [ ]* 6.4 Write property tests for notification logic
    - **Property 5: Only active reminders trigger notifications**
    - **Property 6: Notification deduplication — at most one per reminder per day**
    - **Property 7: Notification messages are always neutral**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

- [x] 7. Styles
  - [x] 7.1 Add CSS classes for reminders UI in `globals.css`
    - Styles for reminder-form, reminder-list, reminder-item, reminder-toggle, notification-banner
    - Follow existing BEM-like conventions
    - _Requirements: 5.4, 5.5_

- [x] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check (already in devDependencies)
- Service Worker scheduling uses simple setInterval (60s) approach
- UI language is Portuguese (pt-BR); code in English
- ZERO culpa/cobrança in all user-facing strings
