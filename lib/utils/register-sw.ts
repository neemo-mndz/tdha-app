export async function registerReminderSW() {
  if ("serviceWorker" in navigator) {
    return navigator.serviceWorker.register("/sw-reminders.js");
  }
  return null;
}

export function syncRemindersToSW(
  reminders: Array<{ id: string; hour: number; minute: number; active: boolean }>
) {
  navigator.serviceWorker?.controller?.postMessage({
    type: "SYNC_REMINDERS",
    reminders,
  });
}
