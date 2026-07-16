"use client";

import { useTransition } from "react";
import { logoutAction } from "@/lib/actions/auth";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="logout-button"
      disabled={isPending}
      aria-label="Sair da conta"
      onClick={() => startTransition(() => logoutAction())}
    >
      {isPending ? "Saindo…" : "Sair"}
    </button>
  );
}
