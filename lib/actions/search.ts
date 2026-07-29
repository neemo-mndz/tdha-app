"use server";

import { searchLogsSchema } from "@/lib/validation/search.schema";
import {
  searchLogs as searchLogsQuery,
  type SearchResult,
} from "@/lib/db/queries/search";
import { getCurrentUserId } from "@/lib/auth";

export async function searchLogs(input: unknown): Promise<SearchResult[]> {
  const parsed = searchLogsSchema.safeParse(input);
  if (!parsed.success) {
    return [];
  }

  const userId = await getCurrentUserId();
  return searchLogsQuery(userId, parsed.data);
}
