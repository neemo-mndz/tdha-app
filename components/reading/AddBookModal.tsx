"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { addBookAsCurrent, addBookToQueue } from "@/lib/actions/books";

interface AddBookModalProps {
  mode: "current" | "queue";
  hasCurrentBook: boolean;
  onClose: () => void;
}

export function AddBookModal({ mode, hasCurrentBook, onClose }: AddBookModalProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const showReplaceWarning = mode === "current" && hasCurrentBook;

  const handleSubmit = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Título é obrigatório");
      return;
    }
    if (trimmedTitle.length > 200) {
      setError("Título deve ter no máximo 200 caracteres");
      return;
    }

    setError(null);
    startTransition(async () => {
      const input = {
        title: trimmedTitle,
        author: author.trim() || null,
      };

      const result =
        mode === "current"
          ? await addBookAsCurrent(input)
          : await addBookToQueue(input);

      if (result.success) {
        onClose();
      } else {
        setError(result.error ?? "Não foi possível adicionar. Tente novamente.");
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const buttonLabel =
    mode === "current" ? "Adicionar como atual" : "Adicionar à fila";

  return (
    <div
      className="quick-capture-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={
          mode === "current"
            ? "Adicionar livro como atual"
            : "Adicionar livro à fila"
        }
        className="quick-capture-modal"
        tabIndex={-1}
      >
        <div className="quick-capture-modal__header">
          <div>
            <h2 className="quick-capture-modal__title">
              {mode === "current" ? "Novo livro atual" : "Adicionar à fila"}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="quick-capture-modal__close"
          >
            ✕
          </button>
        </div>

        <div className="quick-capture-modal__form">
          {showReplaceWarning && (
            <p
              role="alert"
              style={{
                marginBottom: "12px",
                padding: "8px 12px",
                borderRadius: "6px",
                backgroundColor: "var(--color-warning-bg, #FFF3CD)",
                color: "var(--color-warning-text, #856404)",
                fontSize: "13px",
              }}
            >
              O livro atual voltará para a fila
            </p>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="add-book-title"
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              Título <span aria-hidden="true">*</span>
            </label>
            <input
              id="add-book-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do livro"
              maxLength={200}
              required
              aria-required="true"
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="add-book-author"
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              Autor (opcional)
            </label>
            <input
              id="add-book-author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Nome do autor"
              maxLength={200}
              style={{ width: "100%" }}
            />
          </div>

          {error && (
            <p role="alert" className="quick-capture-modal__error">
              {error}
            </p>
          )}

          <div className="quick-capture-modal__footer">
            <button
              type="button"
              onClick={onClose}
              className="quick-capture-modal__btn-cancel"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="quick-capture-modal__btn-save"
            >
              {isPending ? "Adicionando..." : buttonLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
