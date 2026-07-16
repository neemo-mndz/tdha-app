"use client";

import { useState, useOptimistic, useTransition, useRef } from "react";
import { createTask, updateTask, deleteTask } from "@/lib/actions/tasks";
import { clamp } from "@/lib/utils/clamp";
import type { TaskLibraryItem } from "@/lib/types/tasks";

interface ModalEditarTarefasProps {
  tasks: TaskLibraryItem[];
  onClose: () => void;
}

type OptimisticAction =
  | { type: "add"; task: TaskLibraryItem }
  | { type: "update"; task: TaskLibraryItem }
  | { type: "remove"; id: string };

function tasksReducer(
  state: TaskLibraryItem[],
  action: OptimisticAction
): TaskLibraryItem[] {
  switch (action.type) {
    case "add":
      return [...state, action.task];
    case "update":
      return state.map((t) => (t.id === action.task.id ? action.task : t));
    case "remove":
      return state.filter((t) => t.id !== action.id);
    default:
      return state;
  }
}

export function ModalEditarTarefas({ tasks, onClose }: ModalEditarTarefasProps) {
  const [optimisticTasks, addOptimistic] = useOptimistic(tasks, tasksReducer);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  // New task form state
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState(1);
  const newNameRef = useRef<HTMLInputElement>(null);

  const clearError = () => setError(null);

  // --- Add task ---
  const handleAdd = () => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      newNameRef.current?.focus();
      return;
    }

    const clampedQty = clamp(newQty, 1, 99);
    const tempId = crypto.randomUUID();
    const optimisticTask: TaskLibraryItem = {
      id: tempId,
      name: trimmedName,
      defaultQty: clampedQty,
    };

    setNewName("");
    setNewQty(1);
    clearError();

    startTransition(async () => {
      addOptimistic({ type: "add", task: optimisticTask });
      const result = await createTask({ name: trimmedName, defaultQty: clampedQty });
      if (!result.success) {
        setError(result.error ?? "Não foi possível adicionar. Tente novamente.");
      }
    });
  };

  // --- Edit task ---
  const handleEditName = (task: TaskLibraryItem, newNameValue: string) => {
    const trimmedName = newNameValue.trim();
    if (!trimmedName || trimmedName === task.name) return;

    clearError();

    startTransition(async () => {
      addOptimistic({ type: "update", task: { ...task, name: trimmedName } });
      const result = await updateTask({ taskId: task.id, name: trimmedName });
      if (!result.success) {
        setError(result.error ?? "Não foi possível salvar. Tente novamente.");
      }
    });
  };

  const handleEditQty = (task: TaskLibraryItem, rawValue: number) => {
    const clampedValue = clamp(rawValue, 1, 99);
    if (clampedValue === task.defaultQty) return;

    clearError();

    startTransition(async () => {
      addOptimistic({ type: "update", task: { ...task, defaultQty: clampedValue } });
      const result = await updateTask({ taskId: task.id, defaultQty: clampedValue });
      if (!result.success) {
        setError(result.error ?? "Não foi possível salvar. Tente novamente.");
      }
    });
  };

  // --- Delete task ---
  const handleDelete = (taskId: string) => {
    clearError();
    setConfirmingDelete(null);

    startTransition(async () => {
      addOptimistic({ type: "remove", id: taskId });
      const result = await deleteTask({ taskId });
      if (!result.success) {
        setError(result.error ?? "Não foi possível remover. Tente novamente.");
      }
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className="quick-capture-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Editar tarefas"
        className="quick-capture-modal"
      >
        {/* Header */}
        <div className="quick-capture-modal__header">
          <div>
            <h2 className="quick-capture-modal__title">Editar tarefas</h2>
            <p className="quick-capture-modal__sub">Gerencie sua biblioteca de tarefas recorrentes</p>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="quick-capture-modal__close">
            ✕
          </button>
        </div>

        {/* Error inline */}
        {error && (
          <p role="alert" className="quick-capture-modal__error" style={{ marginBottom: 12 }}>
            {error}
          </p>
        )}

        {/* Task list */}
        {optimisticTasks.length === 0 ? (
          <p className="task-empty">Nenhuma tarefa criada ainda.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {optimisticTasks.map((task) => (
              <div key={task.id} className="task-row" style={{ gap: 8 }}>
                <input
                  type="text"
                  defaultValue={task.name}
                  maxLength={100}
                  aria-label={`Nome da tarefa ${task.name}`}
                  onBlur={(e) => handleEditName(task, e.target.value)}
                  style={{
                    flex: 1,
                    border: "1px solid var(--line)",
                    borderRadius: 10,
                    padding: "8px 12px",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 14,
                    color: "var(--ink)",
                    background: "transparent",
                    outline: "none",
                    minWidth: 0,
                  }}
                />
                <input
                  type="number"
                  defaultValue={task.defaultQty}
                  min={1}
                  max={99}
                  aria-label={`Quantidade padrão de ${task.name}`}
                  onBlur={(e) => handleEditQty(task, Number(e.target.value))}
                  style={{
                    width: 56,
                    border: "1px solid var(--line)",
                    borderRadius: 10,
                    padding: "8px 10px",
                    fontFamily: "IBM Plex Mono, monospace",
                    fontSize: 13,
                    textAlign: "center",
                    color: "var(--ink)",
                    background: "transparent",
                    outline: "none",
                  }}
                />
                {confirmingDelete === task.id ? (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => handleDelete(task.id)}
                      aria-label={`Confirmar remoção de ${task.name}`}
                      style={{
                        background: "#C6685A",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(null)}
                      aria-label="Cancelar remoção"
                      style={{
                        background: "var(--bg)",
                        color: "var(--ink)",
                        border: "1px solid var(--line)",
                        borderRadius: 8,
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      Não
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(task.id)}
                    aria-label={`Remover ${task.name}`}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--muted)",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      padding: "6px 8px",
                      borderRadius: 6,
                      transition: "color 0.12s ease",
                    }}
                  >
                    Remover
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add new task form */}
        <div
          style={{
            border: "1px dashed var(--line)",
            borderRadius: 14,
            padding: 14,
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <input
            ref={newNameRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="Nome da tarefa"
            maxLength={100}
            aria-label="Nome da nova tarefa"
            style={{
              flex: 1,
              border: "1px solid var(--line)",
              borderRadius: 10,
              padding: "8px 12px",
              fontFamily: "Inter, sans-serif",
              fontSize: 14,
              color: "var(--ink)",
              background: "transparent",
              outline: "none",
              minWidth: 120,
            }}
          />
          <input
            type="number"
            value={newQty}
            min={1}
            max={99}
            onChange={(e) => setNewQty(clamp(Number(e.target.value) || 1, 1, 99))}
            aria-label="Quantidade padrão da nova tarefa"
            style={{
              width: 56,
              border: "1px solid var(--line)",
              borderRadius: 10,
              padding: "8px 10px",
              fontFamily: "IBM Plex Mono, monospace",
              fontSize: 13,
              textAlign: "center",
              color: "var(--ink)",
              background: "transparent",
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={isPending}
            className="quick-capture-modal__btn-save"
          >
            Adicionar
          </button>
        </div>

        {/* Footer */}
        <div className="quick-capture-modal__footer" style={{ marginTop: 16 }}>
          <button type="button" onClick={onClose} className="quick-capture-modal__btn-cancel">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
