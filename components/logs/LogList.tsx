"use client";

import { useEffect, useState, useOptimistic, useTransition } from "react";
import type { LogWithTask } from "@/lib/db/queries/logs";
import { createLog } from "@/lib/actions/logs";
import { LogItem } from "./LogItem";
import { PastDayLogPanel } from "./PastDayLogPanel";
import { LogForm } from "./LogForm";
import { logsReducer, type OptimisticAction } from "./optimisticLogs";

export type { OptimisticAction };

interface LogListProps {
  initialLogs: LogWithTask[];
  date: string;
  isPast?: boolean;
  allUserTags?: { id: string; name: string }[];
}

export function LogList({ initialLogs, date, isPast = false, allUserTags = [] }: LogListProps) {
  const [logs, setLogs] = useState(initialLogs);
  useEffect(() => setLogs(initialLogs), [initialLogs]);
  const [optimisticLogs, dispatchOptimistic] = useOptimistic(
    logs,
    logsReducer
  );
  const [, startTransition] = useTransition();

  const handleCreate = async (content: string) => {
    const tempId = crypto.randomUUID();
    const tempLog: LogWithTask = {
      id: tempId,
      dayId: "optimistic",
      content,
      weekPlanTaskId: null,
      createdAt: new Date(),
      taskName: null,
      tags: [],
    };
    startTransition(async () => {
      dispatchOptimistic({ type: "add", log: tempLog });
      const result = await createLog({ content, date });
      if (!result.success) {
        dispatchOptimistic({ type: "remove", id: tempId });
      }
    });
  };

  const form = isPast ? <PastDayLogPanel key={date} date={date} onSaved={log => {
    setLogs(current => [...current.filter(item => item.id !== log.id), log].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
  }} /> : <LogForm onSubmit={handleCreate} />;

  if (optimisticLogs.length === 0) {
    return (
      <section aria-label="Sem registros" className="day-view__logs">
        <div className="day-view__empty">
          <p>Nenhum registro ainda. Que tal começar agora?</p>
        </div>
        {form}
      </section>
    );
  }

  return (
    <section className="day-view__logs">
      <ul className="day-view__log-items">
        {optimisticLogs.map((log) => (
          <LogItem
            key={log.id}
            log={log}
            taskName={log.taskName}
            dispatch={dispatchOptimistic}
            date={date}
            allUserTags={allUserTags}
          />
        ))}
      </ul>
      {form}
    </section>
  );
}
