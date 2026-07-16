"use client";

import { useState, useTransition } from "react";
import { addBookToQueue } from "@/lib/actions/books";

interface AddBookInlineProps {
  hasCurrentBook: boolean;
}

export function AddBookInline({ hasCurrentBook }: AddBookInlineProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Título é obrigatório");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await addBookToQueue({
        title: trimmedTitle,
        author: author.trim() || null,
      });

      if (result.success) {
        setTitle("");
        setAuthor("");
      } else {
        setError(result.error ?? "Não foi possível adicionar.");
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="add-book-inline">
      <input
        type="text"
        className="add-book-inline__input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Título do livro"
        maxLength={200}
        disabled={isPending}
      />
      <input
        type="text"
        className="add-book-inline__input add-book-inline__input--author"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Autor (opcional)"
        maxLength={200}
        disabled={isPending}
      />
      <button
        className="add-book-inline__btn"
        onClick={handleSubmit}
        disabled={isPending || !title.trim()}
      >
        {isPending ? "..." : "Adicionar"}
      </button>
      {error && <p className="add-book-inline__error">{error}</p>}
    </div>
  );
}
