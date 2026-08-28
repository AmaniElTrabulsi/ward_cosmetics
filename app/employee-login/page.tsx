"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function EmployeeLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    const cleanUsername = username.trim();

    if (!cleanUsername || !password) {
      setError(
        "Please enter your username and password."
      );
      return;
    }

    setLoading(true);

    try {
      const { data, error: databaseError } =
        await supabase
          .from("employees")
          .select("id, name, username, password")
          .eq("username", cleanUsername)
          .maybeSingle();

      if (databaseError) {
        console.error(databaseError);

        setError(
          "Unable to connect to the employee database."
        );

        return;
      }

      if (!data) {
        setError("Invalid username or password.");
        return;
      }

      if (data.password !== password) {
        setError("Invalid username or password.");
        return;
      }

      localStorage.setItem(
        "employee",
        JSON.stringify({
          id: data.id,
          name: data.name,
          username: data.username,
        })
      );

      router.replace("/home");
    } catch (err) {
      console.error(err);

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fbf8f7] px-5 py-8 text-[#342d2f]">

      {/* ================================================= */}
      {/* DECORATIVE BACKGROUND */}
      {/* ================================================= */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#f5dfe4] opacity-70 blur-2xl" />

        <div className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-[#dfeeda] opacity-75 blur-2xl" />

        <div className="absolute left-[15%] top-[18%] h-20 w-20 rounded-full bg-[#f8e8eb] opacity-50 blur-xl" />

        <div className="absolute right-[12%] top-[35%] h-24 w-24 rounded-full bg-[#eaf3e6] opacity-60 blur-xl" />

      </div>

      {/* ================================================= */}
      {/* CONTENT */}
      {/* ================================================= */}

      <div className="relative mx-auto flex min-h-[92vh] max-w-md items-center justify-center">

        <div className="w-full">

          {/* ================================================= */}
          {/* BRAND */}
          {/* ================================================= */}

          <div className="mb-7 text-center">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] border border-white bg-white shadow-[0_15px_40px_rgba(100,70,75,0.10)]">

              <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#f5dfe4] text-2xl shadow-sm">
                🛍️
              </div>

            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#f5dfe4] px-3.5 py-1.5">

              <span className="h-1.5 w-1.5 rounded-full bg-[#b45b6c]" />

              <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#9d4f60]">
                Ward Cosmetics
              </span>

            </div>

            <h1 className="mt-4 text-[30px] font-extrabold tracking-tight text-[#342d2f] sm:text-[34px]">
              Welcome back
            </h1>

            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[#887c80]">
              Sign in to manage your store,
              inventory and sales.
            </p>

          </div>

          {/* ================================================= */}
          {/* LOGIN CARD */}
          {/* ================================================= */}

          <div className="rounded-[32px] border border-[#eadfe0] bg-white p-6 shadow-[0_20px_60px_rgba(82,57,61,0.08)] sm:p-8">

            {/* CARD TOP */}
            <div className="mb-7">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#a85566]">
                    Employee access
                  </p>

                  <h2 className="mt-1.5 text-xl font-extrabold text-[#3b3335]">
                    Sign in
                  </h2>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef5eb] text-lg text-[#55704d]">
                  ✓
                </div>

              </div>

              <p className="mt-2 text-xs leading-5 text-[#8b8083]">
                Enter the employee credentials
                provided by the store owner.
              </p>

            </div>

            {/* ================================================= */}
            {/* FORM */}
            {/* ================================================= */}

            <form
              onSubmit={handleLogin}
              className="space-y-5"
            >

              {/* USERNAME */}

              <div>

                <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#665b5e]">
                  Username
                </label>

                <div className="relative">

                  <span className="pointer-events-none absolute left-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl bg-[#f5dfe4] text-sm text-[#a85566]">
                    @
                  </span>

                  <input
                    type="text"
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value)
                    }
                    placeholder="Enter username"
                    autoComplete="username"
                    className="w-full rounded-[18px] border border-[#e7dddd] bg-[#fdfafa] py-3.5 pl-14 pr-4 text-sm font-medium text-[#3b3335] outline-none transition placeholder:text-[#aaa0a2] focus:border-[#d49aa5] focus:bg-white focus:ring-4 focus:ring-[#f5dfe4]"
                  />

                </div>

              </div>

              {/* PASSWORD */}

              <div>

                <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#665b5e]">
                  Password
                </label>

                <div className="relative">

                  <span className="pointer-events-none absolute left-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl bg-[#dfeeda] text-sm text-[#55704d]">
                    •••
                  </span>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Enter password"
                    autoComplete="current-password"
                    className="w-full rounded-[18px] border border-[#e7dddd] bg-[#fdfafa] py-3.5 pl-14 pr-4 text-sm font-medium text-[#3b3335] outline-none transition placeholder:text-[#aaa0a2] focus:border-[#a9c09f] focus:bg-white focus:ring-4 focus:ring-[#dfeeda]"
                  />

                </div>

              </div>

              {/* ERROR */}

              {error && (
                <div className="rounded-[18px] border border-[#ecd0d5] bg-[#fdf0f2] px-4 py-3.5">

                  <div className="flex items-start gap-3">

                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#f5dfe4] text-xs font-extrabold text-[#a85566]">
                      !
                    </div>

                    <div>
                      <p className="text-xs font-extrabold text-[#9d4f60]">
                        Sign in failed
                      </p>

                      <p className="mt-0.5 text-[11px] leading-5 text-[#a76c76]">
                        {error}
                      </p>
                    </div>

                  </div>

                </div>
              )}

              {/* SIGN IN BUTTON */}

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-[18px] bg-[#b96070] px-4 py-4 text-sm font-extrabold text-white shadow-[0_10px_25px_rgba(185,96,112,0.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#a95263] hover:shadow-[0_14px_30px_rgba(185,96,112,0.28)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >

                <span className="relative z-10 flex items-center justify-center gap-2">

                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Checking credentials...
                    </>
                  ) : (
                    <>
                      Sign in
                      <span className="text-base transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </>
                  )}

                </span>

              </button>

            </form>

            {/* ================================================= */}
            {/* SECURITY NOTE */}
            {/* ================================================= */}

            <div className="mt-6 flex items-center gap-3 rounded-[18px] bg-[#f3f8f1] px-4 py-3">

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#dfeeda] text-xs text-[#55704d]">
                ✓
              </div>

              <p className="text-[10px] leading-4 text-[#71806d]">
                Employee access is restricted to
                authorized store staff.
              </p>

            </div>

          </div>

          {/* ================================================= */}
          {/* FOOTER */}
          {/* ================================================= */}

          <div className="mt-6 text-center">

            <div className="mx-auto mb-3 flex items-center justify-center gap-2">

              <span className="h-px w-8 bg-[#eadbdd]" />

              <span className="h-1.5 w-1.5 rounded-full bg-[#d9a1aa]" />

              <span className="h-px w-8 bg-[#eadbdd]" />

            </div>

            <p className="text-[10px] font-semibold tracking-wide text-[#9b8e91]">
              WARD COSMETICS
            </p>

            <p className="mt-1 text-[10px] text-[#b0a5a7]">
              Store Management
            </p>

          </div>

        </div>

      </div>
    </main>
  );
}