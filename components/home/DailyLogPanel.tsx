"use client";

import { useState } from "react";
import { createLog } from "@/lib/actions/logs";
import { TaskChips } from "@/components/logs/TaskChips";
import type { ActiveTaskDisplay } from "@/lib/types/tasks";
import { useLogs } from "@/components/home/LogsProvider";
import { format, isSameDay } from "date-fns";
import type { LogWithTask } from "@/lib/db/queries/logs";

interface DailyLogPanelProps {
  activeTasks: ActiveTaskDisplay[];
}

export function DailyLogPanel({ activeTasks }: DailyLogPanelProps) {
  const { dispatchOptimistic, selectedDate, todayDate } = useLogs();
  const dateStr = format(todayDate, "yyyy-MM-dd");
  
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

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

    const trimmed = content.trim();

    // Optimistic Update
    if (isSameDay(selectedDate, todayDate)) {
      const optimisticLog: LogWithTask = {
        id: `optimistic-${Date.now()}`,
        content: trimmed,
        dayId: "optimistic",
        createdAt: new Date().toISOString(),
        mood: null,
        weekPlanTaskId: selectedTaskId,
        taskName: activeTasks.find((t) => t.weekPlanTaskId === selectedTaskId)?.name ?? null,
        tags: [],
      };
      dispatchOptimistic({ action: "add", log: optimisticLog });
    }

    const result = await createLog({
      content: trimmed,
      date: dateStr,
      weekPlanTaskId: selectedTaskId,
    });
    setSubmitting(false);

    if (result.success) {
      setContent("");
      setSelectedTaskId(null);
    } else {
      setError(result.error ?? "Erro ao salvar.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="panel">
      <h2 className="panel__title">Registro do dia</h2>
      <p className="panel__subtitle">Brain dump rápido. O humor? Ali em cima, um toque só.</p>

      <div className="capture-box">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="O que aconteceu?"
          maxLength={2000}
          aria-label="Novo registro do dia"
        />
        {activeTasks.length > 0 && (
          <>
            <p className="link-task-label">Vincular a uma tarefa da semana (opcional)</p>
            <TaskChips
              activeTasks={activeTasks}
              selectedTaskId={selectedTaskId}
              onSelect={setSelectedTaskId}
            />
          </>
        )}
        {error && <p style={{ color: "#C6685A", fontSize: "13px", marginTop: "8px" }}>{error}</p>}
        <div className="capture-actions">
          <button className="save-btn" onClick={handleSave} disabled={submitting}>
            {submitting ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
