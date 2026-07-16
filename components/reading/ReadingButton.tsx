"use client";

import { useOptimistic, useTransition } from "react";
import { toggleReadingDay } from "@/lib/actions/readingLogs";

export interface ReadingButtonProps {
  bookId: string;
  todayMarked: boolean;
}

export function ReadingButton({ bookId, todayMarked }: ReadingButtonProps) {
  const [optimisticMarked, setOptimisticMarked] = useOptimistic(todayMarked);
  const [isPending, startTransition] = useTransition();

  const today = new Date().toISOString().slice(0, 10);

  const handleToggle = () => {
    startTransition(async () => {
      setOptimisticMarked(!optimisticMarked);
      await toggleReadingDay({ bookId, date: today });
    });
  };

  if (!bookId) {
    return (
      <div className="reading-button-wrapper">
        <button className="reading-button reading-button--disabled" disabled>
          Marquei que li hoje
        </button>
        <p className="reading-button__hint">
          Selecione um livro para registrar leitura
        </p>
      </div>
    );
  }

  return (
    <div className="reading-button-wrapper">
      <button
        className={`reading-button ${optimisticMarked ? "reading-button--marked" : ""}`}
        onClick={handleToggle}
        disabled={isPending}
        aria-pressed={optimisticMarked}
      >
        {optimisticMarked ? "✓ Lido hoje" : "Marquei que li hoje"}
      </button>
    </div>
  );
}
