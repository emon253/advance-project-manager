/* Push notifications for the installed app and open browsers. Loaded into the
   generated service worker (vite.config: workbox.importScripts). */
self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { /* not JSON: show the default text */ }
  event.waitUntil(self.registration.showNotification(payload.title || "Carbarn Hub", {
    body: payload.body || "You have a new notification.",
    icon: "/pwa-192.png",
    badge: "/shortcut-96.png",
    tag: payload.notificationId ? `hub-${payload.notificationId}` : "hub",
    data: { url: payload.url || "/inbox" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/inbox", self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const open = windows.find((c) => new URL(c.url).origin === self.location.origin);
    if (open) {
      await open.focus();
      if ("navigate" in open) await open.navigate(url);
      return;
    }
    await self.clients.openWindow(url);
  })());
});
