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
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("employee");

    if (!stored) {
      router.replace("/employee-login");
      return;
    }

    try {
      const employee = JSON.parse(stored);

      if (!employee?.id || !employee?.username) {
        localStorage.removeItem("employee");
        router.replace("/employee-login");
        return;
      }

      setAuthorized(true);
    } catch {
      localStorage.removeItem("employee");
      router.replace("/employee-login");
    } finally {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-xs rounded-[26px] border border-border bg-white p-7 text-center shadow-md">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sage text-xl">
            🛍️
          </div>

          <p className="mt-4 text-sm font-bold text-foreground">
            Loading Ward Cosmetics...
          </p>

          <p className="mt-1 text-xs text-muted">
            Checking your employee access
          </p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}