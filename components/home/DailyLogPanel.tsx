"use client";

import { useState } from "react";
import { createLog } from "@/lib/actions/logs";

interface DailyLogPanelProps {
  date: string;
}

export function DailyLogPanel({ date }: DailyLogPanelProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) {
      setError("O registro não pode ser vazio.");
      return;
    }
    if (content.length > 2000) {
      setError("O registro deve ter no máximo 2000 caracteres.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const result = await createLog({ content: content.trim(), date });
    setSubmitting(false);
    if (result.success) {
      setContent("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } else {
      setError(result.error ?? "Erro ao salvar.");
    }
  };

  return (
    <div className="panel">
      <h2 className="panel__title">Registro do dia</h2>
      <p className="panel__subtitle">Brain dump rápido. Escreva o que quiser, sem se preocupar.</p>

      <div className="capture-box">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="O que aconteceu?"
          maxLength={2000}
        />
        {error && <p style={{ color: "#C6685A", fontSize: "13px", marginTop: "8px" }}>{error}</p>}
        {success && <p style={{ color: "var(--structure)", fontSize: "13px", marginTop: "8px" }}>✓ Salvo!</p>}
        <div className="capture-actions">
          <button className="save-btn" onClick={handleSave} disabled={submitting}>
            {submitting ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
