"use client";

import { useState } from "react";
import type { Log } from "@/drizzle/schema";
import { updateLog, deleteLog } from "@/lib/actions/logs";
import type { OptimisticAction } from "./LogList";

interface LogItemProps {
  log: Log;
  dispatch: (action: OptimisticAction) => void;
  date: string;
}

export function LogItem({ log, dispatch, date }: LogItemProps) {
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
      <li>
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          maxLength={2000}
          aria-label="Editar registro"
        />
        <button onClick={handleUpdate}>Salvar</button>
        <button
          onClick={() => {
            setEditing(false);
            setEditContent(log.content);
            setError(null);
          }}
        >
          Cancelar
        </button>
        {error && <p role="alert">{error}</p>}
      </li>
    );
  }

  return (
    <li>
      <p>{log.content}</p>
      <button onClick={() => setEditing(true)}>Editar</button>
      {confirmingDelete ? (
        <>
          <button onClick={handleDelete}>Confirmar exclusão</button>
          <button onClick={() => setConfirmingDelete(false)}>Cancelar</button>
        </>
      ) : (
        <button onClick={() => setConfirmingDelete(true)}>Excluir</button>
      )}
      {error && <p role="alert">{error}</p>}
    </li>
  );
}
