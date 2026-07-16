"use client";

import { useOptimistic, useState, useTransition } from "react";
import { bumpTask } from "@/lib/actions/weekPlans";
import type { ActiveTaskDisplay, TaskLibraryItem } from "@/lib/types/tasks";
import { ModalEditarTarefas } from "@/components/home/ModalEditarTarefas";
import { ModalPlanejarSemana } from "@/components/home/ModalPlanejarSemana";

interface WeeklyTasksPanelProps {
  weekStart: string;
  activeTasks: ActiveTaskDisplay[];
  allTasks: TaskLibraryItem[];
}

export function WeeklyTasksPanel({
  weekStart,
  activeTasks,
  allTasks,
}: WeeklyTasksPanelProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [optimisticTasks, addOptimisticBump] = useOptimistic(
    activeTasks,
    (state: ActiveTaskDisplay[], weekPlanTaskId: string) =>
      state.map((t) =>
        t.weekPlanTaskId === weekPlanTaskId ? { ...t, done: t.done + 1 } : t
      )
  );

  const handleBump = (weekPlanTaskId: string) => {
    startTransition(async () => {
      addOptimisticBump(weekPlanTaskId);
      await bumpTask({ weekPlanTaskId });
    });
  };

  return (
    <div className="panel">
      <h2 className="panel__title">Tarefas da semana</h2>
      <p className="panel__subtitle">Contagem informativa, sem cobrança</p>

      {optimisticTasks.length === 0 ? (
        <div className="task-empty">
          Nenhuma tarefa planejada ainda. Use &lsquo;Planejar semana&rsquo;.
        </div>
      ) : (
        <div>
          {optimisticTasks.map((task) => (
            <div key={task.weekPlanTaskId} className="task-row">
              <span className="task-name">{task.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  className={`task-count${task.done >= task.goal ? " done" : ""}`}
                >
                  {task.done}/{task.goal}
                </span>
                <button
                  className="task-bump-btn"
                  onClick={() => handleBump(task.weekPlanTaskId)}
                  disabled={isPending}
                  aria-label={`Registrar ${task.name}`}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="task-panel-actions">
        <button
          className="task-panel-btn task-panel-btn--primary"
          onClick={() => setShowPlanModal(true)}
        >
          Planejar semana
        </button>
        <button
          className="task-panel-link"
          onClick={() => setShowEditModal(true)}
        >
          Editar tarefas
        </button>
      </div>

      {showEditModal && (
        <ModalEditarTarefas
          tasks={allTasks}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {showPlanModal && (
        <ModalPlanejarSemana
          weekStart={weekStart}
          tasks={allTasks}
          currentPlan={optimisticTasks.map((t) => ({
            taskId: t.taskId,
            goal: t.goal,
            active: true,
          }))}
          onClose={() => setShowPlanModal(false)}
        />
      )}
    </div>
  );
}
