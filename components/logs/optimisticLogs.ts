import type { LogWithTask } from "@/lib/db/queries/logs";

/**
 * Reducer e tipos compartilhados de estado otimista para logs.
 * Usado por LogList (página do dia) e DailyLogPanel (painel da home/semana)
 * para manter o mesmo padrão de UI otimista em ambos os pontos de entrada.
 */
export type OptimisticAction =
  | { type: "add"; log: LogWithTask }
  | { type: "remove"; id: string }
  | { type: "update"; id: string; content: string };

export function logsReducer(
  state: LogWithTask[],
  action: OptimisticAction
): LogWithTask[] {
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
