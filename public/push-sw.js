/* Push only: this worker never intercepts requests or caches financial data. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("push", event => {
  let message;
  try { message = event.data.json(); } catch { return; }
  if (!message || typeof message.title !== "string" || typeof message.body !== "string") return;
  const url = new URL(typeof message.url === "string" ? message.url : "/home", self.location.origin);
  const safeUrl = url.origin === self.location.origin && (/^\/groups\/[a-f0-9-]+\/transactions$/.test(url.pathname) || ["/home", "/transactions"].includes(url.pathname)) ? url.pathname : "/home";
  event.waitUntil(self.registration.showNotification(message.title, {
    body: message.body, icon: "/pwa/icon-192.png", tag: message.tag,
    data: { url: safeUrl },
  }));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/home", self.location.origin);
  if (url.origin !== self.location.origin) return;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    // Preserve drafts in other windows instead of navigating a member away from an editor.
    const existing = windows.find(client => client.url === url.href);
    if (existing) return existing.focus();
    return self.clients.openWindow(url.href);
  })());
});
