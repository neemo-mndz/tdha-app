import { getCurrentUserId } from "@/lib/auth";
import { getCurrentBook, getFinishedBooks, getQueuedBooks } from "@/lib/db/queries/books";
import { getWeekReadingDays } from "@/lib/db/queries/readingLogs";
import { getBookNotes } from "@/lib/db/queries/bookNotes";
import { currentWeekStart } from "@/lib/utils/date";
import { format } from "date-fns";
import { ReadingCompanion } from "@/components/reading/ReadingCompanion";

export const dynamic = "force-dynamic";

export default async function ReadingPage() {
  const userId = await getCurrentUserId();

  const weekStart = format(currentWeekStart(new Date()), "yyyy-MM-dd");

  const [currentBook, finishedBooks, queue] = await Promise.all([
    getCurrentBook(userId),
    getFinishedBooks(userId),
    getQueuedBooks(userId),
  ]);

  // Only fetch week reading days and notes if there's a current book
  const [weekReadingDays, notes] = currentBook
    ? await Promise.all([
        getWeekReadingDays(currentBook.id, weekStart),
        getBookNotes(currentBook.id),
      ])
    : [[] as string[], [] as never[]];

  return (
    <ReadingCompanion
      currentBook={currentBook}
      weekReadingDays={weekReadingDays}
      notes={notes}
      finishedBooks={finishedBooks}
      queue={queue}
    />
  );
}
