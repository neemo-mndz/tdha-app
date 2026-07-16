"use client";

import { useState, useTransition } from "react";
import { createBookNote } from "@/lib/actions/bookNotes";

interface NoteFormProps {
  bookId: string;
}

export function NoteForm({ bookId }: NoteFormProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const disabled = !bookId;

  const handleSave = () => {
    if (!content.trim()) return;

    setError(null);
    startTransition(async () => {
      const result = await createBookNote({ bookId, content: content.trim() });
      if (result.success) {
        setContent("");
      } else {
        setError(result.error ?? "Não foi possível salvar.");
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="note-form">
      <textarea
        className="note-form__textarea"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Uma nota rápida sobre o que está achando (opcional)..."
        maxLength={1000}
        disabled={disabled}
        aria-label="Nova nota de leitura"
      />
      <div className="note-form__footer">
        {error && <p className="note-form__error">{error}</p>}
        <button
          className="save-btn"
          onClick={handleSave}
          disabled={disabled || !content.trim() || isPending}
        >
          {isPending ? "Salvando..." : "Salvar nota"}
        </button>
      </div>
    </div>
  );
}
