"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from(
    Array.from(rawData).map((char) => char.charCodeAt(0))
  );
}

export default function PushNotificationSetup() {
  useEffect(() => {
    async function setupPushNotifications() {
      try {
        if (typeof window === "undefined") {
          return;
        }

        if (!("serviceWorker" in navigator)) {
          console.log("Service workers are not supported.");
          return;
        }

        if (!("PushManager" in window)) {
          console.log("Push notifications are not supported.");
          return;
        }

        if (!("Notification" in window)) {
          console.log("Notifications are not supported.");
          return;
        }

        const vapidPublicKey =
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

        if (!vapidPublicKey) {
          console.error(
            "NEXT_PUBLIC_VAPID_PUBLIC_KEY is missing."
          );
          return;
        }

        // Register the existing service worker
        const registration =
          await navigator.serviceWorker.register("/sw.js");

        console.log("Service worker registered.");

        // Wait until the service worker is ready
        await navigator.serviceWorker.ready;

        // Check notification permission
        let permission = Notification.permission;

        if (permission === "default") {
          permission = await Notification.requestPermission();
        }

        if (permission !== "granted") {
          console.log(
            "Notification permission was not granted."
          );
          return;
        }

        // Check whether this device already has a subscription
        let subscription =
          await registration.pushManager.getSubscription();

        // Create a new subscription if necessary
        if (!subscription) {
          subscription =
            await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey:
                urlBase64ToUint8Array(vapidPublicKey),
            });

          console.log("New push subscription created.");
        }

        const subscriptionJson = subscription.toJSON();

        const endpoint = subscriptionJson.endpoint;
        const p256dh = subscriptionJson.keys?.p256dh;
        const auth = subscriptionJson.keys?.auth;

        if (!endpoint || !p256dh || !auth) {
          console.error(
            "Push subscription is missing required information."
          );
          return;
        }

        // Save the phone subscription in Supabase
        const { error } = await supabase
          .from("push_subscriptions")
          .upsert(
            {
              endpoint,
              p256dh,
              auth,
            },
            {
              onConflict: "endpoint",
            }
          );

        if (error) {
          console.error(
            "Could not save push subscription:",
            error
          );
          return;
        }

        console.log(
          "Push notifications successfully enabled."
        );
      } catch (error) {
        console.error(
          "Push notification setup failed:",
          error
        );
      }
    }

    setupPushNotifications();
  }, []);

  return null;
}