"use client";

import { useOptimistic, useEffect, useTransition } from "react";
import { toggleReminder, deleteReminder } from "@/lib/actions/reminders";
import { ReminderItem } from "./ReminderItem";
import { registerReminderSW, syncRemindersToSW } from "@/lib/utils/register-sw";

type Reminder = {
  id: string;
  userId: string;
  hour: number;
  minute: number;
  active: boolean;
  createdAt: Date;
};

type OptimisticAction =
  | { type: "toggle"; id: string }
  | { type: "delete"; id: string };

export function ReminderList({ initialReminders }: { initialReminders: Reminder[] }) {
  const [optimisticReminders, addOptimistic] = useOptimistic(
    initialReminders,
    (state: Reminder[], action: OptimisticAction) => {
      if (action.type === "toggle") {
        return state.map((r) =>
          r.id === action.id ? { ...r, active: !r.active } : r
        );
      }
      if (action.type === "delete") {
        return state.filter((r) => r.id !== action.id);
      }
      return state;
    }
  );

  const [, startTransition] = useTransition();

  // Register service worker on mount and sync reminders
  useEffect(() => {
    registerReminderSW();
  }, []);

  useEffect(() => {
    syncRemindersToSW(
      initialReminders.map((r) => ({
        id: r.id,
        hour: r.hour,
        minute: r.minute,
        active: r.active,
      }))
    );
  }, [initialReminders]);

  function handleToggle(id: string) {
    startTransition(async () => {
      addOptimistic({ type: "toggle", id });
      await toggleReminder({ reminderId: id });
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      addOptimistic({ type: "delete", id });
      await deleteReminder({ reminderId: id });
    });
  }

  if (optimisticReminders.length === 0) {
    return <p className="reminder-list__empty">Nenhum lembrete configurado.</p>;
  }

  return (
    <div className="reminder-list">
      {optimisticReminders.map((reminder) => (
        <ReminderItem
          key={reminder.id}
          reminder={reminder}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
