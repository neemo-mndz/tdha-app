import { QuickCaptureButton } from "@/components/logs/QuickCaptureButton";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <QuickCaptureButton />
    </>
  );
}
