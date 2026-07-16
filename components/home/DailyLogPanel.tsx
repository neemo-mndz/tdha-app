"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { createLog } from "@/lib/actions/logs";
import { TaskChips } from "@/components/logs/TaskChips";
import { LogItem } from "@/components/logs/LogItem";
import { logsReducer } from "@/components/logs/optimisticLogs";
import type { ActiveTaskDisplay } from "@/lib/types/tasks";
import type { LogWithTask } from "@/lib/db/queries/logs";

interface DailyLogPanelProps {
  date: string;
  activeTasks: ActiveTaskDisplay[];
  initialLogs: LogWithTask[];
}

/** Quantidade de registros recentes exibidos direto no painel da home/semana. */
const VISIBLE_LOG_COUNT = 3;

export function DailyLogPanel({ date, activeTasks, initialLogs }: DailyLogPanelProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [optimisticLogs, dispatchOptimistic] = useOptimistic(
    initialLogs,
    logsReducer
  );

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

    const selectedTask = activeTasks.find((t) => t.weekPlanTaskId === selectedTaskId);
    const tempId = crypto.randomUUID();
    const trimmed = content.trim();

    startTransition(() => {
      dispatchOptimistic({
        type: "add",
        log: {
          id: tempId,
          dayId: "optimistic",
          content: trimmed,
          mood: null,
          weekPlanTaskId: selectedTaskId,
          createdAt: new Date(),
          taskName: selectedTask?.name ?? null,
        },
      });
    });

    const result = await createLog({
      content: trimmed,
      date,
      weekPlanTaskId: selectedTaskId,
    });
    setSubmitting(false);

    if (result.success) {
      setContent("");
      setSelectedTaskId(null);
    } else {
      startTransition(() => {
        dispatchOptimistic({ type: "remove", id: tempId });
      });
      setError(result.error ?? "Erro ao salvar.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  const totalCount = optimisticLogs.length;
  const recentLogs = optimisticLogs.slice(-VISIBLE_LOG_COUNT).reverse();
  const hiddenCount = totalCount - recentLogs.length;

  return (
    <div className="panel">
      <div className="panel__header-row">
        <div>
          <h2 className="panel__title">Registro do dia</h2>
          <p className="panel__subtitle">Brain dump rápido. Escreva o que quiser, sem se preocupar.</p>
        </div>
        {totalCount > 0 && (
          <span className="panel__count-badge" aria-label={`${totalCount} registros hoje`}>
            {totalCount}
          </span>
        )}
      </div>

      <div className="capture-box">
        <TaskChips
          activeTasks={activeTasks}
          selectedTaskId={selectedTaskId}
          onSelect={setSelectedTaskId}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="O que aconteceu?"
          maxLength={2000}
          aria-label="Novo registro do dia"
        />
        {error && <p role="alert" className="capture-box__error">{error}</p>}
        <div className="capture-actions">
          <span className="capture-actions__hint">Ctrl/Cmd + Enter para salvar</span>
          <button className="save-btn" onClick={handleSave} disabled={submitting}>
            {submitting ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>

      {recentLogs.length > 0 && (
        <div className="daily-log-panel__recent">
          <ul className="daily-log-panel__list">
            {recentLogs.map((log) => (
              <LogItem
                key={log.id}
                log={log}
                taskName={log.taskName}
                dispatch={dispatchOptimistic}
                date={date}
              />
            ))}
          </ul>
          {hiddenCount > 0 && (
            <Link href={`/day/${date}`} className="daily-log-panel__view-all">
              Ver todos os {totalCount} registros de hoje →
            </Link>
          )}
        </div>
      )}

      {totalCount === 0 && (
        <p className="task-empty" style={{ marginTop: "14px" }}>
          Nenhum registro ainda hoje.
        </p>
      )}
    </div>
  );
}
