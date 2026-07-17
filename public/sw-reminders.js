/// Service Worker for semana. — Reminders + PWA installability

let reminders = [];
const firedToday = new Map();

// Activate immediately without waiting
self.addEventListener("install", () => {
  self.skipWaiting();
});

// Claim clients immediately so messages work on first visit
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Required fetch handler for PWA installability
// We use network-first strategy (no offline cache for now)
self.addEventListener("fetch", (event) => {
  // Let all requests pass through to the network
  return;
});

// Receive reminders from the app
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SYNC_REMINDERS") {
    reminders = event.data.reminders || [];
  }
});

// Check reminders every 30 seconds (more reliable than 60s)
setInterval(() => {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const today = now.toISOString().slice(0, 10);

  // Clean up old entries from firedToday
  for (const [id, date] of firedToday) {
    if (date !== today) firedToday.delete(id);
  }

  for (const r of reminders) {
    if (!r.active) continue;
    if (r.hour !== h || r.minute !== m) continue;
    if (firedToday.get(r.id) === today) continue;

    firedToday.set(r.id, today);

    const msgs = [
      "Hora de registrar o seu dia.",
      "Seu espaço está aqui quando você quiser.",
      "Um momento para você. Registre algo.",
      "Como foi seu dia? Anote quando quiser.",
    ];

    self.registration.showNotification("semana.", {
      body: msgs[Math.floor(Math.random() * msgs.length)],
      icon: "/icons/icon.svg",
      badge: "/icons/icon.svg",
      tag: `reminder-${r.id}`,
      renotify: false,
    });
  }
}, 30000);

// Handle notification click — open the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow("/");
    })
  );
});
