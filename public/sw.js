self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {
      title: "Ward Cosmetics",
      body: "You have a new notification.",
    };
  }

  const title = data.title || "Ward Cosmetics";

  const options = {
    body: data.body || "You have a new notification.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "ward-cosmetics-notification",
    renotify: true,
    data: {
      url: data.url || "/employee",
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});


self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/employee";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});