import { getCurrentUserId } from "@/lib/auth";
import { getAgendaWeek } from "@/lib/db/queries/agenda";
import { thoughtDateSchema } from "@/lib/validation/dayThought.schema";
import { AGENDA_TAGS, agendaWeek, type AgendaTag } from "@/lib/agenda/model";
import { rhythmToday } from "@/lib/utils/taskRhythm";
import { AgendaView } from "@/components/agenda/AgendaView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Agenda · semana." };

export default async function AgendaPage({ searchParams }: {
  searchParams: Promise<{ date?: string; view?: string; tag?: string }>;
}) {
  const userId = await getCurrentUserId();
  const params = await searchParams;
  const today = rhythmToday();
  const date = thoughtDateSchema.safeParse(params.date).success ? params.date! : today;
  const view = params.view === "week" ? "week" : "day";
  const tag = AGENDA_TAGS.includes(params.tag as AgendaTag) ? params.tag as AgendaTag : "all";
  const days = agendaWeek(date);
  const entries = await getAgendaWeek(userId, days[0], days[6]);
  return <AgendaView key={`${date}-${view}-${tag}`} initialEntries={entries}
    date={date} today={today} view={view} tag={tag} />;
}
