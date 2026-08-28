"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [employee, setEmployee] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("employee");

    if (!stored) {
      router.replace("/employee-login");
      return;
    }

    try {
      setEmployee(JSON.parse(stored));
      setChecking(false);
    } catch {
      localStorage.removeItem("employee");
      router.replace("/employee-login");
    }
  }, [router]);

  function navigate(path: string) {
    setOpen(false);
    router.push(path);
  }

  function logout() {
    localStorage.removeItem("employee");
    router.replace("/employee-login");
  }

  /* ===========================================================
     EMPLOYEE MENU
  =========================================================== */

  const menuItems = [
    {
      icon: "⌂",
      label: "Home",
      description: "Store overview",
      path: "/home",
    },
    {
      icon: "▤",
      label: "Orders",
      description: "Customer orders",
      path: "/orders",
    },
    {
      icon: "▣",
      label: "Register",
      description: "Process a sale",
      path: "/register",
    },
    {
      icon: "□",
      label: "Products",
      description: "Manage inventory",
      path: "/products",
    },
    {
      icon: "+",
      label: "Add Product",
      description: "Add new inventory",
      path: "/add-product",
    },
    {
      icon: "▥",
      label: "Dashboard",
      description: "Sales & stock",
      path: "/dashboard",
    },
  ];

  function getPageName() {
    if (pathname === "/home") {
      return "Store";
    }

    const lastPart = pathname
      .split("/")
      .filter(Boolean)
      .pop();

    if (!lastPart) {
      return "Store";
    }

    return lastPart
      .replace(/-/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  /* ===========================================================
     LOADING
  =========================================================== */

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6">
        <div className="text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-[var(--green)] to-[var(--rose)] text-2xl shadow-sm">
            🛍️
          </div>

          <p className="mt-5 text-sm font-bold text-[var(--text)]">
            Loading Ward Cosmetics
          </p>

          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Preparing your workspace...
          </p>

          <div className="mx-auto mt-5 h-1.5 w-24 overflow-hidden rounded-full bg-[var(--green-light)]">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-[var(--rose-dark)]" />
          </div>

        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)]">

      {/* =====================================================
          TOP HEADER
      ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-2xl">

        <div className="mx-auto flex min-h-[76px] max-w-[1200px] items-center justify-between px-4 sm:px-6">

          {/* LEFT */}

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open navigation menu"
              className="group flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-white shadow-[0_4px_16px_rgba(80,95,85,0.06)] transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--green-light)]"
            >
              <span className="text-xl leading-none text-[var(--green-dark)] transition group-hover:scale-105">
                ☰
              </span>
            </button>

            <div className="flex items-center gap-3">

              <div className="hidden h-10 w-10 items-center justify-center rounded-[14px] bg-gradient-to-br from-[var(--green)] to-[var(--rose)] text-lg shadow-sm sm:flex">
                🛍️
              </div>

              <div>

                <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[var(--rose-dark)]">
                  Ward Cosmetics
                </p>

                <p className="mt-0.5 text-sm font-extrabold text-[var(--text)]">
                  {getPageName()}
                </p>

              </div>

            </div>

          </div>

          {/* RIGHT */}

          {employee?.name && (
            <div className="flex items-center gap-3">

              <div className="hidden text-right sm:block">

                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Employee
                </p>

                <p className="text-xs font-extrabold text-[var(--text)]">
                  {employee.name}
                </p>

              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--rose)] text-sm font-extrabold text-[var(--rose-dark)] shadow-sm">
                {employee.name.charAt(0).toUpperCase()}
              </div>

            </div>
          )}

        </div>

      </header>

      {/* =====================================================
          SIDE MENU
      ===================================================== */}

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-[#29302b]/25 backdrop-blur-[3px]"
          onClick={() => setOpen(false)}
        >

          <aside
            className="flex h-full w-[310px] flex-col border-r border-[var(--border)] bg-[var(--background)] p-5 shadow-[15px_0_50px_rgba(60,70,62,0.12)] sm:w-[340px] sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >

            {/* =================================================
                MENU BRAND
            ================================================= */}

            <div className="mb-7 flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-[17px] bg-gradient-to-br from-[var(--green)] to-[var(--rose)] text-xl shadow-sm">
                  🛍️
                </div>

                <div>

                  <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[var(--rose-dark)]">
                    Ward Cosmetics
                  </p>

                  <p className="mt-0.5 text-lg font-extrabold text-[var(--text)]">
                    Store Menu
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl text-[var(--green-dark)] shadow-sm transition hover:bg-[var(--rose-light)] hover:text-[var(--rose-dark)]"
              >
                ×
              </button>

            </div>

            {/* =================================================
                EMPLOYEE CARD
            ================================================= */}

            {employee?.name && (
              <div className="mb-6 overflow-hidden rounded-[24px] border border-[var(--border)] bg-white shadow-[0_8px_25px_rgba(70,85,74,0.05)]">

                <div className="h-1.5 bg-gradient-to-r from-[var(--green)] via-[var(--rose)] to-[var(--green)]" />

                <div className="flex items-center gap-3 p-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--rose)] text-sm font-extrabold text-[var(--rose-dark)]">
                    {employee.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">

                    <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                      Signed in as
                    </p>

                    <p className="truncate text-sm font-extrabold text-[var(--text)]">
                      {employee.name}
                    </p>

                    {employee.username && (
                      <p className="mt-0.5 truncate text-[11px] text-[var(--text-muted)]">
                        @{employee.username}
                      </p>
                    )}

                  </div>

                </div>

              </div>
            )}

            {/* =================================================
                NAVIGATION
            ================================================= */}

            <div className="mb-3 px-1">

              <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Navigation
              </p>

            </div>

            <nav className="space-y-2">

              {menuItems.map((item) => {

                const active = pathname === item.path;

                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => navigate(item.path)}
                    className={`group flex w-full items-center gap-3 rounded-[20px] p-3 text-left transition duration-200 ${
                      active
                        ? "bg-[var(--rose-light)] shadow-[0_5px_18px_rgba(155,102,112,0.08)]"
                        : "hover:bg-white"
                    }`}
                  >

                    {/* ICON */}

                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] text-lg font-bold transition ${
                        active
                          ? "bg-[var(--rose)] text-[var(--rose-dark)]"
                          : "bg-[var(--green-light)] text-[var(--green-dark)] group-hover:bg-[var(--green)]"
                      }`}
                    >
                      {item.icon}
                    </span>

                    {/* TEXT */}

                    <span className="min-w-0 flex-1">

                      <span
                        className={`block text-sm font-extrabold ${
                          active
                            ? "text-[var(--rose-dark)]"
                            : "text-[var(--text)]"
                        }`}
                      >
                        {item.label}
                      </span>

                      <span className="mt-0.5 block text-[10px] text-[var(--text-muted)]">
                        {item.description}
                      </span>

                    </span>

                    {/* ACTIVE ARROW */}

                    <span
                      className={`text-lg transition ${
                        active
                          ? "translate-x-0 text-[var(--rose-dark)]"
                          : "-translate-x-1 text-transparent group-hover:translate-x-0 group-hover:text-[var(--green-dark)]"
                      }`}
                    >
                      →
                    </span>

                  </button>
                );

              })}

            </nav>

            {/* =================================================
                QUICK INFO
            ================================================= */}

            <div className="mt-6 rounded-[22px] border border-[var(--border)] bg-gradient-to-br from-[var(--green-light)] to-[var(--rose-light)] p-4">

              <div className="flex items-center gap-2">

                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-sm shadow-sm">
                  ✨
                </span>

                <p className="text-xs font-extrabold text-[var(--text)]">
                  Ward Cosmetics
                </p>

              </div>

              <p className="mt-2 text-[10px] leading-5 text-[var(--text-muted)]">
                Manage products, process sales, prepare
                customer orders and keep your store organized.
              </p>

            </div>

            {/* =================================================
                SIGN OUT
            ================================================= */}

            <div className="mt-auto pt-6">

              <button
                type="button"
                onClick={logout}
                className="group flex w-full items-center justify-center gap-2 rounded-[18px] border border-[var(--rose-border)] bg-white px-4 py-3.5 text-xs font-extrabold text-[var(--rose-dark)] shadow-sm transition hover:bg-[var(--rose-light)]"
              >

                <span className="transition group-hover:-translate-x-0.5">
                  ↪
                </span>

                Sign out

              </button>

            </div>

          </aside>

        </div>
      )}

      {/* =====================================================
          PAGE CONTENT
      ===================================================== */}

      <main className="relative">
        {children}
      </main>

    </div>
  );
}