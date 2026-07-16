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
    // Skip if value hasn't changed
    if (trimmed === (book.progress ?? null)) return;

    startTransition(async () => {
      const result = await updateBookProgress({
        bookId: book.id,
        progress: trimmed,
      });
      if (!result.success) {
        setError(result.error ?? "Não foi possível salvar. Tente novamente.");
      } else {
        setError(null);
      }
    });
  };

  const handleBlur = () => {
    saveProgress(progress);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveProgress(progress);
    }
  };

  return (
    <div className="panel">
      <h2 className="panel__title">{book.title}</h2>
      {book.author && (
        <p className="panel__subtitle">{book.author}</p>
      )}

      <div style={{ marginTop: "12px" }}>
        <label
          htmlFor="book-progress"
          style={{ fontSize: "13px", color: "var(--muted)", display: "block", marginBottom: "6px" }}
        >
          Progresso (opcional)
        </label>
        <input
          id="book-progress"
          type="text"
          value={progress}
          onChange={(e) => setProgress(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          maxLength={50}
          placeholder="ex: pág. 120, 40%, cap. 5"
          disabled={isPending}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "1px solid var(--line)",
            borderRadius: "10px",
            fontSize: "14px",
            fontFamily: "Inter, sans-serif",
            background: "var(--bg)",
            color: "var(--ink)",
          }}
        />
        {error && (
          <p style={{ color: "#C6685A", fontSize: "13px", marginTop: "6px" }}>
            {error}
          </p>
        )}
      </div>

      <div style={{ marginTop: "16px" }}>
        <button className="save-btn" onClick={onFinish}>
          Concluí o livro
        </button>
      </div>
    </div>
  );
}
