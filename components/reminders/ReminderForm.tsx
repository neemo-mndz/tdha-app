"use client";

import { useState, useTransition } from "react";
import { createReminder } from "@/lib/actions/reminders";
import { requestNotificationPermission } from "./NotificationBanner";

export function ReminderForm() {
  const [hour, setHour] = useState<string>("");
  const [minute, setMinute] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const h = parseInt(hour, 10);
    const m = parseInt(minute, 10);

    if (isNaN(h) || h < 0 || h > 23) {
      setError("Hora deve ser entre 0 e 23.");
      return;
    }
    if (isNaN(m) || m < 0 || m > 59) {
      setError("Minuto deve ser entre 0 e 59.");
      return;
    }

    startTransition(async () => {
      const result = await createReminder({ hour: h, minute: m });
      if (!result.success) {
        setError(result.error);
      } else {
        setHour("");
        setMinute("");
        // Request notification permission on first reminder creation
        requestNotificationPermission();
      }
    });
  }

  return (
    <form className="reminder-form" onSubmit={handleSubmit}>
      <div className="reminder-form__inputs">
        <input
          type="number"
          className="reminder-form__input"
          placeholder="Hora"
          min={0}
          max={23}
          value={hour}
          onChange={(e) => setHour(e.target.value)}
          aria-label="Hora (0-23)"
        />
        <span className="reminder-form__separator">:</span>
        <input
          type="number"
          className="reminder-form__input"
          placeholder="Min"
          min={0}
          max={59}
          value={minute}
          onChange={(e) => setMinute(e.target.value)}
          aria-label="Minuto (0-59)"
        />
      </div>
      <button
        type="submit"
        className="reminder-form__btn"
        disabled={isPending}
      >
        {isPending ? "..." : "Criar"}
      </button>
      {error && <p className="reminder-form__error">{error}</p>}
    </form>
  );
}
