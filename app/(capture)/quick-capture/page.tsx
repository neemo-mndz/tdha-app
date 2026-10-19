import { getCurrentUserId } from "@/lib/auth";
import { QuickCaptureEntry } from "@/components/logs/QuickCaptureEntry";

export const dynamic = "force-dynamic";

export default async function QuickCapturePage() {
  await getCurrentUserId("/quick-capture");
  return <QuickCaptureEntry />;
}
