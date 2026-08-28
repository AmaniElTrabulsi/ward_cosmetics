"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EmployeeLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      // TEMPORARY LOGIN
      // We will connect this to your existing employee login
      // in the next steps.

      if (!username || !password) {
        setError("Please enter your username and password.");
        return;
      }

      // This is only temporary so we can build the navigation first.
      localStorage.setItem(
        "employee",
        JSON.stringify({
          username,
        })
      );

      router.push("/home");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#faf9f7] px-5 py-10 text-[#171717]">
      <div className="mx-auto flex min-h-[90vh] max-w-md items-center justify-center">
        <div className="w-full">
          {/* Logo */}
          <div className="mb-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white">
              <svg
                width="25"
                height="25"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 20c.8-3.5 3.2-5.5 7-5.5s6.2 2 7 5.5" />
              </svg>
            </div>

            <h1 className="mt-4 text-2xl font-bold">
              Ward Cosmetics
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Employee Login
            </p>
          </div>

          {/* Login card */}
          <div className="rounded-[28px] border border-black/5 bg-white p-7 shadow-sm sm:p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-bold">
                Welcome back
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Sign in to access the store management system.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Username */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Username
                </label>

                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none transition focus:border-black focus:bg-white"
                />
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none transition focus:border-black focus:bg-white"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Login */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-black px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>

          {/* Back */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => router.push("/app")}
              className="text-sm text-gray-500 transition hover:text-black"
            >
              ← Back to Ward Cosmetics
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}