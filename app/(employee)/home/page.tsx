"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Employee = {
  id?: string;
  name?: string;
  username?: string;
};

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  const bytes = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    bytes[i] = rawData.charCodeAt(i);
  }

  return bytes.buffer;
}

export default function HomePage() {
  const router = useRouter();

  const [employee, setEmployee] = useState<Employee | null>(null);

  const [notificationStatus, setNotificationStatus] = useState<
    "idle" | "loading" | "enabled" | "denied" | "unsupported" | "error"
  >("idle");

  const [notificationMessage, setNotificationMessage] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("employee");

    if (!stored) return;

    try {
      setEmployee(JSON.parse(stored));
    } catch {
      localStorage.removeItem("employee");
    }
  }, []);

  async function enableNotifications() {
    try {
      setNotificationStatus("loading");
      setNotificationMessage("");

      if (typeof window === "undefined") {
        return;
      }

      if (!("serviceWorker" in navigator)) {
        setNotificationStatus("unsupported");
        setNotificationMessage(
          "Your browser does not support notifications."
        );
        return;
      }

      if (!("PushManager" in window)) {
        setNotificationStatus("unsupported");
        setNotificationMessage(
          "Push notifications are not supported on this device."
        );
        return;
      }

      if (!("Notification" in window)) {
        setNotificationStatus("unsupported");
        setNotificationMessage(
          "Notifications are not supported on this device."
        );
        return;
      }

      const vapidPublicKey =
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        console.error(
          "NEXT_PUBLIC_VAPID_PUBLIC_KEY is missing."
        );

        setNotificationStatus("error");
        setNotificationMessage(
          "Notification configuration is missing."
        );
        return;
      }

      const registration =
        await navigator.serviceWorker.register("/sw.js");

      await navigator.serviceWorker.ready;

      let permission = Notification.permission;

      if (permission === "default") {
        permission = await Notification.requestPermission();
      }

      if (permission !== "granted") {
        setNotificationStatus("denied");
        setNotificationMessage(
          "Notifications are blocked. Please allow notifications for Ward Cosmetics in your iPhone settings."
        );
        return;
      }

      let subscription =
        await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription =
          await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey:
              urlBase64ToArrayBuffer(vapidPublicKey),
          });
      }

      const subscriptionJson = subscription.toJSON();

      const endpoint = subscriptionJson.endpoint;
      const p256dh = subscriptionJson.keys?.p256dh;
      const auth = subscriptionJson.keys?.auth;

      if (!endpoint || !p256dh || !auth) {
        console.error(
          "Push subscription is missing required information."
        );

        setNotificationStatus("error");
        setNotificationMessage(
          "Could not create the notification subscription."
        );
        return;
      }

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

        setNotificationStatus("error");
        setNotificationMessage(
          "Could not save notification settings."
        );
        return;
      }

      console.log(
        "Ward Cosmetics push notifications enabled."
      );

      setNotificationStatus("enabled");
      setNotificationMessage(
        "You will now receive notifications when a new order is placed."
      );
    } catch (error) {
      console.error(
        "Failed to enable notifications:",
        error
      );

      setNotificationStatus("error");
      setNotificationMessage(
        "Could not enable notifications. Please try again."
      );
    }
  }

  return (
    <main className="app-page">
      <div className="app-container max-w-5xl">

        {/* WELCOME HEADER */}

        <section className="mb-8 sm:mb-10">

          <div className="mb-4 flex flex-wrap items-center gap-2">

            <span className="app-badge app-badge-rose">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--rose-dark)]" />
              Ward Cosmetics
            </span>

            <span className="app-badge app-badge-green">
              Employee
            </span>

          </div>

          <h1 className="app-title">
            Hello
            {employee?.name ? `, ${employee.name}` : ""}
          </h1>

          <p className="app-subtitle">
            Welcome back. What would you like to do today?
          </p>

        </section>

        {/* PUSH NOTIFICATIONS */}

        <section className="mb-8 sm:mb-10">

          <div className="relative overflow-hidden rounded-[26px] border border-[#dce7de] bg-[var(--green-light)] p-5 shadow-[0_8px_30px_rgba(70,90,75,0.06)] sm:p-6">

            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[var(--green)]/40" />

            <div className="absolute -bottom-16 -left-12 h-32 w-32 rounded-full bg-white/50" />

            <div className="relative">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="min-w-0">

                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--green-dark)]">
                    Order notifications
                  </p>

                  <h2 className="mt-1 text-lg font-extrabold text-[var(--foreground)]">
                    Get notified about new orders
                  </h2>

                  <p className="mt-1 max-w-xl text-xs leading-5 text-[var(--muted)] sm:text-sm">
                    Enable notifications on this device so you know
                    immediately when a customer places a new order.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={enableNotifications}
                  disabled={
                    notificationStatus === "loading" ||
                    notificationStatus === "enabled"
                  }
                  className={`shrink-0 rounded-2xl px-5 py-3 text-sm font-extrabold shadow-sm transition ${
                    notificationStatus === "enabled"
                      ? "cursor-default bg-[#dfeadb] text-[var(--green-dark)]"
                      : notificationStatus === "loading"
                      ? "cursor-wait bg-[#cbdccd] text-[var(--green-dark)]"
                      : "bg-[var(--green)] text-[var(--green-dark)] hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
                  }`}
                >
                  {notificationStatus === "loading"
                    ? "Enabling..."
                    : notificationStatus === "enabled"
                    ? "✓ Notifications Enabled"
                    : "Enable Notifications"}
                </button>

              </div>

              {notificationMessage && (
                <div
                  className={`mt-4 rounded-2xl px-4 py-3 text-xs font-semibold leading-5 ${
                    notificationStatus === "enabled"
                      ? "bg-white/70 text-[var(--green-dark)]"
                      : notificationStatus === "denied" ||
                        notificationStatus === "error"
                      ? "bg-[#fff1f3] text-[#9b5361]"
                      : "bg-white/70 text-[var(--muted)]"
                  }`}
                >
                  {notificationMessage}
                </div>
              )}

            </div>

          </div>

        </section>

        {/* QUICK ACTIONS */}

        <section>

          <div className="mb-4">

            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--rose-dark)]">
              Quick actions
            </p>

            <h2 className="mt-1 text-lg font-extrabold text-[var(--foreground)]">
              Store management
            </h2>

          </div>

          <div className="grid gap-4 sm:grid-cols-2">

            <HomeAction
              icon="▤"
              title="Orders"
              description="View customer orders and prepare them for delivery."
              onClick={() => router.push("/orders")}
              primary
            />

            <HomeAction
              icon="▣"
              title="Register"
              description="Scan products and complete customer sales."
              onClick={() => router.push("/register")}
              variant="green"
            />

            <HomeAction
              icon="◫"
              title="Products"
              description="Search, browse and manage your inventory."
              onClick={() => router.push("/products")}
              variant="green"
            />

            <HomeAction
              icon="+"
              title="Add Product"
              description="Add a new product with barcode, price and image."
              onClick={() => router.push("/add-product")}
              variant="rose"
            />

            <HomeAction
              icon="▦"
              title="Dashboard"
              description="View sales, revenue, stock and store activity."
              onClick={() => router.push("/dashboard")}
              variant="green"
            />

          </div>

        </section>

        {/* OWNER DASHBOARD */}

        <section className="mt-6 sm:mt-7">

          <button
            type="button"
            onClick={() => router.push("/admin-login")}
            className="group relative w-full overflow-hidden rounded-[28px] border border-[#dcc6ca] bg-[#fff5f6] p-5 text-left shadow-[0_8px_30px_rgba(120,75,85,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-[#cfaab1] hover:shadow-[0_14px_35px_rgba(120,75,85,0.11)] active:scale-[0.995] sm:p-6"
          >

            <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-[#e6c7cd]/35 transition duration-300 group-hover:scale-110" />

            <div className="absolute -bottom-20 -left-12 h-40 w-40 rounded-full bg-[#dfeadb]/55 transition duration-300 group-hover:scale-110" />

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[#a45d6b] text-xl font-extrabold text-white shadow-md shadow-[#a45d6b]/15">
                ◆
              </div>

              <div className="min-w-0 flex-1">

                <div className="flex flex-wrap items-center gap-2">

                  <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#a45d6b]">
                    Owner area
                  </p>

                  <span className="rounded-full bg-white/80 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] text-[#7b6569]">
                    Restricted
                  </span>

                </div>

                <h2 className="mt-1.5 text-lg font-extrabold text-[#573e43] sm:text-xl">
                  Owner Dashboard
                </h2>

                <p className="mt-1.5 max-w-2xl text-xs leading-5 text-[#806d70] sm:text-sm">
                  Manage your store, employees, products and
                  administrative settings.
                </p>

              </div>

              <div className="flex items-center justify-between sm:block">

                <span className="text-[10px] font-bold text-[#9a8589] sm:hidden">
                  Owner login required
                </span>

                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-lg text-[#a45d6b] shadow-sm transition duration-200 group-hover:translate-x-1">
                  →
                </span>

              </div>

            </div>

          </button>

        </section>

        {/* EMPLOYEE INFO */}

        {employee?.name && (
          <section className="mt-6 sm:mt-7">

            <div className="app-card overflow-hidden">

              <div className="flex items-center gap-4 p-5 sm:p-6">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--green)] text-lg font-extrabold text-[var(--green-dark)]">
                  {employee.name.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">

                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--rose-dark)]">
                    Signed in as
                  </p>

                  <p className="mt-1 truncate text-sm font-extrabold text-[var(--foreground)]">
                    {employee.name}
                  </p>

                  {employee.username && (
                    <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                      @{employee.username}
                    </p>
                  )}

                </div>

                <div className="hidden rounded-full bg-[var(--green-light)] px-3 py-1.5 text-[10px] font-extrabold text-[var(--green-dark)] sm:block">
                  Active
                </div>

              </div>

            </div>

          </section>
        )}

        {/* FOOTER */}

        <footer className="py-10 text-center sm:py-12">

          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--muted)]">
            Ward Cosmetics
          </p>

          <p className="mt-1 text-[10px] text-[var(--muted)]">
            Store Management System
          </p>

        </footer>

      </div>
    </main>
  );
}

function HomeAction({
  icon,
  title,
  description,
  onClick,
  primary = false,
  variant = "green",
}: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
  primary?: boolean;
  variant?: "green" | "rose";
}) {

  if (primary) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group relative flex min-h-[150px] w-full overflow-hidden rounded-[26px] border border-[var(--rose-dark)] bg-[var(--rose)] p-5 text-left shadow-[0_10px_30px_rgba(155,102,112,0.12)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_15px_38px_rgba(155,102,112,0.18)] active:scale-[0.995] sm:min-h-[170px] sm:p-6"
      >

        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/25 transition duration-300 group-hover:scale-110" />

        <div className="absolute -bottom-14 -left-10 h-28 w-28 rounded-full bg-white/15 transition duration-300 group-hover:scale-110" />

        <div className="relative flex w-full flex-col">

          <div className="flex items-start justify-between">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/65 text-xl font-extrabold text-[var(--rose-dark)] shadow-sm">
              {icon}
            </div>

            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/55 text-lg text-[var(--rose-dark)] transition group-hover:translate-x-1">
              →
            </span>

          </div>

          <div className="mt-auto pt-7">

            <h2 className="text-base font-extrabold text-[var(--rose-dark)]">
              {title}
            </h2>

            <p className="mt-1 max-w-[270px] text-xs leading-5 text-[var(--rose-dark)]/75">
              {description}
            </p>

          </div>

        </div>

      </button>
    );
  }

  const isRose = variant === "rose";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex min-h-[150px] w-full overflow-hidden rounded-[26px] border p-5 text-left shadow-[0_8px_30px_rgba(70,90,75,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_14px_35px_rgba(70,90,75,0.11)] active:scale-[0.995] sm:min-h-[170px] sm:p-6 ${
        isRose
          ? "border-[#ead5d9] bg-[var(--rose-light)] hover:border-[#e4c4ca]"
          : "border-[#dce7de] bg-[var(--green-light)] hover:border-[#cbdccd]"
      }`}
    >

      <div
        className={`absolute -right-12 -top-12 h-32 w-32 rounded-full transition duration-300 group-hover:scale-110 ${
          isRose
            ? "bg-[var(--rose)]/45"
            : "bg-[var(--green)]/55"
        }`}
      />

      <div
        className={`absolute -bottom-16 -left-12 h-32 w-32 rounded-full transition duration-300 ${
          isRose
            ? "bg-white/45"
            : "bg-white/55"
        }`}
      />

      <div className="relative flex w-full flex-col">

        <div className="flex items-start justify-between">

          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-extrabold shadow-sm ${
              isRose
                ? "bg-[var(--rose)] text-[var(--rose-dark)]"
                : "bg-[var(--green)] text-[var(--green-dark)]"
            }`}
          >
            {icon}
          </div>

          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-lg transition group-hover:translate-x-1 ${
              isRose
                ? "text-[var(--rose-dark)]"
                : "text-[var(--green-dark)]"
            }`}
          >
            →
          </span>

        </div>

        <div className="mt-auto pt-7">

          <h2
            className={`text-base font-extrabold ${
              isRose
                ? "text-[var(--rose-dark)]"
                : "text-[var(--green-dark)]"
            }`}
          >
            {title}
          </h2>

          <p className="mt-1 max-w-[270px] text-xs leading-5 text-[var(--muted)]">
            {description}
          </p>

        </div>

      </div>

    </button>
  );
}