"use client";

import { createContext, useContext, useState, useOptimistic, useEffect, type ReactNode } from "react";
import { logsReducer, type OptimisticAction } from "@/components/logs/optimisticLogs";
import type { LogWithTask } from "@/lib/db/queries/logs";
import { isSameDay } from "date-fns";

/** Parse "yyyy-MM-dd" as local date without timezone shift */
function parseDateString(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

interface LogsContextType {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  logs: LogWithTask[];
  setLogs: (logs: LogWithTask[]) => void;
  optimisticLogs: LogWithTask[];
  dispatchOptimistic: (action: OptimisticAction) => void;
  todayDate: Date;
}

const LogsContext = createContext<LogsContextType | null>(null);

export function LogsProvider({
  children,
  initialLogs,
  todayStr,
}: {
  children: ReactNode;
  initialLogs: LogWithTask[];
  todayStr: string;
}) {
  const [todayDate] = useState(() => parseDateString(todayStr));
  const [selectedDate, setSelectedDate] = useState<Date>(todayDate);
  const [logs, setLogs] = useState<LogWithTask[]>(initialLogs);

  const [optimisticLogs, dispatchOptimistic] = useOptimistic(
    logs,
    logsReducer
  );

  // When initialLogs from server changes (e.g. after a Server Action revalidates),
  // we update our local logs IF we are looking at today.
  useEffect(() => {
    if (isSameDay(selectedDate, todayDate)) {
      setLogs(initialLogs);
    }
  }, [initialLogs, selectedDate, todayDate]);

  return (
    <LogsContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        logs,
        setLogs,
        optimisticLogs,
        dispatchOptimistic,
        todayDate,
      }}
    >
      {children}
    </LogsContext.Provider>
  );
}

export function useLogs() {
  const ctx = useContext(LogsContext);
  if (!ctx) throw new Error("useLogs must be used within LogsProvider");
  return ctx;
}
