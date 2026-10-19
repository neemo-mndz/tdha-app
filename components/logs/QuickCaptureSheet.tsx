"use client";

import { useRef, useEffect, useState } from "react";
import { createLog } from "@/lib/actions/logs";
import { TaskChips } from "@/components/logs/TaskChips";
import { ActiveTaskDisplay } from "@/lib/types/tasks";

interface QuickCaptureSheetProps {
  open: boolean;
  onClose: () => void;
  date: string; // data atual (hoje)
  activeTasks: ActiveTaskDisplay[];
}

export function QuickCaptureSheet({ open, onClose, date, activeTasks }: QuickCaptureSheetProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => textareaRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!content.trim()) {
      setError("O registro não pode ser vazio.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await createLog({ content: content.trim(), date, weekPlanTaskId: selectedTaskId });
      if (result.success) {
        setContent("");
        setSelectedTaskId(null);
        onClose();
      } else {
        setError(result.error ?? "Erro ao salvar. Tente novamente.");
      }
    } catch {
      setError("Não foi possível salvar. Seu texto foi mantido; tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => { if (!submitting) onClose(); };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      close();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      close();
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
          <button onClick={close} disabled={submitting} aria-label="Fechar" className="quick-capture-modal__close">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="quick-capture-modal__form">
          <div className="quick-capture-modal__input-box">
            <TaskChips
              activeTasks={activeTasks}
              selectedTaskId={selectedTaskId}
              onSelect={setSelectedTaskId}
            />
            <textarea
              disabled={submitting}
              aria-label="Novo registro do dia"
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
            <button type="button" onClick={close} disabled={submitting} className="quick-capture-modal__btn-cancel">
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
