"use client";

import { useState, useTransition } from "react";
import { updateBookProgress } from "@/lib/actions/books";
import type { CurrentBookDisplay } from "@/lib/types/reading";

interface CurrentBookCardProps {
  book: CurrentBookDisplay;
  onFinish: () => void;
}

export function CurrentBookCard({ book, onFinish }: CurrentBookCardProps) {
  const [progress, setProgress] = useState(book.progress ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const saveProgress = (value: string) => {
    const trimmed = value.trim() || null;
    if (trimmed === (book.progress ?? null)) return;

    startTransition(async () => {
      const result = await updateBookProgress({
        bookId: book.id,
        progress: trimmed,
      });
      if (!result.success) {
        setError(result.error ?? "Não foi possível salvar.");
      } else {
        setError(null);
      }
    });
  };

  const handleBlur = () => saveProgress(progress);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveProgress(progress);
    }
  };

  return (
    <div className="current-book">
      <div className="current-book__cover" aria-hidden="true">
        <span>Capa</span>
      </div>
      <div className="current-book__info">
        <h3 className="current-book__title">{book.title}</h3>
        {book.author && (
          <p className="current-book__author">{book.author}</p>
        )}
        <div className="current-book__progress-row">
          <label htmlFor="book-progress" className="current-book__progress-label">
            Onde parei (opcional):
          </label>
          <input
            id="book-progress"
            type="text"
            className="current-book__progress-input"
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            maxLength={50}
            placeholder="pág. 120"
            disabled={isPending}
          />
        </div>
        {error && <p className="current-book__error">{error}</p>}
      </div>
    </div>
  );
}
