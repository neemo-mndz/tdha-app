"use client";

import { useEffect, useRef, useState } from "react";
import { deleteAgendaEntry, saveAgendaEntry } from "@/lib/actions/agenda";
import { AGENDA_TAGS, PERIODS, PERIOD_LABELS, TAG_LABELS, periodForTime, type AgendaEntry, type AgendaPeriod, type AgendaTag } from "@/lib/agenda/model";
import styles from "./Agenda.module.css";

export function AgendaForm({ date, entry, defaultTag, onClose, onSaved, onDeleted }: {
  date: string; entry?: AgendaEntry; defaultTag?: AgendaTag; onClose: () => void;
  onSaved: (entry: AgendaEntry) => void; onDeleted: (id: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const busy = useRef(false);
  const [title, setTitle] = useState(entry?.title ?? "");
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [entryDate, setEntryDate] = useState(entry?.date ?? date);
  const [tags, setTags] = useState<AgendaTag[]>(entry?.tags ?? [defaultTag ?? "pessoal"]);
  const [period, setPeriod] = useState<AgendaPeriod>(entry?.period ?? "anytime");
  const [startTime, setStartTime] = useState(entry?.startTime ?? "");
  const [endTime, setEndTime] = useState(entry?.endTime ?? "");
  const [completed, setCompleted] = useState(entry?.completed ?? false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true; setPending(true); setError("");
    try {
      const result = await saveAgendaEntry({ title, notes, date: entryDate, tags, period, completed,
        startTime: startTime || null, endTime: endTime || null }, entry?.id);
      if (result.success) onSaved(result.entry); else setError(result.error);
    } catch { setError("Não foi possível salvar. Suas informações foram mantidas; tente novamente."); }
    finally { busy.current = false; setPending(false); }
  }
  async function remove() {
    if (!entry || busy.current) return;
    busy.current = true; setPending(true); setError("");
    try {
      const result = await deleteAgendaEntry(entry.id);
      if (result.success) onDeleted(entry.id); else setError(result.error);
    } catch { setError("Não foi possível excluir. Tente novamente."); }
    finally { busy.current = false; setPending(false); }
  }

  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="agenda-form-title"
    onCancel={event => { event.preventDefault(); if (!busy.current) onClose(); }}>
    <form onSubmit={submit} className={styles.form}>
      <div className={styles.formHeader}>
        <h2 id="agenda-form-title">{entry ? "Editar tarefa ou compromisso" : "Nova tarefa ou compromisso"}</h2>
        <button type="button" className={styles.iconButton} aria-label="Fechar formulário" onClick={onClose} disabled={pending}>✕</button>
      </div>
      <label>Título
        <input autoFocus required maxLength={160} value={title} onChange={event => setTitle(event.target.value)} disabled={pending} placeholder="Ex.: reunião da equipe ou relatório entregue" />
      </label>
      <div className={styles.formGrid}>
        <label>Data<input required type="date" value={entryDate} onChange={event => setEntryDate(event.target.value)} disabled={pending} /></label>
        <label>Período<select value={startTime ? periodForTime(startTime) : period} onChange={event => setPeriod(event.target.value as AgendaPeriod)} disabled={pending || !!startTime}>
          {PERIODS.map(value => <option key={value} value={value}>{PERIOD_LABELS[value]}</option>)}
        </select></label>
        <label>Início <span className={styles.optional}>(opcional)</span><input type="time" value={startTime} onChange={event => {
          const value = event.target.value; setStartTime(value); if (!value) setEndTime("");
        }} disabled={pending} /></label>
        <label>Fim <span className={styles.optional}>(opcional)</span><input type="time" value={endTime} onChange={event => setEndTime(event.target.value)} disabled={pending || !startTime} /></label>
      </div>
      <fieldset disabled={pending} className={styles.tagFieldset}>
        <legend>Assuntos</legend>
        <div className={styles.tags}>{AGENDA_TAGS.map(tag => <label key={tag} className={styles.tagOption} data-tag={tag}>
          <input type="checkbox" checked={tags.includes(tag)} onChange={() => setTags(current => current.includes(tag) ? current.filter(value => value !== tag) : [...current, tag])} />
          {TAG_LABELS[tag]}
        </label>)}</div>
      </fieldset>
      <label className={styles.completedOption}>
        <input type="checkbox" checked={completed} onChange={event => setCompleted(event.target.checked)} disabled={pending} />
        Já realizada
      </label>
      <label>Observações <span className={styles.optional}>(opcional)</span>
        <textarea rows={3} maxLength={2000} value={notes} onChange={event => setNotes(event.target.value)} disabled={pending} placeholder="Local, detalhes ou algo para lembrar" />
      </label>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <div className={styles.formActions}>
        <button type="button" className={styles.secondary} onClick={onClose} disabled={pending}>Cancelar</button>
        <button type="submit" className={styles.primary} disabled={pending}>{pending ? "Salvando…" : "Salvar"}</button>
      </div>
      {entry && <div className={styles.deleteArea}>
        {confirmDelete ? <><span>Excluir esta tarefa ou compromisso?</span><button type="button" className={styles.danger} onClick={remove} disabled={pending}>Confirmar exclusão</button><button type="button" className={styles.textButton} disabled={pending} onClick={() => setConfirmDelete(false)}>Manter</button></>
          : <button type="button" className={styles.textButton} disabled={pending} onClick={() => setConfirmDelete(true)}>Excluir tarefa ou compromisso</button>}
      </div>}
    </form>
  </dialog>;
}
