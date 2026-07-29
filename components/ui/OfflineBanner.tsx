"use client";

import { useState, useEffect, useCallback } from "react";
import { getPendingLogs } from "@/lib/offline/db";
import { syncPendingLogs } from "@/lib/offline/sync";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const checkPending = useCallback(async () => {
    const items = await getPendingLogs();
    setPendingCount(items.length);
  }, []);

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const { synced } = await syncPendingLogs();
      if (synced > 0) {
        await checkPending();
      }
    } finally {
      setIsSyncing(false);
    }
  }, [checkPending]);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    checkPending();

    function handleOnline() {
      setIsOffline(false);
      handleSync();
    }

    function handleOffline() {
      setIsOffline(true);
      checkPending();
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [checkPending, handleSync]);

  if (!isOffline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <div
      className={`offline-banner ${isOffline ? "offline-banner--offline" : "offline-banner--syncing"}`}
      role="status"
      aria-live="polite"
    >
      <div className="offline-banner__inner">
        {isOffline ? (
          <>
            <span className="offline-banner__icon">📡</span>
            <span>
              Você está offline. Seus registros estão salvos localmente
              {pendingCount > 0 && ` (${pendingCount} pendente)`} e serão sincronizados ao reconectar.
            </span>
          </>
        ) : isSyncing ? (
          <>
            <span className="offline-banner__icon">⚡</span>
            <span>Sincronizando registros offline com o servidor...</span>
          </>
        ) : (
          <>
            <span className="offline-banner__icon">💾</span>
            <span>
              {pendingCount} registro(s) salvo(s) offline.{" "}
              <button
                type="button"
                onClick={handleSync}
                className="offline-banner__btn"
              >
                Sincronizar agora
              </button>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
