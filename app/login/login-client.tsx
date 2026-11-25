"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginClient() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Login failed.");
      // Employees always land on the employee home/dashboard, never the product form.
      router.replace(result.user.role === "admin" ? "/admin" : "/app");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="center" style={{ minHeight: "100svh", padding: 16 }}>
      <form className="panel login stack" onSubmit={submit} style={{ width: "min(440px,100%)", padding: "clamp(20px,5vw,34px)" }}>
        <Link href="/" className="brand" style={{ textDecoration: "none" }}>WARD COSMETICS</Link>
        <div><div className="eyebrow">Private staff access</div><h1 className="section-title" style={{ marginTop: 8 }}>Welcome back</h1></div>
        <label className="label">Account type<select className="field" value={role} onChange={(e) => setRole(e.target.value)}><option value="employee">Employee</option><option value="admin">Administrator</option></select></label>
        <label className="label">Username<input className="field" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required /></label>
        <label className="label">Password<input className="field" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {error && <p className="danger small" role="alert">{error}</p>}
        <button className="btn" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <p className="muted small">Ward Cosmetics staff portal</p>
      </form>
    </main>
  );
}
