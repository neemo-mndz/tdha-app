"use client";

import { useOptimistic, useTransition } from "react";
import type { LogWithTask } from "@/lib/db/queries/logs";
import { createLog } from "@/lib/actions/logs";
import { LogItem } from "./LogItem";
import { LogForm } from "./LogForm";
import { logsReducer, type OptimisticAction } from "./optimisticLogs";

export type { OptimisticAction };

interface LogListProps {
  initialLogs: LogWithTask[];
  date: string;
  allUserTags?: { id: string; name: string }[];
}

export function LogList({ initialLogs, date, allUserTags = [] }: LogListProps) {
  const [optimisticLogs, dispatchOptimistic] = useOptimistic(
    initialLogs,
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

  if (optimisticLogs.length === 0) {
    return (
      <section aria-label="Sem registros" className="day-view__logs">
        <div className="day-view__empty">
          <p>Nenhum registro ainda. Que tal começar agora?</p>
        </div>
        <LogForm onSubmit={handleCreate} />
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
      <LogForm onSubmit={handleCreate} />
    </section>
  );
}
