import { z } from "zod";
import { notFound } from "next/navigation";
import { isValid, parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getDayLogs } from "@/lib/db/queries/logs";
import { getWeekStart } from "@/lib/utils/date";
import { LogList } from "@/components/logs/LogList";
import { getCurrentUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Don't prerender any date pages at build time
export function generateStaticParams() {
  return [];
}

const dateParamSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido")
  .refine((s) => isValid(parseISO(s)), "Data inválida");

interface DayPageProps {
  params: Promise<{ date: string }>;
}

export default async function DayPage({ params }: DayPageProps) {
  const { date } = await params;

  const parsed = dateParamSchema.safeParse(date);
  if (!parsed.success) notFound();

  const dateString = parsed.data;
  const userId = await getCurrentUserId();
  const logs = await getDayLogs(userId, dateString);
  const weekStart = getWeekStart(dateString);
  const isToday = dateString === format(new Date(), "yyyy-MM-dd");
  const displayDate = format(parseISO(dateString), "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <main className="day-view">
      <header className="day-view__header">
        <a href={`/week/${weekStart}`} className="day-view__back">← Voltar à semana</a>
        <h1 className="day-view__title">{isToday ? "Hoje" : displayDate}</h1>
      </header>
      <LogList initialLogs={logs} date={dateString} />
    </main>
  );
}
