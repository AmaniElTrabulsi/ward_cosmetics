"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Employee = {
  id: string | number;
  name: string | null;
  username: string;
};

type Notice = { type: "success" | "error"; text: string } | null;

function generatePassword(length = 10): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export default function EmployeesPage() {
  const [authorized, setAuthorized] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setListError("");

    // Passwords are deliberately NOT selected here.
    const { data, error } = await supabase
      .from("employees")
      .select("id, name, username")
      .order("name", { ascending: true });

    if (error) {
      console.error("EMPLOYEES LOAD ERROR:", error);
      setListError("Could not load employees. Check your database permissions.");
    } else {
      setEmployees((data || []) as Employee[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const admin = localStorage.getItem("admin");

    if (!admin) {
      window.location.href = "/admin-login?next=/owner-dashboard/employees";
      return;
    }

    setAuthorized(true);
    loadEmployees();
  }, [loadEmployees]);

  async function createEmployee(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (saving) return;

    setNotice(null);

    const cleanName = name.trim();
    const cleanUsername = username.trim();

    if (cleanName.length < 2) {
      setNotice({ type: "error", text: "Please enter the employee's name." });
      return;
    }

    if (!/^[A-Za-z0-9._-]{3,32}$/.test(cleanUsername)) {
      setNotice({
        type: "error",
        text: "Username must be 3–32 characters: letters, numbers, dots, dashes or underscores.",
      });
      return;
    }

    if (password.length < 8) {
      setNotice({
        type: "error",
        text: "Password must be at least 8 characters.",
      });
      return;
    }

    setSaving(true);

    try {
      const { data: existing, error: lookupError } = await supabase
        .from("employees")
        .select("id")
        .eq("username", cleanUsername)
        .maybeSingle();

      if (lookupError) {
        console.error("EMPLOYEE LOOKUP ERROR:", lookupError);
        setNotice({
          type: "error",
          text: "Could not check whether this username is free. Please try again.",
        });
        return;
      }

      if (existing) {
        setNotice({
          type: "error",
          text: "That username is already taken. Choose another one.",
        });
        return;
      }

      const { data, error } = await supabase
        .from("employees")
        .insert({
          name: cleanName,
          username: cleanUsername,
          password,
        })
        .select("id, name, username")
        .single();

      if (error || !data) {
        console.error("EMPLOYEE CREATE ERROR:", error);
        setNotice({
          type: "error",
          text:
            error?.code === "23505"
              ? "That username is already taken. Choose another one."
              : "Could not create the account. Check your database permissions.",
        });
        return;
      }

      setEmployees((previous) =>
        [...previous, data as Employee].sort((a, b) =>
          (a.name || a.username).localeCompare(b.name || b.username)
        )
      );

      setNotice({
        type: "success",
        text: `Account created. ${cleanName} can now sign in with username "${cleanUsername}".`,
      });

      setName("");
      setUsername("");
      setPassword("");
      setShowPassword(false);
    } catch (error) {
      console.error("EMPLOYEE CREATE ERROR:", error);
      setNotice({
        type: "error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function deleteEmployee(employee: Employee) {
    const label = employee.name || employee.username;

    if (!window.confirm(`Delete the account for ${label}? They will no longer be able to sign in.`)) {
      return;
    }

    setDeletingId(employee.id);
    setNotice(null);

    const { data, error } = await supabase
      .from("employees")
      .delete()
      .eq("id", employee.id)
      .select("id");

    setDeletingId(null);

    if (error || !data || data.length === 0) {
      console.error("EMPLOYEE DELETE ERROR:", error);
      setNotice({
        type: "error",
        text: `Could not delete ${label}. Check your database permissions.`,
      });
      return;
    }

    setEmployees((previous) => previous.filter((item) => item.id !== employee.id));
    setNotice({ type: "success", text: `${label}'s account was deleted.` });
  }

  if (!authorized) {
    return (
      <main className="app-page">
        <div className="app-container max-w-3xl">
          <p className="py-20 text-center text-sm font-bold text-[var(--text-muted)]">
            Checking owner access...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-page">
      <div className="app-container max-w-3xl">
        {/* HEADER */}

        <section className="mb-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#f4e1e5] px-3.5 py-1.5">
                <span className="h-2 w-2 rounded-full bg-[#a45d6b]" />
                <span className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#8f4e5d]">
                  Owner Area
                </span>
              </div>

              <h1 className="app-title">Employees</h1>

              <p className="app-subtitle">
                Create sign-in accounts for your store staff.
              </p>
            </div>

            <Link
              href="/owner-dashboard"
              className="app-button app-button-light w-fit"
            >
              ← Back to dashboard
            </Link>
          </div>
        </section>

        {/* CREATE FORM */}

        <section className="app-card p-5 sm:p-6">
          <div className="mb-5">
            <p className="app-eyebrow">New account</p>
            <h2 className="mt-1 text-lg font-extrabold text-[var(--foreground)]">
              Create employee account
            </h2>
          </div>

          <form onSubmit={createEmployee} className="space-y-4" noValidate>
            <div>
              <label htmlFor="emp-name" className="app-label">
                Full name
              </label>
              <input
                id="emp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sara Khalil"
                autoComplete="off"
                disabled={saving}
                className="app-input"
              />
            </div>

            <div>
              <label htmlFor="emp-username" className="app-label">
                Username
              </label>
              <input
                id="emp-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. sara"
                autoComplete="off"
                autoCapitalize="none"
                disabled={saving}
                className="app-input"
              />
              <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                Employees type this on the staff login page.
              </p>
            </div>

            <div>
              <label htmlFor="emp-password" className="app-label">
                Password (at least 8 characters)
              </label>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="emp-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={saving}
                  className="app-input flex-1"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="app-button app-button-light"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPassword(generatePassword());
                    setShowPassword(true);
                  }}
                  className="app-button app-button-green"
                >
                  Generate
                </button>
              </div>
            </div>

            {notice && (
              <div
                role={notice.type === "error" ? "alert" : "status"}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                  notice.type === "error"
                    ? "border-[var(--error-border)] bg-[var(--error-bg)] text-[var(--error-text)]"
                    : "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]"
                }`}
              >
                {notice.text}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="app-button app-button-rose w-full sm:w-auto"
            >
              {saving ? "Creating..." : "Create account"}
            </button>
          </form>
        </section>

        {/* EMPLOYEE LIST */}

        <section className="app-list mt-6">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--green-light)] px-5 py-5">
            <div>
              <p className="app-eyebrow">Team</p>
              <h2 className="mt-1 text-xl font-extrabold text-[var(--foreground)]">
                Current employees
              </h2>
            </div>

            <span className="app-badge app-badge-green">
              {employees.length}
            </span>
          </div>

          {loading ? (
            <p className="px-5 py-10 text-center text-sm font-bold text-[var(--text-muted)]">
              Loading employees...
            </p>
          ) : listError ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm font-semibold text-[var(--error-text)]">
                {listError}
              </p>
              <button
                type="button"
                onClick={loadEmployees}
                className="app-button app-button-light mt-4"
              >
                Try again
              </button>
            </div>
          ) : employees.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-[var(--text-muted)]">
              No employee accounts yet. Create the first one above.
            </p>
          ) : (
            <ul>
              {employees.map((employee) => (
                <li
                  key={employee.id}
                  className="flex items-center justify-between gap-3 border-b border-[#edf0ed] px-5 py-4 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-[var(--foreground)]">
                      {employee.name || employee.username}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                      @{employee.username}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteEmployee(employee)}
                    disabled={deletingId === employee.id}
                    className="rounded-xl bg-[var(--rose-light)] px-3 py-2 text-xs font-extrabold text-[var(--rose-dark)] transition hover:bg-[var(--rose)] disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Delete ${employee.name || employee.username}`}
                  >
                    {deletingId === employee.id ? "Deleting..." : "Delete"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
