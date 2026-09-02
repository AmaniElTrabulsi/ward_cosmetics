import "@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey
);

webpush.setVapidDetails(
  "mailto:wardcosmetics@example.com",
  vapidPublicKey,
  vapidPrivateKey
);

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: "Method not allowed",
        }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const body = await req.json();

    const customerName = body.customerName || "A customer";
    const orderId = body.orderId || "";

    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth");

    if (error) {
      console.error("Could not load subscriptions:", error);

      return new Response(
        JSON.stringify({
          error: "Could not load push subscriptions.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const notificationPayload = JSON.stringify({
      title: "🛍️ New Ward Cosmetics Order",
      body: `New order from ${customerName}.`,
      tag: `new-order-${orderId || Date.now()}`,
      url: "/orders",
    });

    let sent = 0;
    let removed = 0;

    for (const subscription of subscriptions || []) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          notificationPayload
        );

        sent++;
      } catch (error) {
        console.error(
          "Push notification failed:",
          subscription.endpoint,
          error
        );

        const statusCode =
          (error as { statusCode?: number })?.statusCode;

        if (statusCode === 404 || statusCode === 410) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", subscription.id);

          removed++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        removed,
        subscriptions: subscriptions?.length || 0,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Notification function error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to send notifications.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
});