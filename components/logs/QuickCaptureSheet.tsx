"use client";

import { useRef, useEffect, useState } from "react";
import { createLog } from "@/lib/actions/logs";

interface QuickCaptureSheetProps {
  open: boolean;
  onClose: () => void;
  date: string; // data atual (hoje)
}

export function QuickCaptureSheet({ open, onClose, date }: QuickCaptureSheetProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("O registro não pode ser vazio.");
      return;
    }
    setSubmitting(true);
    const result = await createLog({ content: content.trim(), date });
    setSubmitting(false);
    if (result.success) {
      setContent("");
      setError(null);
      onClose();
    } else {
      setError(result.error ?? "Erro ao salvar. Tente novamente.");
    }
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

  if (!open) return null;

  return (
    <div
      className="quick-capture-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Captura rápida"
        className="quick-capture-modal"
      >
        <div className="quick-capture-modal__header">
          <div>
            <h2 className="quick-capture-modal__title">Captura instantânea</h2>
            <p className="quick-capture-modal__sub">Salve agora, sem se preocupar em organizar.</p>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="quick-capture-modal__close">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="quick-capture-modal__form">
          <div className="quick-capture-modal__input-box">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="O que está acontecendo?"
              maxLength={2000}
              className="quick-capture-modal__textarea"
            />
          </div>
          {error && <p role="alert" className="quick-capture-modal__error">{error}</p>}
          <div className="quick-capture-modal__footer">
            <button type="button" onClick={onClose} className="quick-capture-modal__btn-cancel">
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="quick-capture-modal__btn-save">
              {submitting ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
