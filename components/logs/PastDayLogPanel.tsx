"use client";

import { useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { createPastLog } from "@/lib/actions/logs";
import type { LogWithTask } from "@/lib/db/queries/logs";
import styles from "./PastDayLogPanel.module.css";

export function PastDayLogPanel({ date, onSaved }: {
  date: string; onSaved: (log: LogWithTask) => void;
}) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [time, setTime] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const busy = useRef(false);
  const contentInput = useRef<HTMLInputElement>(null);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true; setPending(true); setError(""); setNotice("");
    try {
      const result = await createPastLog({ date, content: content.trim(), time,
        timezoneOffset: new Date(`${date}T${time}:00`).getTimezoneOffset() });
      if (!result.success) { setError(result.error); return; }
      onSaved(result.log);
      setContent(""); setTime(""); setNotice("Atividade adicionada.");
    } catch {
      setError("Não foi possível salvar. Seus dados foram mantidos; tente novamente.");
    } finally {
      busy.current = false; setPending(false);
      requestAnimationFrame(() => contentInput.current?.focus());
    }
  }

  return <section className={styles.panel} aria-label="Atualizar dia anterior">
    <header className={styles.header}>
      <div><h3>Completar este dia</h3><p>{format(parseISO(date), "dd/MM/yyyy")}</p></div>
      {!open && <button type="button" className={styles.add} onClick={() => { setOpen(true); setNotice(""); }} aria-label="Adicionar atividade">+ Adicionar</button>}
    </header>
    {open && <form onSubmit={save} className={styles.form}>
      <label className={styles.activity}>Atividade
        <input ref={contentInput} autoFocus required maxLength={2000} value={content} onChange={event => setContent(event.target.value)} disabled={pending} placeholder="O que você fez nesse dia?" />
      </label>
      <label className={styles.time}>Horário
        <input type="time" required value={time} onChange={event => setTime(event.target.value)} disabled={pending} />
      </label>
      <div className={styles.actions}>
        <button type="submit" className={styles.add} disabled={pending || !content.trim() || !time}>{pending ? "Salvando…" : "Salvar"}</button>
        <button type="button" className={styles.cancel} disabled={pending} onClick={() => { setOpen(false); setError(""); }}>Cancelar</button>
      </div>
    </form>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <p role="status" className={styles.notice}>{notice}</p>
  </section>;
}
