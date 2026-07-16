import Link from "next/link";
import { getCurrentUserId } from "@/lib/auth";
import { getReminders } from "@/lib/db/queries/reminders";
import { ReminderForm } from "@/components/reminders/ReminderForm";
import { ReminderList } from "@/components/reminders/ReminderList";
import { NotificationBanner } from "@/components/reminders/NotificationBanner";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  const userId = await getCurrentUserId();
  const reminders = await getReminders(userId);

  return (
    <div className="reminders-page">
      <header className="reminders-page__header">
        <Link href="/" className="reminders-page__back">
          ← Voltar
        </Link>
        <h1 className="reminders-page__title">Lembretes</h1>
      </header>

      <NotificationBanner />
      <ReminderForm />
      <ReminderList initialReminders={reminders} />
    </div>
  );
}
