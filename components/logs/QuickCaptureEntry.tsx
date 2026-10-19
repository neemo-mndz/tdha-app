"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { QuickCaptureSheet } from "./QuickCaptureSheet";

export function QuickCaptureEntry() {
  const router = useRouter();
  return <QuickCaptureSheet open onClose={() => router.replace("/")}
    date={format(new Date(), "yyyy-MM-dd")} activeTasks={[]} />;
}
