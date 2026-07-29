"use client";

import { useEffect, useTransition } from "react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getLogsForDate } from "@/lib/actions/logs";
import { LogItem } from "@/components/logs/LogItem";
import { useLogs } from "@/components/home/LogsProvider";

interface TodayLogsCardProps {
  allUserTags?: { id: string; name: string }[];
}

/**
 * Card sempre visível que exibe os registros do dia atualmente selecionado.
 * Fica logo abaixo do botão "Ver calendário da semana", independente do
 * calendário estar expandido ou recolhido. Atualiza quando o usuário
 * seleciona outro dia no calendário expandido.
 * Inclui botões de editar/excluir para cada log.
 */
export function TodayLogsCard({ allUserTags = [] }: TodayLogsCardProps) {
  const { selectedDate, todayDate, logs, setLogs, optimisticLogs, dispatchOptimistic } = useLogs();
  const [isPending, startTransition] = useTransition();
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  useEffect(() => {
    if (isSameDay(selectedDate, todayDate)) return;

    startTransition(async () => {
      const fresh = await getLogsForDate(dateStr);
      setLogs(fresh);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr]);

  const isToday = isSameDay(selectedDate, todayDate);
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
              allUserTags={allUserTags}
            />
          ))}
        </div>
      )}
    </div>
  );
}
