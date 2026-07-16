"use client";

import { useOptimistic, useTransition } from "react";
import type { Log } from "@/drizzle/schema";
import type { LogWithTask } from "@/lib/db/queries/logs";
import { createLog } from "@/lib/actions/logs";
import { LogItem } from "./LogItem";
import { LogForm } from "./LogForm";

interface LogListProps {
  initialLogs: LogWithTask[];
  date: string;
}

export type OptimisticAction =
  | { type: "add"; log: LogWithTask }
  | { type: "remove"; id: string }
  | { type: "update"; id: string; content: string };

function logsReducer(state: LogWithTask[], action: OptimisticAction): LogWithTask[] {
  switch (action.type) {
    case "add":
      return [...state, action.log];
    case "remove":
      return state.filter((l) => l.id !== action.id);
    case "update":
      return state.map((l) =>
        l.id === action.id ? { ...l, content: action.content } : l
      );
  }
}

export function LogList({ initialLogs, date }: LogListProps) {
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
      mood: null,
      weekPlanTaskId: null,
      createdAt: new Date(),
      taskName: null,
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
      {optimisticLogs.map((log) => (
        <LogItem
          key={log.id}
          log={log}
          taskName={log.taskName}
          dispatch={dispatchOptimistic}
          date={date}
        />
      ))}
      <LogForm onSubmit={handleCreate} />
    </section>
  );
}
