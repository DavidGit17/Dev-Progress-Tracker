/* eslint-disable no-undef */

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = {
      notification: { title: "Task Reminder", body: event.data.text() },
    };
  }

  const notification = payload.notification || payload.data || {};

  event.waitUntil(
    self.registration.showNotification(notification.title || "Task Reminder", {
      body: notification.body || "You have an upcoming task.",
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      data: payload.data || {},
      tag: payload?.data?.tag || "task-reminder",
      renotify: true,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow("/");
        }

        return undefined;
      }),
  );
});
