let reminders = [];
const firedToday = new Map();

self.addEventListener("message", (event) => {
  if (event.data.type === "SYNC_REMINDERS") {
    reminders = event.data.reminders;
  }
});

setInterval(() => {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const today = now.toISOString().slice(0, 10);

  for (const r of reminders) {
    if (!r.active || r.hour !== h || r.minute !== m) continue;
    if (firedToday.get(r.id) === today) continue;
    firedToday.set(r.id, today);
    const msgs = [
      "Hora de registrar o seu dia.",
      "Seu espaço está aqui quando você quiser.",
    ];
    self.registration.showNotification("semana.", {
      body: msgs[Math.floor(Math.random() * msgs.length)],
    });
  }
}, 60000);
