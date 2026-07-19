"use client";

import { useEffect, useState, useOptimistic, useTransition } from "react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getLogsForDate } from "@/lib/actions/logs";
import { LogItem } from "@/components/logs/LogItem";
import { logsReducer, type OptimisticAction } from "@/components/logs/optimisticLogs";
import type { LogWithTask } from "@/lib/db/queries/logs";

interface TodayLogsCardProps {
  selectedDate: Date;
  today: Date;
  initialLogs: LogWithTask[];
}

/**
 * Card sempre visível que exibe os registros do dia atualmente selecionado.
 * Fica logo abaixo do botão "Ver calendário da semana", independente do
 * calendário estar expandido ou recolhido. Atualiza quando o usuário
 * seleciona outro dia no calendário expandido.
 * Inclui botões de editar/excluir para cada log.
 */
export function TodayLogsCard({ selectedDate, today, initialLogs }: TodayLogsCardProps) {
  const [logs, setLogs] = useState<LogWithTask[]>(initialLogs);
  const [isPending, startTransition] = useTransition();
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const [optimisticLogs, dispatchOptimistic] = useOptimistic(
    logs,
    logsReducer
  );

  useEffect(() => {
    // Evita refetch na primeira renderização (já temos initialLogs do servidor)
    if (isSameDay(selectedDate, today) && logs === initialLogs) return;

    startTransition(async () => {
      const fresh = await getLogsForDate(dateStr);
      setLogs(fresh);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr]);

  // Sync when initialLogs change (after revalidation)
  useEffect(() => {
    setLogs(initialLogs);
  }, [initialLogs]);

  const isToday = isSameDay(selectedDate, today);
  const label = isToday
    ? "Registros de hoje"
    : `Registros de ${format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}`;

  return (
    <div className="today-logs-card">
      <h3 className="today-logs-card__title">{label}</h3>

      {isPending ? (
        <p className="today-logs-card__empty">Carregando...</p>
      ) : optimisticLogs.length === 0 ? (
        <p className="today-logs-card__empty">Nenhum registro ainda neste dia.</p>
      ) : (
        <div className="today-logs-card__list">
          {optimisticLogs.map((log) => (
            <LogItem
              key={log.id}
              log={log}
              taskName={log.taskName}
              dispatch={dispatchOptimistic}
              date={dateStr}
            />
          ))}
        </div>
      )}
    </div>
  );
}
