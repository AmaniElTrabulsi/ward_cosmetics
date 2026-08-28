"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: loginError } = await supabase
        .from("admins")
        .select("*")
        .eq("email", cleanEmail)
        .eq("password", password)
        .maybeSingle();

      if (loginError) {
        console.error(
          "ADMIN LOGIN DATABASE ERROR:",
          loginError
        );

        setError(
          "Unable to connect to the owner account."
        );

        return;
      }

      if (!data) {
        setError("Invalid email or password.");
        return;
      }

      let deviceId = localStorage.getItem("device_id");

      if (!deviceId) {
        deviceId = crypto.randomUUID();

        localStorage.setItem(
          "device_id",
          deviceId
        );
      }

      if (!data.device_id) {
        const { error: deviceError } =
          await supabase
            .from("admins")
            .update({
              device_id: deviceId,
            })
            .eq("id", data.id);

        if (deviceError) {
          console.error(
            "DEVICE AUTHORIZATION ERROR:",
            deviceError
          );

          setError(
            "Could not authorize this device."
          );

          return;
        }

        data.device_id = deviceId;
      }

      if (
        data.device_id &&
        data.device_id !== deviceId
      ) {
        setError(
          "This device is not authorized to access the owner dashboard."
        );

        return;
      }

      localStorage.setItem(
        "admin",
        JSON.stringify(data)
      );

      router.replace("/owner-dashboard");
    } catch (error) {
      console.error(
        "ADMIN LOGIN ERROR:",
        error
      );

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-8">

      <div className="mx-auto flex min-h-[90vh] max-w-md items-center justify-center">

        <div className="w-full">

          {/* HEADER */}

          <div className="mb-8 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-[#ead5d9] bg-[var(--rose-light)] shadow-sm">
              <span className="text-xl font-bold text-[var(--rose-dark)]">
                O
              </span>
            </div>

            <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[var(--rose-dark)]">
              Ward Cosmetics
            </p>

            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[var(--text)]">
              Owner Dashboard
            </h1>

            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
              Sign in to manage your store.
            </p>

          </div>

          {/* LOGIN CARD */}

          <div className="overflow-hidden rounded-[30px] border border-[var(--border)] bg-white shadow-[0_20px_60px_rgba(70,60,60,0.08)]">

            <div className="h-1.5 bg-[var(--rose)]" />

            <div className="p-6 sm:p-8">

              {/* CARD HEADER */}

              <div className="mb-7">

                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--green-light)] px-3 py-1.5">

                  <span className="h-2 w-2 rounded-full bg-[var(--green-dark)]" />

                  <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[var(--green-dark)]">
                    Owner access
                  </span>

                </div>

                <h2 className="text-xl font-extrabold text-[var(--text)]">
                  Welcome back
                </h2>

                <p className="mt-1.5 text-sm leading-6 text-[var(--text-muted)]">
                  Enter your owner credentials below.
                </p>

              </div>

              {/* FORM */}

              <form
                onSubmit={handleLogin}
                className="space-y-5"
              >

                {/* EMAIL */}

                <div>

                  <label
                    htmlFor="owner-email"
                    className="mb-2 block text-xs font-extrabold text-[var(--text)]"
                  >
                    Email address
                  </label>

                  <input
                    id="owner-email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="Enter your email"
                    autoComplete="username"
                    disabled={loading}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3.5 text-sm font-semibold text-[var(--text)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--rose)] focus:bg-white focus:ring-4 focus:ring-rose-100 disabled:opacity-60"
                  />

                </div>

                {/* PASSWORD */}

                <div>

                  <label
                    htmlFor="owner-password"
                    className="mb-2 block text-xs font-extrabold text-[var(--text)]"
                  >
                    Password
                  </label>

                  <input
                    id="owner-password"
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3.5 text-sm font-semibold text-[var(--text)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--rose)] focus:bg-white focus:ring-4 focus:ring-rose-100 disabled:opacity-60"
                  />

                </div>

                {/* SECURITY INFO */}

                <div className="rounded-2xl border border-[#dce7d9] bg-[var(--green-light)] p-4">

                  <div className="flex gap-3">

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold text-[var(--green-dark)] shadow-sm">
                      ✓
                    </div>

                    <div>

                      <p className="text-xs font-extrabold text-[var(--green-dark)]">
                        Owner access
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-[var(--text-muted)]">
                        This account can access the
                        store management dashboard.
                      </p>

                    </div>

                  </div>

                </div>

                {/* ERROR */}

                {error && (
                  <div className="rounded-2xl border border-[#edd0d5] bg-[var(--rose-light)] p-4">

                    <p className="text-sm font-extrabold text-[var(--rose-dark)]">
                      Sign in unsuccessful
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                      {error}
                    </p>

                  </div>
                )}

                {/* LOGIN BUTTON */}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-[var(--rose)] px-5 py-4 text-sm font-extrabold text-[var(--rose-dark)] shadow-lg transition hover:bg-[var(--rose-dark)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Signing in..."
                    : "Continue to Owner Dashboard"}
                </button>

              </form>

            </div>

          </div>

          {/* BACK BUTTON */}

          <button
            type="button"
            onClick={() => router.push("/home")}
            className="mx-auto mt-6 block text-xs font-bold text-[var(--text-muted)] transition hover:text-[var(--rose-dark)]"
          >
            ← Back to employee area
          </button>

          {/* FOOTER */}

          <footer className="py-7 text-center">

            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Ward Cosmetics
            </p>

            <p className="mt-1 text-[10px] text-[var(--text-muted)]">
              Owner Management System
            </p>

          </footer>

        </div>

      </div>

    </main>
  );
}