"use client";

import { useOptimistic, useState, useTransition, useEffect, useCallback } from "react";
import type { MoodValue } from "@/lib/types/calendar";
import { saveMood } from "@/lib/actions/mood";
import { MoodSelector } from "@/components/mood/MoodSelector";
import { MoodNoteInput } from "@/components/mood/MoodNoteInput";

interface MoodCardProps {
  date: string; // yyyy-MM-dd
  initialMood: MoodValue | null;
  initialNote: string | null;
}

export function MoodCard({ date, initialMood, initialNote }: MoodCardProps) {
  const [optimisticMood, setOptimisticMood] = useOptimistic(initialMood);
  const [isPending, startTransition] = useTransition();
  const [noteVisible, setNoteVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleMoodSelect = useCallback(
    (mood: MoodValue | null) => {
      // Clear error on new interaction
      setError(null);

      startTransition(async () => {
        setOptimisticMood(mood);
        const result = await saveMood({ date, mood });
        if (!result.success) {
          setError("Não foi possível salvar. Tente novamente.");
        }
      });
    },
    [date, setOptimisticMood, startTransition]
  );

  const toggleNote = () => {
    setNoteVisible((prev) => !prev);
  };

  return (
    <section className="panel mood-card">
      <h2 className="panel__title">Humor de hoje</h2>
      <p className="panel__subtitle">
        Um toque só. Independente do que você escrever no registro do dia.
      </p>

      <MoodSelector
        currentMood={optimisticMood}
        onSelect={handleMoodSelect}
        disabled={isPending}
      />

      {error && (
        <p role="alert" className="mood-card__error">
          {error}
        </p>
      )}

      <div className="mood-card__note-section">
        <button
          type="button"
          onClick={toggleNote}
          className="mood-card__note-toggle"
        >
          adicionar uma palavra sobre esse humor (opcional)
        </button>

        {noteVisible && (
          <div className="mood-card__note-input">
            <MoodNoteInput date={date} initialNote={initialNote} />
          </div>
        )}
      </div>
    </section>
  );
}
