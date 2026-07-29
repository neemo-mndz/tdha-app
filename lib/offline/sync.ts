import { getPendingLogs, removePendingLog } from "./db";
import { createLog } from "@/lib/actions/logs";

/**
 * Synchronizes pending offline logs with the server when network connectivity is restored.
 */
export async function syncPendingLogs(): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingLogs();
  if (pending.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      if (item.type === "create") {
        const result = await createLog({
          content: item.content,
          date: item.date,
          weekPlanTaskId: item.weekPlanTaskId ?? null,
        });

        if (result.success) {
          await removePendingLog(item.id);
          synced++;
        } else {
          failed++;
        }
      }
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}
