"use client";

import { useState } from "react";
import { format } from "date-fns";
import { QuickCaptureSheet } from "./QuickCaptureSheet";

export function QuickCaptureButton() {
  const [open, setOpen] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <>
      {!open && (
        <button
          aria-label="Captura rápida"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 rounded-full bg-blue-600 p-4 text-white shadow-lg"
        >
          +
        </button>
      )}
      <QuickCaptureSheet open={open} onClose={() => setOpen(false)} date={today} />
    </>
  );
}
