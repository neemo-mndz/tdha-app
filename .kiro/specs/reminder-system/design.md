# Design Document — Reminder System

## Overview

Sistema de lembretes client-side para o app **semana.**, permitindo ao usuário configurar horários de notificação diária. Usa Web Notification API + Service Worker para agendamento, sem dependência de serviço externo de push. Dados persistidos no PostgreSQL (Neon) via Drizzle ORM.

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────┐
│  /settings/reminders (Server Component)             │
│  ┌───────────────────────────────────────────────┐  │
│  │  ReminderForm (Client Component)              │  │
│  │  - hour input, minute input, create button    │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │  ReminderList (Client Component)              │  │
│  │  - sorted list of ReminderItem                │  │
│  │  - empty state message                        │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │  NotificationBanner (Client Component)        │  │
│  │  - permission status message                  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Service Worker (sw-reminders.ts)                   │
│  - setInterval(60_000) check loop                   │
│  - reads reminders from IndexedDB cache             │
│  - fires Notification when time matches             │
│  - deduplication via lastFiredDate map              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Server Actions (lib/actions/reminders.ts)          │
│  - createReminder(hour, minute)                     │
│  - toggleReminder(id)                               │
│  - deleteReminder(id)                               │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Database (Neon PostgreSQL)                         │
│  - reminders table                                  │
└─────────────────────────────────────────────────────┘
```

### Data Flow

1. **Create**: User fills hour/minute → Client calls `createReminder` Server Action → Zod validates → inserts into DB → revalidates path → Client syncs reminder list to Service Worker via IndexedDB/postMessage.
2. **Toggle**: User clicks toggle → Client calls `toggleReminder` → updates `active` field → revalidates → syncs to SW.
3. **Delete**: User clicks delete → Client calls `deleteReminder` → removes from DB → revalidates → syncs to SW.
4. **Notification**: Service Worker interval fires every 60s → checks current time against active reminders → if match and not already fired today → shows notification with neutral message.

---

## Data Model

### Database Schema

```typescript
// drizzle/schema.ts — addition

import { boolean } from "drizzle-orm/pg-core";

export const reminders = pgTable("reminders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  hour: integer("hour").notNull(),     // 0–23
  minute: integer("minute").notNull(), // 0–59
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const remindersRelations = relations(reminders, ({ one }) => ({
  user: one(users, {
    fields: [reminders.userId],
    references: [users.id],
  }),
}));

export type Reminder = typeof reminders.$inferSelect;
```

### Validation Schema

```typescript
// lib/validation/reminder.schema.ts

import { z } from "zod";

export const createReminderSchema = z.object({
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
});

export const toggleReminderSchema = z.object({
  reminderId: z.string().uuid(),
});

export const deleteReminderSchema = z.object({
  reminderId: z.string().uuid(),
});

export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type ToggleReminderInput = z.infer<typeof toggleReminderSchema>;
export type DeleteReminderInput = z.infer<typeof deleteReminderSchema>;
```

---

## Server Actions

### createReminder

```typescript
// lib/actions/reminders.ts

export async function createReminder(input: unknown): Promise<ActionResult> {
  const parsed = createReminderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const userId = await getCurrentUserId();

  // Check active limit (max 20)
  const activeCount = await countActiveReminders(userId);
  if (activeCount >= 20) {
    return { success: false, error: "Limite de 20 lembretes atingido." };
  }

  await insertReminder({
    userId,
    hour: parsed.data.hour,
    minute: parsed.data.minute,
    active: true,
  });

  revalidatePath("/settings/reminders");
  return { success: true };
}
```

### toggleReminder

```typescript
export async function toggleReminder(input: unknown): Promise<ActionResult> {
  const parsed = toggleReminderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos" };
  }

  const userId = await getCurrentUserId();
  const reminder = await getReminderById(parsed.data.reminderId);

  if (!reminder || reminder.userId !== userId) {
    return { success: false, error: "Não autorizado" };
  }

  // If reactivating, check limit
  if (!reminder.active) {
    const activeCount = await countActiveReminders(userId);
    if (activeCount >= 20) {
      return { success: false, error: "Limite de 20 lembretes atingido." };
    }
  }

  await updateReminderActive(parsed.data.reminderId, !reminder.active);

  revalidatePath("/settings/reminders");
  return { success: true };
}
```

### deleteReminder

```typescript
export async function deleteReminder(input: unknown): Promise<ActionResult> {
  const parsed = deleteReminderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos" };
  }

  const userId = await getCurrentUserId();
  const reminder = await getReminderById(parsed.data.reminderId);

  if (!reminder || reminder.userId !== userId) {
    return { success: false, error: "Não autorizado" };
  }

  await deleteReminderById(parsed.data.reminderId);

  revalidatePath("/settings/reminders");
  return { success: true };
}
```

---

## Service Worker Scheduling

### Registration

```typescript
// lib/utils/register-sw.ts

export async function registerReminderSW() {
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.register("/sw-reminders.js");
    return registration;
  }
  return null;
}
```

### Service Worker Logic

```typescript
// public/sw-reminders.js

let reminders = [];
const firedToday = new Map(); // reminderId → dateString

// Receive reminders from main thread
self.addEventListener("message", (event) => {
  if (event.data.type === "SYNC_REMINDERS") {
    reminders = event.data.reminders;
  }
});

// Check every 60 seconds
setInterval(() => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const todayStr = now.toISOString().slice(0, 10);

  for (const reminder of reminders) {
    if (!reminder.active) continue;
    if (reminder.hour !== currentHour || reminder.minute !== currentMinute) continue;

    const key = reminder.id;
    if (firedToday.get(key) === todayStr) continue;

    firedToday.set(key, todayStr);

    const messages = [
      "Hora de registrar o seu dia.",
      "Seu espaço está aqui quando você quiser.",
    ];
    const msg = messages[Math.floor(Math.random() * messages.length)];

    self.registration.showNotification("semana.", { body: msg });
  }
}, 60_000);
```

### Sync Mechanism

After any CRUD operation, the client component posts the updated reminder list to the Service Worker:

```typescript
function syncRemindersToSW(reminders: Reminder[]) {
  navigator.serviceWorker?.controller?.postMessage({
    type: "SYNC_REMINDERS",
    reminders: reminders.map((r) => ({
      id: r.id,
      hour: r.hour,
      minute: r.minute,
      active: r.active,
    })),
  });
}
```

---

## UI Components

### ReminderForm

Client Component with controlled inputs for hour (0-23) and minute (0-59). Uses `useOptimistic` pattern for immediate feedback. Calls `createReminder` Server Action on submit. Shows notification permission banner if needed.

### ReminderList

Client Component receiving sorted reminders from server. Each item shows:
- Time in `HH:MM` format (zero-padded)
- Toggle switch for active/inactive
- Delete button (no confirmation)

Uses `useOptimistic` for immediate toggle/delete feedback.

### NotificationBanner

Checks `Notification.permission` on mount:
- `"default"`: shows nothing until first reminder creation, then requests permission
- `"granted"`: shows nothing
- `"denied"`: shows explanatory message with instructions to enable in OS settings

---

## Error Handling

- **Validation errors**: Zod rejects invalid hour/minute, returns inline error message.
- **Limit reached**: Returns neutral message "Limite de 20 lembretes atingido." without pressure.
- **Network errors**: Optimistic UI reverts state on failure, shows inline error.
- **Permission denied**: Explanatory message, never re-requests automatically.
- **Service Worker unavailable**: Reminders still manageable in UI, just no notifications fire. No error shown to user.

---

## Notification Messages

Fixed pool of neutral messages (no customization in MVP):

```typescript
const NOTIFICATION_MESSAGES = [
  "Hora de registrar o seu dia.",
  "Seu espaço está aqui quando você quiser.",
] as const;
```

These messages MUST NEVER contain: urgency language, guilt references, streak mentions, days-missed counters, or any pressuring tone.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Valid time inputs always create an active reminder

*For any* hour in [0, 23] and minute in [0, 59], calling `createReminder` with that hour and minute (when active count < 20) SHALL succeed and produce a reminder with `active: true` and the exact hour and minute provided.

**Validates: Requirements 1.1, 1.3**

### Property 2: Invalid time inputs are always rejected

*For any* integer hour outside [0, 23] or integer minute outside [0, 59], calling `createReminder` SHALL return a validation error and not persist any record.

**Validates: Requirements 1.2**

### Property 3: Active limit counts only active reminders

*For any* user with N active reminders and M inactive reminders (where N < 20), creating a new reminder SHALL succeed regardless of M. When N = 20, creation SHALL fail regardless of M.

**Validates: Requirements 1.4, 1.5, 3.4**

### Property 4: Toggle is a round-trip operation

*For any* active reminder, deactivating then reactivating it SHALL restore the reminder to active state with the same hour and minute values (provided the active count permits reactivation).

**Validates: Requirements 3.1, 3.2**

### Property 5: Only active reminders trigger notifications

*For any* set of reminders with mixed active/inactive states, the notification check logic SHALL only produce notifications for reminders where `active === true` and the time matches.

**Validates: Requirements 2.1, 2.4**

### Property 6: Notification deduplication — at most one per reminder per day

*For any* active reminder and any number of check cycles within the same calendar day at the matching time, the notification logic SHALL fire exactly one notification for that reminder on that day.

**Validates: Requirements 2.5**

### Property 7: Notification messages are always neutral

*For any* notification fired by the system, the message body SHALL be an element of the fixed allowed set: ["Hora de registrar o seu dia.", "Seu espaço está aqui quando você quiser."]

**Validates: Requirements 2.2, 2.3**

### Property 8: Deletion removes record permanently

*For any* reminder that is deleted, querying the database for that reminder's ID SHALL return no result.

**Validates: Requirements 4.1**

### Property 9: Reminder list is sorted by time ascending

*For any* set of reminders belonging to a user, the list returned by the query function SHALL be sorted by (hour ASC, minute ASC).

**Validates: Requirements 5.2**

### Property 10: CRUD operations are independent of notification permission

*For any* notification permission state ("granted", "denied", "default"), all create/toggle/delete operations on reminders SHALL succeed or fail based solely on validation and business rules, never on permission state.

**Validates: Requirements 6.3**
