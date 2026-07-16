"use client";

import { useEffect, useState, useTransition } from "react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getLogsForDate } from "@/lib/actions/logs";
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
 */
export function TodayLogsCard({ selectedDate, today, initialLogs }: TodayLogsCardProps) {
  const [logs, setLogs] = useState<LogWithTask[]>(initialLogs);
  const [isPending, startTransition] = useTransition();
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  useEffect(() => {
    // Evita refetch na primeira renderização (já temos initialLogs do servidor)
    if (isSameDay(selectedDate, today) && logs === initialLogs) return;

    startTransition(async () => {
      const fresh = await getLogsForDate(dateStr);
      setLogs(fresh);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr]);

  const isToday = isSameDay(selectedDate, today);
  const label = isToday
    ? "Registros de hoje"
    : `Registros de ${format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}`;

  return (
    <div className="today-logs-card">
      <h3 className="today-logs-card__title">{label}</h3>

      {isPending ? (
        <p className="today-logs-card__empty">Carregando...</p>
      ) : logs.length === 0 ? (
        <p className="today-logs-card__empty">Nenhum registro ainda neste dia.</p>
      ) : (
        <div className="today-logs-card__list">
          {logs.map((log) => (
            <div key={log.id} className="today-logs-card__item">
              <span className="today-logs-card__time">
                {format(new Date(log.createdAt), "HH:mm")}
              </span>
              <span className="today-logs-card__text">
                {log.content}
                {log.taskName && (
                  <span className="log-item__tag">{log.taskName}</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
