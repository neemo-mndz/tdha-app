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

  const handleRequestPermission = async () => {
    if ("Notification" in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
  };

  // Don't render anything if notifications are granted or not supported
  if (permission === "granted" || permission === null) {
    return null;
  }

  if (permission === "denied") {
    return (
      <div className="notification-banner">
        <p>
          As notificações estão bloqueadas no seu navegador. Para receber lembretes,
          habilite as notificações nas configurações do navegador ou sistema operacional.
        </p>
      </div>
    );
  }

  // permission === "default" — prompt user to enable
  return (
    <div className="notification-banner notification-banner--prompt">
      <p>
        Ative as notificações para receber lembretes no horário configurado.
      </p>
      <button
        className="notification-banner__btn"
        onClick={handleRequestPermission}
      >
        Ativar notificações
      </button>
    </div>
  );
}
