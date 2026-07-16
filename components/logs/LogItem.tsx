"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { Log } from "@/drizzle/schema";
import { updateLog, deleteLog } from "@/lib/actions/logs";
import type { OptimisticAction } from "./optimisticLogs";

interface LogItemProps {
  log: Log;
  taskName?: string | null;
  dispatch: (action: OptimisticAction) => void;
  date: string;
}

export function LogItem({ log, taskName, dispatch, date }: LogItemProps) {
  const time = format(new Date(log.createdAt), "HH:mm");
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(log.content);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
    const result = await updateLog({
      logId: log.id,
      content: editContent,
      date,
    });
    if (result.success) {
      dispatch({ type: "update", id: log.id, content: editContent });
      setEditing(false);
      setError(null);
    } else {
      setEditContent(log.content);
      setError(result.error ?? "Erro ao salvar");
    }
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
        <span className="log-item-card__time">{time}</span>
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
              setError(null);
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
    <div className="log-item-card">
      <div className="log-item-card__meta">
        <span className="log-item-card__time">{time}</span>
        {taskName && (
          <span className="log-item-card__tag">{taskName}</span>
        )}
      </div>
      <p className="log-item-card__content">{log.content}</p>
      <div className="log-item-card__actions">
        <button onClick={() => setEditing(true)} className="log-item-card__btn">
          Editar
        </button>
        {confirmingDelete ? (
          <>
            <button onClick={handleDelete} className="log-item-card__btn log-item-card__btn--danger">
              Confirmar exclusão
            </button>
            <button onClick={() => setConfirmingDelete(false)} className="log-item-card__btn">
              Cancelar
            </button>
          </>
        ) : (
          <button onClick={() => setConfirmingDelete(true)} className="log-item-card__btn log-item-card__btn--danger">
            Excluir
          </button>
        )}
      </div>
      {error && <p role="alert" className="log-form__error">{error}</p>}
    </div>
  );
}
