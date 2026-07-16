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
          className="fab"
        >
          +
        </button>
      )}
      <QuickCaptureSheet open={open} onClose={() => setOpen(false)} date={today} />
    </>
  );
}
