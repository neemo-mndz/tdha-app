"use client";

import { useState } from "react";

interface LogFormProps {
  onSubmit: (content: string) => Promise<void>;
}

export function LogForm({ onSubmit }: LogFormProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!content.trim()) {
      setError("O registro não pode ser vazio.");
      return;
    }
    if (content.length > 2000) {
      setError("O registro deve ter no máximo 2000 caracteres.");
      return;
    }
    setError(null);
    await onSubmit(content.trim());
    setContent("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="log-form">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="O que aconteceu hoje?"
        maxLength={2000}
        aria-label="Novo registro"
        className="log-form__textarea"
      />
      {error && <p role="alert" className="log-form__error">{error}</p>}
      <div className="log-form__footer">
        <span className="capture-actions__hint">Ctrl/Cmd + Enter para salvar</span>
        <button type="submit" className="save-btn">Registrar</button>
      </div>
    </form>
  );
}
