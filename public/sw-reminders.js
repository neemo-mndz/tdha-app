/// Service Worker for semana. — PWA + Reminders

const CACHE_NAME = 'semana-v1';
const STATIC_ASSETS = [
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon.svg',
];

let reminders = [];
const firedToday = new Map();

// Install: cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches and claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first with cache fallback for navigation
self.addEventListener("fetch", (event) => {
  // Only handle same-origin GET requests
  if (event.request.method !== 'GET') return;

  // For navigation requests, try network first, fall back to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/') || caches.match(event.request))
    );
    return;
  }

  // For static assets (icons), serve from cache first
  if (event.request.url.includes('/icons/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
    return;
  }

  // Everything else: network only
});

// Receive reminders from the app
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SYNC_REMINDERS") {
    reminders = event.data.reminders || [];
  }
});

// Check reminders every 30 seconds
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
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
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
