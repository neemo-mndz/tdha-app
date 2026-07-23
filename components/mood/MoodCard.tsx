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
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Humor de hoje
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Um toque só. Independente do que você escrever no registro do dia.
      </p>

      <div className="mt-4">
        <MoodSelector
          currentMood={optimisticMood}
          onSelect={handleMoodSelect}
          disabled={isPending}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}

      <div className="mt-4">
        <button
          type="button"
          onClick={toggleNote}
          className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          adicionar uma palavra sobre esse humor (opcional)
        </button>

        {noteVisible && (
          <div className="mt-3">
            <MoodNoteInput date={date} initialNote={initialNote} />
          </div>
        )}
      </div>
    </section>
  );
}
