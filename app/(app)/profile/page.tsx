import { getCurrentUserId } from "@/lib/auth";
import { getUserProfile } from "@/lib/db/queries/profile";
import { getDaysWithLogs } from "@/lib/db/queries/report";
import { ProfilePage } from "@/components/profile/ProfilePage";
import { currentWeekStart } from "@/lib/utils/date";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function ProfilePageRoute() {
  const userId = await getCurrentUserId();

  const today = new Date();
  const weekStart = format(currentWeekStart(today), "yyyy-MM-dd");

  const [profile, daysWithLogs] = await Promise.all([
    getUserProfile(userId),
    getDaysWithLogs(userId, weekStart),
  ]);

  return (
    <ProfilePage
      user={
        profile ?? {
          id: userId,
          email: "",
          name: null,
          avatarUrl: null,
          birthDate: null,
          createdAt: new Date(),
        }
      }
      daysWithLogs={daysWithLogs}
    />
  );
}
