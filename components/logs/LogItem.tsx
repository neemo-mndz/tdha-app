"use client";

import { useState } from "react";
import type { LogWithTask } from "@/lib/db/queries/logs";
import { updateLog, deleteLog, updateLogTime } from "@/lib/actions/logs";
import type { OptimisticAction } from "./optimisticLogs";
import { TagChips } from "./TagChips";
import { TagEditor } from "./TagEditor";
import styles from "./LogItem.module.css";

interface LogItemProps {
  log: LogWithTask;
  taskName?: string | null;
  dispatch: (action: OptimisticAction) => void;
  date: string;
  allUserTags?: { id: string; name: string }[];
}

/**
 * Validates a time string for the HH:mm format and valid ranges.
 * Returns an error message string if invalid, or null if valid.
 */
export function validateTime(time: string): string | null {
  if (!time || time.trim().length === 0) {
    return "O horário é obrigatório";
  }

  if (!/^\d{2}:\d{2}$/.test(time)) {
    return "Formato esperado: HH:mm";
  }

  const [hh, mm] = time.split(":").map(Number);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) {
    return "Horário inválido. Horas: 00-23, Minutos: 00-59";
  }

  return null;
}

/**
 * Formats a Date as "HH:mm" in local timezone for display.
 */
function formatTimeLocal(date: Date): string {
  const d = new Date(date);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function LogItem({ log, taskName, dispatch, date, allUserTags = [] }: LogItemProps) {
  const time = formatTimeLocal(new Date(log.createdAt));
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(log.content);
  const [editDate, setEditDate] = useState(date);
  const [editTime, setEditTime] = useState(formatTimeLocal(new Date(log.createdAt)));
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [tagsOpen, setTagsOpen] = useState(false);

  const originalTime = formatTimeLocal(new Date(log.createdAt));

  const handleUpdate = async () => {
    setTimeError(null);
    setDateError(null);
    setError(null);

    // Client-side validation before server call
    const validationError = validateTime(editTime);
    if (validationError) {
      setTimeError(validationError);
      return;
    }

    if (!editDate || !/^\d{4}-\d{2}-\d{2}$/.test(editDate)) {
      setDateError("Data inválida");
      return;
    }

    const dateChanged = editDate !== date;
    const timeChanged = editTime !== originalTime;

    const result = await updateLog({
      logId: log.id,
      content: editContent,
      date,
      newDate: dateChanged ? editDate : undefined,
    });

    if (result.success) {
      if (dateChanged) {
        dispatch({ type: "remove", id: log.id });
      } else {
        dispatch({ type: "update", id: log.id, content: editContent });
      }
    } else {
      setEditContent(log.content);
      setError(result.error ?? "Erro ao salvar");
      return;
    }

    if (timeChanged || dateChanged) {
      const timeResult = await updateLogTime({
        logId: log.id,
        time: editTime,
        date: editDate,
        timezoneOffset: new Date().getTimezoneOffset(),
      });
      if (!timeResult.success) {
        setEditTime(originalTime);
        setTimeError(timeResult.error ?? "Erro ao salvar horário. Tente novamente.");
        return;
      }
    }

    setEditing(false);
  };

  const handleDelete = async () => {
    dispatch({ type: "remove", id: log.id });
    const result = await deleteLog({ logId: log.id, date });
    if (!result.success) {
      setError(result.error ?? "Erro ao excluir");
    }
  };

  if (editing) {
    return (
      <div className="log-item-card">
        <div className="log-item-card__datetime-row">
          <input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            aria-label="Selecionar data do registro"
            className="log-item-card__date-input"
          />
          <input
            type="time"
            value={editTime}
            onChange={(e) => setEditTime(e.target.value)}
            aria-label="Selecionar horário do registro"
            className="log-item-card__time-input"
          />
        </div>
        {dateError && <p role="alert" className="log-form__error">{dateError}</p>}
        {timeError && <p role="alert" className="log-form__error">{timeError}</p>}
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          maxLength={2000}
          aria-label="Editar registro"
          className="log-form__textarea"
        />
        <div className="log-item-card__actions" style={{ marginTop: "10px" }}>
          <button onClick={handleUpdate} className="save-btn">Salvar</button>
          <button
            onClick={() => {
              setEditing(false);
              setEditContent(log.content);
              setEditDate(date);
              setEditTime(formatTimeLocal(new Date(log.createdAt)));
              setError(null);
              setTimeError(null);
              setDateError(null);
            }}
            className="log-item-card__btn"
          >
            Cancelar
          </button>
        </div>
        {error && <p role="alert" className="log-form__error">{error}</p>}
      </div>
    );
  }

  return (
    <div className={`${styles.logItem} log-item`}>
      <span className={styles.logItemTime}>{time}</span>
      <span className={`${styles.logItemBody} log-item__body`}>
        {log.content}
        {taskName && <span className={styles.logItemTag}>{taskName}</span>}
      </span>
      {log.tags.length > 0 && (
        <TagChips
          tags={log.tags}
          selectedTagIds={new Set<string>()}
          onToggle={() => {}}
          size="sm"
        />
      )}
      <span className={styles.logItemActions}>
        <button onClick={() => setEditing(true)} className={styles.logItemActionBtn}>Editar</button>
        <button
          onClick={() => setTagsOpen((open) => !open)}
          className={styles.logItemActionBtn}
          aria-expanded={tagsOpen}
          aria-label="Editar tags do registro"
        >
          Tags
        </button>
        {confirmingDelete ? (
          <>
            <button onClick={handleDelete} className={`${styles.logItemActionBtn} ${styles.logItemActionBtnDanger}`}>Confirmar</button>
            <button onClick={() => setConfirmingDelete(false)} className={styles.logItemActionBtn}>×</button>
          </>
        ) : (
          <button onClick={() => setConfirmingDelete(true)} className={`${styles.logItemActionBtn} ${styles.logItemActionBtnDanger}`}>Excluir</button>
        )}
      </span>
      {tagsOpen && (
        <TagEditor
          logId={log.id}
          currentTags={log.tags}
          allUserTags={allUserTags}
          date={date}
        />
      )}
      {error && <p role="alert" className="log-form__error">{error}</p>}
    </div>
  );
}
