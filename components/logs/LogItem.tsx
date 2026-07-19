"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { LogWithTask } from "@/lib/db/queries/logs";
import { updateLog, deleteLog, updateLogTime } from "@/lib/actions/logs";
import type { OptimisticAction } from "./optimisticLogs";

interface LogItemProps {
  log: LogWithTask;
  taskName?: string | null;
  dispatch: (action: OptimisticAction) => void;
  date: string;
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

export function LogItem({ log, taskName, dispatch, date }: LogItemProps) {
  const time = format(new Date(log.createdAt), "HH:mm");
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(log.content);
  const [editTime, setEditTime] = useState(format(new Date(log.createdAt), "HH:mm"));
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);

  const originalTime = format(new Date(log.createdAt), "HH:mm");

  const handleUpdate = async () => {
    setTimeError(null);
    setError(null);

    // Client-side validation before server call
    const validationError = validateTime(editTime);
    if (validationError) {
      setTimeError(validationError);
      return;
    }

    const result = await updateLog({
      logId: log.id,
      content: editContent,
      date,
    });
    if (result.success) {
      dispatch({ type: "update", id: log.id, content: editContent });
    } else {
      setEditContent(log.content);
      setError(result.error ?? "Erro ao salvar");
      return;
    }

    if (editTime !== originalTime) {
      const timeResult = await updateLogTime({ logId: log.id, time: editTime, date });
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
        <input
          type="time"
          value={editTime}
          onChange={(e) => setEditTime(e.target.value)}
          aria-label="Selecionar horário do registro"
          className="log-item-card__time-input"
        />
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
              setEditTime(format(new Date(log.createdAt), "HH:mm"));
              setError(null);
              setTimeError(null);
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
    <div className="log-item">
      <span className="log-item__time">{time}</span>
      <span className="log-item__body">
        {log.content}
        {taskName && <span className="log-item__tag">{taskName}</span>}
      </span>
      <span className="log-item__actions">
        <button onClick={() => setEditing(true)} className="log-item__action-btn">Editar</button>
        {confirmingDelete ? (
          <>
            <button onClick={handleDelete} className="log-item__action-btn log-item__action-btn--danger">Confirmar</button>
            <button onClick={() => setConfirmingDelete(false)} className="log-item__action-btn">×</button>
          </>
        ) : (
          <button onClick={() => setConfirmingDelete(true)} className="log-item__action-btn log-item__action-btn--danger">Excluir</button>
        )}
      </span>
      {error && <p role="alert" className="log-form__error">{error}</p>}
    </div>
  );
}
