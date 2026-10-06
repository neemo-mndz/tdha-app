"use client";

import { useEffect, useRef, useState } from "react";
import { createDayThought, editDayThought, deleteDayThought } from "@/lib/actions/dayThoughts";
import type { DayThought } from "@/drizzle/schema";

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
});

interface Props {
  date: string;
  initialEntries: DayThought[];
  legacyInsight?: string | null;
}

export function DayThoughtsPanel({ date, initialEntries, legacyInsight }: Props) {
  const [entries, setEntries] = useState(initialEntries);
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const textarea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setEntries(initialEntries); }, [initialEntries]);

  async function save() {
    if (busy.current) return;
    if (!content.trim()) { setError("Escreva um pensamento antes de salvar."); return; }
    busy.current = true;
    setSaving(true);
    setError(null);
    setNotice("");
    try {
      const result = editingId
        ? await editDayThought({ id: editingId, date, content })
        : await createDayThought({ date, content });
      if (!result.success) { setError(result.error); return; }
      setEntries((prev) => editingId
        ? prev.map((entry) => entry.id === editingId ? result.entry : entry)
        : [...prev.filter((entry) => entry.id !== result.entry.id), result.entry]);
      setContent("");
      setEditingId(null);
      setNotice("Pensamento salvo.");
    } catch {
      setError("Não foi possível salvar. Seu texto foi mantido; tente novamente.");
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError(null);
    setNotice("");
    try {
      const result = await deleteDayThought({ id, date });
      if (!result.success) { setError(result.error); return; }
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
      setConfirmDelete(null);
      setNotice("Pensamento excluído.");
    } catch {
      setError("Não foi possível excluir. Tente novamente.");
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  return (
    <section className="day-thoughts" aria-labelledby="day-thoughts-title">
      <h2 id="day-thoughts-title" className="day-thoughts__title">Sobre o dia</h2>
      <p className="day-thoughts__time">{new Intl.DateTimeFormat("pt-BR", {
        day: "numeric", month: "long", year: "numeric", timeZone: "America/Sao_Paulo",
      }).format(new Date(`${date}T12:00:00-03:00`))}</p>
      <p className="day-thoughts__subtitle">Como o dia está sendo para você? Volte aqui para escrever ao longo do dia.</p>
      {legacyInsight && <article className="day-thoughts__entry">
        <span className="day-thoughts__time">Reflexão já registrada</span>
        <p>{legacyInsight}</p>
      </article>}
      {entries.length > 0 ? <ol className="day-thoughts__timeline">
        {entries.map((entry) => <li key={entry.id} className="day-thoughts__entry">
          <div className="day-thoughts__entry-header">
            <time className="day-thoughts__time" dateTime={new Date(entry.createdAt).toISOString()}>
              {timeFormatter.format(new Date(entry.createdAt))}
            </time>
            <div className="day-thoughts__entry-actions">
              <button type="button" disabled={saving || editingId !== null} onClick={() => {
                setContent(entry.content); setEditingId(entry.id); setError(null); setNotice("");
                setConfirmDelete(null); textarea.current?.focus();
              }} aria-label={`Editar pensamento das ${timeFormatter.format(new Date(entry.createdAt))}`}>Editar</button>
              <button type="button" disabled={saving || editingId !== null} onClick={() => setConfirmDelete(entry.id)}
                aria-label={`Excluir pensamento das ${timeFormatter.format(new Date(entry.createdAt))}`}>Excluir</button>
            </div>
          </div>
          <p>{entry.content}</p>
          {confirmDelete === entry.id && <div className="day-thoughts__confirmation">
            <span>Excluir este pensamento?</span>
            <button type="button" disabled={saving} onClick={() => remove(entry.id)}>Sim, excluir</button>
            <button type="button" disabled={saving} onClick={() => setConfirmDelete(null)}>Cancelar</button>
          </div>}
        </li>)}
      </ol> : !legacyInsight && <p className="day-thoughts__empty">Uma percepção, algo que deu certo ou uma ideia para depois. Comece por onde quiser.</p>}
      <form className="day-thoughts__form" onSubmit={(event) => { event.preventDefault(); void save(); }}>
        <label htmlFor="day-thought-content">{editingId ? "Editar pensamento" : "Um pensamento agora"}</label>
        <textarea id="day-thought-content" ref={textarea} value={content} disabled={saving}
          onChange={(event) => { setContent(event.target.value); setError(null); setNotice(""); }}
          placeholder="Hoje cheguei mais cedo e me senti mais focado. Percebi que…"
          rows={4} maxLength={5000} aria-invalid={!!error} aria-describedby={error ? "day-thought-error" : "day-thought-hint"}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); void save(); }
          }} />
        {error && <p id="day-thought-error" role="alert" className="day-thoughts__error">{error}</p>}
        <div className="day-thoughts__form-actions">
          <button type="submit" className="save-btn" disabled={saving || !content.trim()}>
            {saving ? "Salvando..." : editingId ? "Salvar alteração" : "Guardar pensamento"}
          </button>
          {editingId && <button type="button" disabled={saving} onClick={() => {
            setContent(""); setEditingId(null); setError(null);
          }}>Cancelar edição</button>}
          <span id="day-thought-hint">{content.length}/5000 · Ctrl/Cmd + Enter</span>
        </div>
      </form>
      <p role="status" className="day-thoughts__notice">{notice}</p>
    </section>
  );
}
