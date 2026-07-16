import { QuickCaptureButton } from "@/components/logs/QuickCaptureButton";
import { LogoutButton } from "@/components/auth/LogoutButton";
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
      <nav className="app-nav" aria-label="Navegação principal">
        <LogoutButton />
      </nav>
      {children}
      <QuickCaptureButton activeTasks={activeTasks} />
    </>
  );
}
