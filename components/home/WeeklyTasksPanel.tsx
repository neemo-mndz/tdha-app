"use client";

import { useOptimistic, useState, useTransition } from "react";
import { addDays, format, parseISO } from "date-fns";
import { rhythmReducer, isDateInWeek } from "@/lib/utils/taskRhythm";
import { bumpTask, toggleTaskDay } from "@/lib/actions/weekPlans";
import type { ActiveTaskDisplay, TaskLibraryItem } from "@/lib/types/tasks";
import { ModalEditarTarefas } from "@/components/home/ModalEditarTarefas";
import { ModalPlanejarSemana } from "@/components/home/ModalPlanejarSemana";

interface WeeklyTasksPanelProps {
  weekStart: string;
  today: string;
  activeTasks: ActiveTaskDisplay[];
  allTasks: TaskLibraryItem[];
}

export function WeeklyTasksPanel({
  weekStart,
  today,
  activeTasks,
  allTasks,
}: WeeklyTasksPanelProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [error, setError] = useState<string | null>(null);
  const [optimisticTasks, dispatch] = useOptimistic(activeTasks, rhythmReducer);
  const weekdays = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
  const days = weekdays.map((weekday, index) => {
    const date = format(addDays(parseISO(weekStart), index), 'yyyy-MM-dd');
    return { weekday, date, isToday: date === today, isFuture: date > today };
  });
  const totalDone = optimisticTasks.reduce((sum, task) => sum + task.done, 0);
  const totalGoal = optimisticTasks.reduce((sum, task) => sum + task.goal, 0);
  const ratio = totalGoal ? Math.min(100, Math.round(totalDone / totalGoal * 100)) : 0;

  function handleToggleDay(weekPlanTaskId: string, date: string) {
    setError(null);
    startTransition(async () => {
      dispatch({ type: 'toggleDay', weekPlanTaskId, date });
      try {
        const result = await toggleTaskDay({ weekPlanTaskId, date });
        if (!result.success) setError(result.error);
      } catch {
        setError('Não foi possível salvar. Tente novamente.');
      }
    });
  }

  function handleBump(weekPlanTaskId: string) {
    const todayDate = isDateInWeek(today, weekStart) ? today : undefined;
    setError(null);
    startTransition(async () => {
      dispatch({ type: 'bump', weekPlanTaskId, today: todayDate });
      try {
        const result = await bumpTask({ weekPlanTaskId, todayDate });
        if (!result.success) setError(result.error);
      } catch {
        setError('Não foi possível salvar. Tente novamente.');
      }
    });
  }

  return (
    <div className="weekly-tasks-panel">
      <div className="panel__header-row">
        <div>
          <h2 className="weekly-tasks-panel__title">Tarefas da semana</h2>
          <p className="weekly-tasks-panel__subtitle">Toque no dia para marcar presença — consciência semanal, sem cobrança</p>
        </div>
        <span className="panel__count-badge">{totalDone}/{totalGoal} na semana</span>
      </div>
      {optimisticTasks.length > 0 && (
        <div className="rhythm-overview-bar">
          <div className="rhythm-overview-bar__track" aria-hidden="true">
            <div className="rhythm-overview-bar__fill" style={{ width: `${ratio}%` }} />
          </div>
          <span className="rhythm-overview-bar__label">ritmo {ratio}%</span>
        </div>
      )}
      {error && <p role="alert" className="log-form__error">{error}</p>}

      {optimisticTasks.length === 0 ? (
        <div className="task-empty">
          Nenhuma tarefa planejada ainda. Use &lsquo;Planejar semana&rsquo;.
        </div>
      ) : (
        <div>
          {optimisticTasks.map((task) => (
            <div key={task.weekPlanTaskId} className="task-row--rhythm">
              <div className="task-row__top">
                <span className="task-name">{task.name}</span>
                <div className="task-row__info">
                  <div className="task-progress-track" aria-hidden="true">
                    <div className={`task-progress-fill${task.done >= task.goal ? ' task-progress-fill--done' : ''}`}
                      style={{ width: `${Math.min(100, task.done / task.goal * 100)}%` }} />
                  </div>
                  <span className={`task-count${task.done >= task.goal ? ' done' : ''}`}>{task.done}/{task.goal}</span>
                  <button type="button" className="task-bump-btn"
                    onClick={() => handleBump(task.weekPlanTaskId)} disabled={isPending || weekStart > today}
                    aria-label={`Registrar +1 em ${task.name}`} title="Registrar +1">+</button>
                </div>
              </div>
              <div className="task-week-dots" role="group" aria-label={`Ritmo semanal de ${task.name}`}>
                {days.map((day) => {
                  const active = task.completedDates.includes(day.date);
                  return (
                    <button key={day.date} type="button"
                      className={['task-day-pill', day.isToday && 'task-day-pill--today', active && 'task-day-pill--active', day.isFuture && 'task-day-pill--future'].filter(Boolean).join(' ')}
                      disabled={day.isFuture || isPending} aria-pressed={active}
                      aria-label={`${task.name}: ${day.weekday}, ${format(parseISO(day.date), 'dd/MM/yyyy')}${day.isToday ? ', hoje' : ''}`}
                      title={day.isFuture ? `${day.weekday} (dia futuro)` : `${day.weekday}: clique para alternar`}
                      onClick={() => handleToggleDay(task.weekPlanTaskId, day.date)}>
                      <span>{day.weekday}</span><span className="task-day-pill__dot" aria-hidden="true" />
                    </button>
                  );
                })}
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
