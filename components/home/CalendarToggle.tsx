"use client";

import { useState } from "react";

interface CalendarToggleProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function CalendarToggle({ children, defaultOpen = false }: CalendarToggleProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <>
      <button
        className="calendar-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{open ? "Ocultar calendário" : "Ver calendário da semana"}</span>
        <span style={{ display: "inline-block", transition: "transform 0.2s ease", transform: open ? "rotate(180deg)" : "none" }}>
          ⌄
        </span>
      </button>

      <div
        style={{
          maxHeight: open ? "900px" : "0",
          overflow: "hidden",
          transition: "max-height 0.28s ease",
        }}
      >
        {children}
      </div>
    </>
  );
}
