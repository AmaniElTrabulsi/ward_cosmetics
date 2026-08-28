"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EmployeeGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const employee = localStorage.getItem("employee");

    if (!employee) {
      router.replace("/employee-login");
      return;
    }

    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f7fb",
          color: "#111827",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            background: "white",
            padding: 30,
            borderRadius: 20,
            boxShadow: "0 10px 35px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 10 }}>🛍️</div>
          <p style={{ margin: 0, fontWeight: 600 }}>
            Loading Ward Cosmetics...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}