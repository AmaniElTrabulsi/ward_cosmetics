"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

async function login() {
  setError("");

  const { data, error } = await supabase
    .from("admins")
    .select("*")
    .eq("email", email)
    .eq("password", password)
    .maybeSingle();

  if (error || !data) {
    setError("❌ Invalid login");
    return;
  }

  // CREATE OR GET DEVICE ID
  let deviceId = localStorage.getItem("device_id");

  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("device_id", deviceId);
  }

  // 🚨 FIRST TIME LOGIN → SAVE DEVICE
  if (!data.device_id) {
    const { error: updateError } = await supabase
      .from("admins")
      .update({ device_id: deviceId })
      .eq("id", data.id);

    if (updateError) {
      setError("❌ Failed to lock device");
      return;
    }
  }

  // 🚫 BLOCK WRONG DEVICE
  if (data.device_id && data.device_id !== deviceId) {
    setError("🚫 This device is not authorized");
    return;
  }

  // LOGIN SUCCESS
  localStorage.setItem("admin", JSON.stringify(data));

  router.push("/owner-dashboard");
}

  return (
    <div style={styles.page}>
      <h1 style={{ color: "black" }}>🔐 Owner Login</h1>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={styles.input}
      />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={styles.input}
      />

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button onClick={login} style={styles.btn}>
        Login
      </button>
    </div>
  );
}

const styles: any = {
  page: {
    padding: 20,
    minHeight: "100vh",
    background: "#f6f7fb",
  },
  input: {
    display: "block",
    width: "100%",
    padding: 12,
    marginTop: 10,
    borderRadius: 10,
    border: "1px solid #ddd",
  },
  btn: {
    marginTop: 15,
    width: "100%",
    padding: 12,
    background: "#111827",
    color: "white",
    borderRadius: 10,
    border: "none",
  },
};