"use client";

import type { ActiveTaskDisplay } from "@/lib/types/tasks";

interface TaskChipsProps {
  activeTasks: ActiveTaskDisplay[];
  selectedTaskId: string | null;
  onSelect: (weekPlanTaskId: string | null) => void;
}

export function TaskChips({ activeTasks, selectedTaskId, onSelect }: TaskChipsProps) {
  if (activeTasks.length === 0) return null;

  return (
    <div className="task-chips" role="radiogroup" aria-label="Vincular tarefa">
      <button
        type="button"
        className={`task-chip task-chip--none${selectedTaskId === null ? " active" : ""}`}
        onClick={() => onSelect(null)}
        role="radio"
        aria-checked={selectedTaskId === null}
      >
        nenhuma
      </button>
      {activeTasks.map((task) => (
        <button
          key={task.weekPlanTaskId}
          type="button"
          className={`task-chip${selectedTaskId === task.weekPlanTaskId ? " active" : ""}`}
          onClick={() => onSelect(task.weekPlanTaskId)}
          role="radio"
          aria-checked={selectedTaskId === task.weekPlanTaskId}
        >
          {task.name}
        </button>
      ))}
    </div>
  );
}
