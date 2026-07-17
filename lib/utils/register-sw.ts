export async function registerReminderSW() {
  if (!("serviceWorker" in navigator)) return null;

  const registration = await navigator.serviceWorker.register("/sw-reminders.js");

  // If no controller yet (first install), wait for it to activate
  if (!navigator.serviceWorker.controller) {
    await new Promise<void>((resolve) => {
      navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true });
    });
  }

  return registration;
}

export function syncRemindersToSW(
  reminders: Array<{ id: string; hour: number; minute: number; active: boolean }>
) {
  if (!("serviceWorker" in navigator)) return;

  const controller = navigator.serviceWorker.controller;
  if (controller) {
    controller.postMessage({
      type: "SYNC_REMINDERS",
      reminders,
    });
  } else {
    // Fallback: wait for controller and then sync
    navigator.serviceWorker.ready.then((reg) => {
      reg.active?.postMessage({
        type: "SYNC_REMINDERS",
        reminders,
      });
    });
  }
}
