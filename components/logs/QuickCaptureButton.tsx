"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { format } from "date-fns";
import { QuickCaptureSheet } from "./QuickCaptureSheet";
import { ActiveTaskDisplay } from "@/lib/types/tasks";

interface QuickCaptureButtonProps {
  activeTasks?: ActiveTaskDisplay[];
}

export function QuickCaptureButton({ activeTasks = [] }: QuickCaptureButtonProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");

  if (pathname === "/agenda" || pathname.startsWith("/agenda/")) return null;

  return (
    <>
      {!open && (
        <button
          aria-label="Captura rápida"
          onClick={() => setOpen(true)}
          className="fab"
        >
          +
        </button>
      )}
      <QuickCaptureSheet open={open} onClose={() => setOpen(false)} date={today} activeTasks={activeTasks} />
    </>
  );
}
