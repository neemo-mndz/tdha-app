import Link from "next/link";
import { QuickCaptureButton } from "@/components/logs/QuickCaptureButton";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { MonthBadge } from "@/components/home/MonthBadge";
import { getCurrentUserId } from "@/lib/auth";
import { getWeekPlan } from "@/lib/db/queries/weekPlans";
import { currentWeekStart } from "@/lib/utils/date";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getCurrentUserId();
  const weekStart = format(currentWeekStart(), "yyyy-MM-dd");
  const plan = await getWeekPlan(userId, weekStart);
  const activeTasks = plan?.tasks ?? [];

  return (
    <>
      <header className="app-header" aria-label="Navegação principal">
        <Link href="/" className="brand">semana<span>.</span></Link>
        <div className="app-header__right">
          <MonthBadge />
          <Link href="/reading" className="top__settings-link" aria-label="Leitura">
            📖
          </Link>
          <Link href="/settings/reminders" className="top__settings-link" aria-label="Lembretes">
            ⚙
          </Link>
          <LogoutButton />
        </div>
      </header>
      {children}
      <QuickCaptureButton activeTasks={activeTasks} />
    </>
  );
}
