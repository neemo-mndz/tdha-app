import Link from "next/link";
import { QuickCaptureButton } from "@/components/logs/QuickCaptureButton";
import { AppMenu } from "@/components/navigation/AppMenu";
import { MonthBadge } from "@/components/home/MonthBadge";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { getCurrentUserId } from "@/lib/auth";
import { getWeekPlan } from "@/lib/db/queries/weekPlans";
import { getUserProfile } from "@/lib/db/queries/profile";
import { currentWeekStart, getBrazilNow } from "@/lib/utils/date";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getCurrentUserId();
  const weekStart = format(currentWeekStart(getBrazilNow()), "yyyy-MM-dd");
  const [plan, profile] = await Promise.all([
    getWeekPlan(userId, weekStart),
    getUserProfile(userId),
  ]);
  const activeTasks = plan?.tasks ?? [];

  return (
    <>
      <OfflineBanner />
      <header className="app-header" aria-label="Navegação principal">
        <Link href="/" className="brand">semana<span>.</span></Link>
        <div className="app-header__right">
          <MonthBadge />
          <AppMenu avatarUrl={profile?.avatarUrl} />
        </div>
      </header>
      {children}
      <QuickCaptureButton activeTasks={activeTasks} />
    </>
  );
}
