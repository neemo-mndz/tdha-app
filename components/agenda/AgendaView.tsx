"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { setAgendaCompleted } from "@/lib/actions/agenda";
import { AGENDA_TAGS, PERIODS, PERIOD_LABELS, TAG_LABELS, agendaPath, agendaWeek, sortAgenda, type AgendaEntry, type AgendaTag } from "@/lib/agenda/model";
import { AgendaForm } from "./AgendaForm";
import styles from "./Agenda.module.css";

type Filter = "all" | AgendaTag;
export function AgendaView({ initialEntries, date, today, view, tag }: {
  initialEntries: AgendaEntry[]; date: string; today: string; view: "day" | "week"; tag: Filter;
}) {
  const router = useRouter();
  const [entries, setEntries] = useState(initialEntries);
  const [editor, setEditor] = useState<{ date: string; entry?: AgendaEntry } | null>(null);
  const [error, setError] = useState("");
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const busyIds = useRef(new Set<string>());
  const days = agendaWeek(date);
  const filtered = entries.filter(entry => tag === "all" || entry.tags.includes(tag));
  const dayEntries = filtered.filter(entry => entry.date === date);
  const planned = filtered.filter(entry => !entry.completed).length;

  async function toggle(entry: AgendaEntry) {
    if (busyIds.current.has(entry.id)) return;
    busyIds.current.add(entry.id); setPendingIds(ids => [...ids, entry.id]); setError("");
    try {
      const result = await setAgendaCompleted({ id: entry.id, completed: !entry.completed });
      if (result.success) setEntries(current => current.map(item => item.id === entry.id ? result.entry : item));
      else setError(result.error);
    } catch { setError("Não foi possível atualizar o compromisso. Tente novamente."); }
    finally { busyIds.current.delete(entry.id); setPendingIds(ids => ids.filter(id => id !== entry.id)); }
  }
  function saved(entry: AgendaEntry) {
    setEntries(current => [...current.filter(item => item.id !== entry.id), entry]); setEditor(null);
    const nextTag = tag !== "all" && !entry.tags.includes(tag) ? "all" : tag;
    if (entry.date !== date || nextTag !== tag) router.push(agendaPath(entry.date, view, nextTag));
    router.refresh();
  }
  function row(entry: AgendaEntry, compact = false) {
    const pending = pendingIds.includes(entry.id);
    return <li key={entry.id} className={styles.entry} data-completed={entry.completed}>
      <button type="button" className={styles.check} aria-label={`${entry.completed ? "Reabrir" : "Concluir"}: ${entry.title}`}
        aria-pressed={entry.completed} disabled={pending} onClick={() => toggle(entry)}>{pending ? "…" : entry.completed ? "✓" : ""}</button>
      <button type="button" className={styles.entryBody} disabled={pending} onClick={() => setEditor({ date: entry.date, entry })} aria-label={`Editar: ${entry.title}`}>
        {entry.startTime && <span className={styles.time}>{entry.startTime}{entry.endTime ? ` – ${entry.endTime}` : ""}</span>}
        <span className={styles.entryTitle}>{entry.title}</span>
        {!compact && entry.notes && <span className={styles.notes}>{entry.notes}</span>}
        <span className={styles.tags}>{entry.tags.map(value => <span key={value} data-tag={value} className={styles.tag}>{TAG_LABELS[value]}</span>)}</span>
      </button>
    </li>;
  }
  return <main className={styles.page}>
    <header className={styles.heading}>
      <div><p className={styles.eyebrow}>Um plano de cada vez</p><h1>Sua agenda<span>.</span></h1></div>
      <button type="button" className={styles.primary} onClick={() => setEditor({ date })}>+ Compromisso</button>
    </header>
    <div className={styles.toolbar}>
      <div className={styles.navigator}>
        <Link href={agendaPath(format(addDays(parseISO(date), -7), "yyyy-MM-dd"), view, tag)} aria-label="Semana anterior" className={styles.iconButton}>←</Link>
        <span>{format(parseISO(days[0]), "d MMM", { locale: ptBR })} – {format(parseISO(days[6]), "d MMM yyyy", { locale: ptBR })}</span>
        <Link href={agendaPath(format(addDays(parseISO(date), 7), "yyyy-MM-dd"), view, tag)} aria-label="Próxima semana" className={styles.iconButton}>→</Link>
      </div>
      <Link href={agendaPath(today, view, tag)} className={styles.secondary}>Hoje</Link>
      <label className={styles.datePicker}>Ir para data<input aria-label="Ir para data" type="date" value={date} onChange={event => {
        if (event.target.value) router.push(agendaPath(event.target.value, view, tag));
      }} /></label>
      <div className={styles.segmented} aria-label="Visualização da agenda">
        <Link href={agendaPath(date, "day", tag)} aria-current={view === "day" ? "page" : undefined}>Dia</Link>
        <Link href={agendaPath(date, "week", tag)} aria-current={view === "week" ? "page" : undefined}>Semana</Link>
      </div>
    </div>
    <nav className={styles.weekStrip} aria-label="Dias da semana">{days.map(day => {
      const count = filtered.filter(entry => entry.date === day && !entry.completed).length;
      return <Link key={day} href={agendaPath(day, view, tag)} className={styles.day} aria-current={day === date ? "date" : undefined}
        data-today={day === today} aria-label={`${format(parseISO(day), "EEEE, d 'de' MMMM", { locale: ptBR })}, ${count} pendentes`}>
        <span>{format(parseISO(day), "EEE", { locale: ptBR }).replace(".", "")}</span><strong>{format(parseISO(day), "dd")}</strong>
        <span className={styles.dayCount}>{count ? `${count} ${count === 1 ? "plano" : "planos"}` : "—"}</span>
      </Link>;
    })}</nav>
    <div className={styles.filterBar}>
      <div className={styles.filters} aria-label="Filtrar por assunto">{(["all", ...AGENDA_TAGS] as const).map(value => <Link key={value}
        href={agendaPath(date, view, value)} className={styles.filter} data-tag={value} aria-current={tag === value ? "page" : undefined}>
        {value === "all" ? "Todos" : TAG_LABELS[value]}
      </Link>)}</div>
      <span className={styles.summary}>{planned} {planned === 1 ? "plano pendente" : "planos pendentes"} na semana</span>
    </div>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {view === "day" ? <section className={styles.sheet} aria-label="Folha diária">
      <header className={styles.sheetHeader}><div><p>{format(parseISO(date), "EEEE", { locale: ptBR })}</p><h2>{format(parseISO(date), "d 'de' MMMM", { locale: ptBR })}</h2></div>
        <span>{dayEntries.filter(entry => entry.completed).length}/{dayEntries.length} concluídos</span></header>
      {PERIODS.map(period => <section key={period} className={styles.period} aria-label={PERIOD_LABELS[period]}>
        <h3><span aria-hidden="true">{period === "morning" ? "☀" : period === "afternoon" ? "◐" : period === "evening" ? "☾" : "○"}</span>{PERIOD_LABELS[period]}</h3>
        {dayEntries.some(entry => entry.period === period) ? <ul className={styles.entries}>{sortAgenda(dayEntries.filter(entry => entry.period === period)).map(entry => row(entry))}</ul>
          : <p className={styles.empty}>Espaço livre.</p>}
      </section>)}
      <button type="button" className={styles.addInline} onClick={() => setEditor({ date })}>+ Planejar algo para este dia</button>
    </section> : <section className={styles.weekBoard} aria-label="Planejamento semanal">
      {days.map(day => <section key={day} className={styles.weekCard} data-today={day === today}>
        <header><Link href={agendaPath(day, "day", tag)}><span>{format(parseISO(day), "EEE", { locale: ptBR })}</span><strong>{format(parseISO(day), "dd/MM")}</strong></Link>
          <button className={styles.iconButton} type="button" aria-label={`Adicionar em ${format(parseISO(day), "dd/MM")}`} onClick={() => setEditor({ date: day })}>+</button></header>
        {filtered.some(entry => entry.date === day) ? <ul className={styles.entries}>{sortAgenda(filtered.filter(entry => entry.date === day)).map(entry => row(entry, true))}</ul>
          : <button type="button" className={styles.weekEmpty} onClick={() => setEditor({ date: day })}>Dia em aberto<br /><span>+ Adicionar plano</span></button>}
      </section>)}
    </section>}
    {editor && <AgendaForm date={editor.date} entry={editor.entry} defaultTag={tag === "all" ? undefined : tag} onClose={() => setEditor(null)} onSaved={saved}
      onDeleted={id => { setEntries(current => current.filter(entry => entry.id !== id)); setEditor(null); router.refresh(); }} />}
  </main>;
}
