"use client";

import { useState, useEffect, useRef } from "react";
import { saveWeekPlan } from "@/lib/actions/weekPlans";
import { clamp } from "@/lib/utils/clamp";
import type { TaskLibraryItem } from "@/lib/types/tasks";

export interface WeekPlanTaskInput {
  taskId: string;
  goal: number;
}

interface ModalPlanejarSemanaProps {
  weekStart: string;
  tasks: TaskLibraryItem[];
  currentPlan: WeekPlanTaskInput[];
  onClose: () => void;
}

interface TaskPlanState {
  active: boolean;
  goal: number;
}

export function ModalPlanejarSemana({
  weekStart,
  tasks,
  currentPlan,
  onClose,
}: ModalPlanejarSemanaProps) {
  const [planState, setPlanState] = useState<Record<string, TaskPlanState>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const firstCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initial: Record<string, TaskPlanState> = {};
    for (const task of tasks) {
      const existing = currentPlan.find((p) => p.taskId === task.id);
      if (existing) {
        initial[task.id] = { active: true, goal: existing.goal };
      } else {
        initial[task.id] = { active: false, goal: task.defaultQty };
      }
    }
    setPlanState(initial);
  }, [tasks, currentPlan]);

  useEffect(() => {
    setTimeout(() => firstCheckboxRef.current?.focus(), 50);
  }, []);

  const handleToggle = (taskId: string) => {
    setPlanState((prev) => ({
      ...prev,
      [taskId]: { ...prev[taskId], active: !prev[taskId].active },
    }));
  };

  const handleGoalChange = (taskId: string, value: string) => {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) return;
    const clamped = clamp(parsed, 1, 99);
    setPlanState((prev) => ({
      ...prev,
      [taskId]: { ...prev[taskId], goal: clamped },
    }));
  };

  const handleGoalBlur = (taskId: string, value: string) => {
    const parsed = parseInt(value, 10);
    const clamped = isNaN(parsed) || parsed < 1 ? 1 : clamp(parsed, 1, 99);
    setPlanState((prev) => ({
      ...prev,
      [taskId]: { ...prev[taskId], goal: clamped },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const activeTasks = Object.entries(planState)
      .filter(([, state]) => state.active)
      .map(([taskId, state]) => ({ taskId, goal: state.goal }));

    const result = await saveWeekPlan({ weekStart, tasks: activeTasks });
    setSubmitting(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.error ?? "Não foi possível salvar. Tente novamente.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const isEmpty = tasks.length === 0;

  return (
    <div
      className="quick-capture-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Planejar semana"
        className="quick-capture-modal"
      >
        <div className="quick-capture-modal__header">
          <div>
            <h2 className="quick-capture-modal__title">Planejar semana</h2>
            <p className="quick-capture-modal__sub">
              Selecione as tarefas e defina suas metas.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="quick-capture-modal__close"
          >
            ✕
          </button>
        </div>

        {isEmpty ? (
          <p className="task-empty">Adicione tarefas na biblioteca primeiro.</p>
        ) : (
          <form onSubmit={handleSubmit} className="quick-capture-modal__form">
            <div className="plan-task-list">
              {tasks.map((task, index) => {
                const state = planState[task.id];
                if (!state) return null;
                return (
                  <div key={task.id} className="plan-task-row">
                    <label className="plan-task-row__label">
                      <input
                        ref={index === 0 ? firstCheckboxRef : undefined}
                        type="checkbox"
                        checked={state.active}
                        onChange={() => handleToggle(task.id)}
                        className="plan-task-row__checkbox"
                      />
                      <span className="plan-task-row__name">{task.name}</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={state.goal}
                      onChange={(e) => handleGoalChange(task.id, e.target.value)}
                      onBlur={(e) => handleGoalBlur(task.id, e.target.value)}
                      disabled={!state.active}
                      className="plan-task-row__qty"
                      aria-label={`Meta para ${task.name}`}
                    />
                  </div>
                );
              })}
            </div>

            {error && (
              <p role="alert" className="quick-capture-modal__error">
                {error}
              </p>
            )}

            <div className="quick-capture-modal__footer">
              <button
                type="button"
                onClick={onClose}
                className="quick-capture-modal__btn-cancel"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="quick-capture-modal__btn-save"
              >
                {submitting ? "Salvando..." : "Salvar plano"}
              </button>
            </div>
          </form>
        )}

        {isEmpty && (
          <div className="quick-capture-modal__footer">
            <button
              type="button"
              onClick={onClose}
              className="quick-capture-modal__btn-cancel"
            >
              Fechar
            </button>
            <button
              type="button"
              disabled
              className="quick-capture-modal__btn-save"
            >
              Salvar plano
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
