"use client";

import { useState, useTransition } from "react";
import { saveMoodNote } from "@/lib/actions/mood";

interface MoodNoteInputProps {
  date: string;
  initialNote: string | null;
}

export function MoodNoteInput({ date, initialNote }: MoodNoteInputProps) {
  const [note, setNote] = useState(initialNote ?? "");
  const [isPending, startTransition] = useTransition();

  const charCount = note.length;
  const isAtLimit = charCount >= 80;

  function handleSave() {
    const trimmed = note.trim();
    const valueToSave = trimmed.length === 0 ? null : trimmed;

    startTransition(async () => {
      await saveMoodNote({ date, note: valueToSave });
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={80}
          placeholder="Uma palavra sobre seu humor..."
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
          aria-label="Nota sobre o humor"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Salvar
        </button>
      </div>
      <span
        className={`text-xs ${isAtLimit ? "text-red-500 font-medium" : "text-zinc-500"}`}
        aria-live="polite"
      >
        {charCount}/80
      </span>
    </div>
  );
}
