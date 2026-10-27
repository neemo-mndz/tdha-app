"use client";

import { useState, useTransition } from "react";
import { createLog, getLogsForDate } from "@/lib/actions/logs";
import { TaskChips } from "@/components/logs/TaskChips";
import type { ActiveTaskDisplay } from "@/lib/types/tasks";
import { useLogs } from "@/components/home/LogsProvider";
import { format } from "date-fns";

import { ptBR } from "date-fns/locale";
import { isDateInWeek } from "@/lib/utils/taskRhythm";

interface DailyLogPanelProps {
  weekStart?: string;
  activeTasks: ActiveTaskDisplay[];
}

export function DailyLogPanel({ activeTasks, weekStart }: DailyLogPanelProps) {
  const { dispatchOptimistic, selectedDate, todayDate, setLogs } = useLogs();
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const availableTasks = weekStart && !isDateInWeek(dateStr, weekStart) ? [] : activeTasks;
  const future = selectedDate > todayDate;
  const [, startTransition] = useTransition();

  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleSave = async () => {
    if (submitting || future) return;
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

    const linkedTask = availableTasks.find((task) => task.weekPlanTaskId === selectedTaskId);
    startTransition(async () => {
      dispatchOptimistic({ type: "add", log: {
        id: `optimistic-${Date.now()}`, content: trimmed, dayId: "optimistic",
        createdAt: new Date(), weekPlanTaskId: linkedTask?.weekPlanTaskId ?? null,
        taskName: linkedTask?.name ?? null, tags: [],
      } });
      try {
        const result = await createLog({ content: trimmed, date: dateStr, weekPlanTaskId: linkedTask?.weekPlanTaskId ?? null });
        if (result.success) {
          setContent("");
          setSelectedTaskId(null);
          try { setLogs(await getLogsForDate(dateStr)); } catch { /* A gravação já foi concluída; a próxima navegação atualiza a lista. */ }
        } else {
          setError(result.error ?? "Erro ao salvar.");
        }
      } catch {
        setError("Não foi possível salvar. Seu texto foi mantido; tente novamente.");
      } finally {
        setSubmitting(false);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  if (dateStr < format(todayDate, "yyyy-MM-dd")) return null;

  return (
    <div className="daily-log-panel">
      <h2 className="daily-log-panel__title">Registrar agora</h2>
      <p className="daily-log-panel__subtitle">
        Anote algo rápido sobre {format(selectedDate, "EEE (dd/MM)", { locale: ptBR })}
      </p>

      <div className="capture-box">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            if (!content.trim()) {
              setIsFocused(false);
            }
          }}
          placeholder="O que aconteceu hoje? Uma frase já basta…"
          maxLength={2000}
          aria-label="Novo registro do dia"
          style={{
            height: isFocused || content.trim() ? 'auto' : 44,
            minHeight: isFocused || content.trim() ? 44 : 44,
            transition: 'height 0.15s ease',
            overflowY: isFocused || content.trim() ? 'auto' : 'hidden'
          }}
        />
        {availableTasks.length > 0 && (
          <>
            <p className="link-task-label">Vincular a tarefa da semana (opcional — também marca o dia acima)</p>
            <TaskChips
              activeTasks={availableTasks}
              selectedTaskId={selectedTaskId}
              onSelect={setSelectedTaskId}
            />
          </>
        )}
        {error && <p style={{ color: "#C6685A", fontSize: "13px", marginTop: "8px" }}>{error}</p>}
        <div className="capture-actions">
          <div>
            <button className="save-btn" onClick={handleSave} disabled={submitting || future || !content.trim()}>
              {submitting ? "Salvando..." : "Salvar registro"}
            </button>
          </div>
          <span className="capture-actions__hint">
            Menos de 10 segundos · sem categorias obrigatórias
          </span>
        </div>
      </div>
    </div>
  );
}
