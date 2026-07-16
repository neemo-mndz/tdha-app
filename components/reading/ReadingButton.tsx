"use client";

import { useOptimistic, useTransition } from "react";
import { toggleReadingDay } from "@/lib/actions/readingLogs";

export interface ReadingButtonProps {
  bookId: string;
  todayMarked: boolean;
  onFinish?: () => void;
}

export function ReadingButton({ bookId, todayMarked, onFinish }: ReadingButtonProps) {
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
    return null;
  }

  return (
    <div className="reading-actions">
      <button
        className={`reading-button ${optimisticMarked ? "reading-button--marked" : ""}`}
        onClick={handleToggle}
        disabled={isPending}
        aria-pressed={optimisticMarked}
      >
        {optimisticMarked ? "✓ Marquei que li hoje" : "Marquei que li hoje"}
      </button>
      {onFinish && (
        <button className="reading-finish-link" onClick={onFinish}>
          Concluí o livro
        </button>
      )}
    </div>
  );
}
