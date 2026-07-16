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
        setError(result.error ?? "Não foi possível salvar. Tente novamente.");
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
    <div className="capture-box">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Anote um pensamento solto..."
        maxLength={1000}
        disabled={disabled}
        aria-label="Nova nota de leitura"
      />
      {error && (
        <p style={{ color: "#C6685A", fontSize: "13px", marginTop: "8px" }}>
          {error}
        </p>
      )}
      <div className="capture-actions">
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
