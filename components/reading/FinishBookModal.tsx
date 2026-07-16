"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { finishCurrentBook } from "@/lib/actions/books";

interface FinishBookModalProps {
  bookId: string;
  bookTitle: string;
  onClose: () => void;
}

export function FinishBookModal({ bookId, bookTitle, onClose }: FinishBookModalProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [review, setReview] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const handleRatingClick = (value: number) => {
    setRating((prev) => (prev === value ? null : value));
  };

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await finishCurrentBook({
        bookId,
        rating,
        review: review.trim() || null,
      });

      if (result.success) {
        onClose();
      } else {
        setError(result.error ?? "Não foi possível concluir. Tente novamente.");
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
        aria-label={`Concluir livro: ${bookTitle}`}
        className="quick-capture-modal"
        tabIndex={-1}
      >
        <div className="quick-capture-modal__header">
          <div>
            <h2 className="quick-capture-modal__title">Concluir livro</h2>
            <p className="quick-capture-modal__sub">{bookTitle}</p>
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
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500 }}
            >
              Avaliação (opcional)
            </label>
            <div style={{ display: "flex", gap: "6px" }} role="group" aria-label="Avaliação de 1 a 5">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleRatingClick(value)}
                  aria-pressed={rating === value}
                  aria-label={`${value} de 5`}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "6px",
                    border: rating === value ? "2px solid var(--color-accent, #7C5CFC)" : "1px solid var(--color-border, #ddd)",
                    background: rating === value ? "var(--color-accent, #7C5CFC)" : "transparent",
                    color: rating === value ? "#fff" : "inherit",
                    fontWeight: 600,
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="finish-book-review"
              style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500 }}
            >
              Resenha (opcional)
            </label>
            <textarea
              id="finish-book-review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Escreva sua resenha (opcional)..."
              maxLength={2000}
              rows={4}
              style={{ width: "100%", resize: "vertical" }}
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
              {isPending ? "Concluindo..." : "Concluir"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
