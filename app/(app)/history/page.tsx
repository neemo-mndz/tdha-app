import { getCurrentUserId } from "@/lib/auth";
import { getUserTags } from "@/lib/db/queries/tags";
import { searchLogs } from "@/lib/db/queries/search";
import { HistoryPage } from "@/components/history/HistoryPage";

export const dynamic = "force-dynamic";

export default async function HistoryRoute() {
  const userId = await getCurrentUserId();

  const [userTags, initialResults] = await Promise.all([
    getUserTags(userId),
    searchLogs(userId, { text: "", tagIds: [], weekStart: null }),
  ]);

  return <HistoryPage userTags={userTags} initialResults={initialResults} />;
}
