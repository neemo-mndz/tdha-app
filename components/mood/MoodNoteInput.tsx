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
    <div className="mood-note">
      <div className="mood-note__row">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={80}
          placeholder="Uma palavra sobre seu humor..."
          className="mood-note__input"
          aria-label="Nota sobre o humor"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="mood-note__save"
        >
          Salvar
        </button>
      </div>
      <span
        className={`mood-note__count${isAtLimit ? " mood-note__count--limit" : ""}`}
        aria-live="polite"
      >
        {charCount}/80
      </span>
    </div>
  );
}
