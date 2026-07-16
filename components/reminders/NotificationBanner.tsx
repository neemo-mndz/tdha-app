"use client";

import { useEffect, useState } from "react";

/**
 * Requests notification permission if status is "default".
 * Call this after the user creates their first reminder.
 */
export function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

export function NotificationBanner() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  if (permission !== "denied") {
    return null;
  }

  return (
    <div className="notification-banner">
      <p>
        As notificações estão bloqueadas no seu navegador. Para receber lembretes,
        habilite as notificações nas configurações do navegador ou sistema operacional.
      </p>
    </div>
  );
}
