"use client";

import { useOptimistic, useTransition } from "react";
import type { Log } from "@/drizzle/schema";
import { createLog } from "@/lib/actions/logs";
import { LogItem } from "./LogItem";
import { LogForm } from "./LogForm";

interface LogListProps {
  initialLogs: Log[];
  date: string;
}

export type OptimisticAction =
  | { type: "add"; log: Log }
  | { type: "remove"; id: string }
  | { type: "update"; id: string; content: string };

function logsReducer(state: Log[], action: OptimisticAction): Log[] {
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
    const tempLog: Log = {
      id: tempId,
      dayId: "optimistic",
      content,
      mood: null,
      createdAt: new Date(),
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
      <section aria-label="Sem registros">
        <p>Nenhum registro ainda. Que tal começar agora?</p>
        <LogForm onSubmit={handleCreate} />
      </section>
    );
  }

  return (
    <section>
      <ul>
        {optimisticLogs.map((log) => (
          <LogItem
            key={log.id}
            log={log}
            dispatch={dispatchOptimistic}
            date={date}
          />
        ))}
      </ul>
      <LogForm onSubmit={handleCreate} />
    </section>
  );
}
