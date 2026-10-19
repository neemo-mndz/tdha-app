"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import styles from "./AppMenu.module.css";

const destinations = [
  { href: "/", label: "Minha semana", icon: "⌂" },
  { href: "/agenda", label: "Agenda", icon: "▦" },
  { href: "/reading", label: "Acompanhamento de leitura", icon: "▤" },
  { href: "/history", label: "Histórico", icon: "◷" },
  { href: "/settings/reminders", label: "Configurações e lembretes", icon: "⚙" },
  { href: "/profile", label: "Perfil", icon: "○" },
];

export function AppMenu({ avatarUrl }: { avatarUrl?: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div className={styles.container} ref={container} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <button ref={trigger} type="button" className={styles.trigger}
        aria-label={open ? "Fechar menu" : "Abrir menu"} aria-expanded={open}
        aria-controls="app-navigation" onClick={() => setOpen(!open)}>
        <svg aria-hidden="true" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          {open ? <path d="m6 6 12 12M6 18 18 6" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
        </svg>
      </button>
      {open && <nav id="app-navigation" aria-label="Funções do aplicativo" className={styles.panel}>
        <span className={styles.heading}>Seu espaço</span>
        {destinations.map(({ href, label, icon }) => <Link key={href} href={href}
          className={styles.link} aria-current={(href === "/" ? pathname === href : pathname.startsWith(href.split("/reminders")[0])) ? "page" : undefined}
          onClick={() => setOpen(false)}>
          {href === "/profile" && avatarUrl ? <img src={avatarUrl} alt="" className={styles.avatar} /> : <span aria-hidden="true" className={styles.icon}>{icon}</span>}
          {label}
        </Link>)}
        <div className={styles.logout}><LogoutButton /></div>
      </nav>}
    </div>
  );
}
