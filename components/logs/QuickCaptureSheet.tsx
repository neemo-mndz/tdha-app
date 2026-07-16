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
    const result = await createLog({ content: content.trim(), date });
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

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Captura rápida"
      onKeyDown={handleKeyDown}
    >
      <div>
        <h2>Captura rápida</h2>
        <button onClick={onClose} aria-label="Fechar">
          ✕
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="O que está acontecendo?"
          maxLength={2000}
        />
        {error && <p role="alert">{error}</p>}
        <button type="submit">Registrar</button>
      </form>
    </div>
  );
}
