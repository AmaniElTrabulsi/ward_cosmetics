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

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setError("");

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: databaseError } = await supabase
        .from("admins")
        .select("*")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (databaseError) {
        console.error("ADMIN LOGIN ERROR:", databaseError);
        setError("Unable to connect to the owner database.");
        return;
      }

      if (!data) {
        setError("Invalid email or password.");
        return;
      }

      if (data.password !== password) {
        setError("Invalid email or password.");
        return;
      }

      /* =====================================================
         DEVICE ID
      ===================================================== */

      let deviceId = localStorage.getItem("device_id");

      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("device_id", deviceId);
      }

      /* =====================================================
         FIRST LOGIN → LOCK THIS DEVICE
      ===================================================== */

      if (!data.device_id) {
        const { error: updateError } = await supabase
          .from("admins")
          .update({
            device_id: deviceId,
          })
          .eq("id", data.id);

        if (updateError) {
          console.error(
            "DEVICE LOCK ERROR:",
            updateError
          );

          setError(
            "We couldn't authorize this device. Please try again."
          );

          return;
        }
      }

      /* =====================================================
         WRONG DEVICE
      ===================================================== */

      if (
        data.device_id &&
        data.device_id !== deviceId
      ) {
        setError(
          "This device is not authorized for the owner account."
        );

        return;
      }

      /* =====================================================
         SAVE ADMIN SESSION
      ===================================================== */

      localStorage.setItem(
        "admin",
        JSON.stringify({
          id: data.id,
          email: data.email,
          device_id: deviceId,
        })
      );

      /* =====================================================
         GO TO OWNER DASHBOARD
      ===================================================== */

      router.replace("/owner-dashboard");
    } catch (err) {
      console.error("OWNER LOGIN ERROR:", err);

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f5f4] px-5 py-8 text-[#292425]">
      <div className="mx-auto flex min-h-[92vh] max-w-md items-center justify-center">
        <div className="w-full">

          {/* =================================================
              BRAND / HEADER
          ================================================= */}

          <div className="mb-8 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-[#e8d6da] bg-[#f5e4e7] shadow-sm">
              <span className="text-2xl text-[#9b5c69]">
                ♛
              </span>
            </div>

            <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#9b5c69]">
              Ward Cosmetics
            </p>

            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#292425]">
              Owner Login
            </h1>

            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[#776d6f]">
              Sign in to access your store's management
              dashboard.
            </p>
          </div>

          {/* =================================================
              LOGIN CARD
          ================================================= */}

          <div className="rounded-[30px] border border-[#e7dedb] bg-white p-6 shadow-[0_20px_60px_rgba(80,60,65,0.08)] sm:p-8">

            <div className="mb-7">

              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#9b5c69]" />

                <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9b5c69]">
                  Secure access
                </span>
              </div>

              <h2 className="mt-3 text-xl font-extrabold text-[#292425]">
                Welcome back
              </h2>

              <p className="mt-1.5 text-sm leading-6 text-[#776d6f]">
                Enter the owner credentials to continue.
              </p>
            </div>

            {/* =================================================
                FORM
            ================================================= */}

            <form
              onSubmit={login}
              className="space-y-5"
            >

              {/* EMAIL */}

              <div>
                <label
                  htmlFor="admin-email"
                  className="mb-2 block text-xs font-extrabold text-[#4d4446]"
                >
                  Email
                </label>

                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="Enter owner email"
                  autoComplete="username"
                  disabled={loading}
                  className="w-full rounded-2xl border border-[#e3dcd9] bg-[#fcfaf9] px-4 py-3.5 text-sm font-medium text-[#292425] outline-none transition placeholder:text-[#aaa0a2] focus:border-[#b46a77] focus:bg-white focus:ring-4 focus:ring-[#b46a77]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {/* PASSWORD */}

              <div>
                <label
                  htmlFor="admin-password"
                  className="mb-2 block text-xs font-extrabold text-[#4d4446]"
                >
                  Password
                </label>

                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter owner password"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full rounded-2xl border border-[#e3dcd9] bg-[#fcfaf9] px-4 py-3.5 text-sm font-medium text-[#292425] outline-none transition placeholder:text-[#aaa0a2] focus:border-[#b46a77] focus:bg-white focus:ring-4 focus:ring-[#b46a77]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {/* ERROR */}

              {error && (
                <div className="rounded-2xl border border-[#ead0d5] bg-[#fff1f3] px-4 py-3.5">
                  <div className="flex items-start gap-3">

                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f2d8dd] text-xs font-extrabold text-[#a34e5d]">
                      !
                    </div>

                    <p className="pt-0.5 text-sm font-semibold leading-5 text-[#9d4d5b]">
                      {error}
                    </p>

                  </div>
                </div>
              )}

              {/* =================================================
                  CONTINUE BUTTON
              ================================================= */}

              <button
                type="submit"
                disabled={loading}
                className="relative z-10 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#9b5c69] px-5 py-4 text-sm font-extrabold text-white shadow-[0_10px_25px_rgba(155,92,105,0.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#864c59] hover:shadow-[0_14px_30px_rgba(155,92,105,0.28)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Checking credentials...
                  </>
                ) : (
                  <>
                    Continue to Dashboard
                    <span className="text-base">
                      →
                    </span>
                  </>
                )}
              </button>

            </form>

            {/* =================================================
                SECURITY NOTE
            ================================================= */}

            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#eef4eb] p-4">

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#dce9d8] text-sm text-[#63795e]">
                ✓
              </div>

              <div>
                <p className="text-xs font-extrabold text-[#53634f]">
                  Owner access
                </p>

                <p className="mt-0.5 text-[11px] leading-5 text-[#71806d]">
                  Your owner account is protected by
                  device authorization.
                </p>
              </div>

            </div>
          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="mt-6 text-center">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#a09698]">
              Ward Cosmetics
            </p>

            <p className="mt-1 text-[10px] text-[#aaa1a3]">
              Owner Management System
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}