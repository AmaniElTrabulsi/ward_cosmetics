"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function EmployeeNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [employee, setEmployee] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("employee");

    if (stored) {
      try {
        setEmployee(JSON.parse(stored));
      } catch {
        setEmployee(null);
      }
    }
  }, []);

  const links = [
    {
      name: "Home",
      path: "/home",
      icon: "⌂",
    },
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: "▦",
    },
    {
      name: "Register",
      path: "/register",
      icon: "▣",
    },
    {
      name: "Products",
      path: "/products",
      icon: "◫",
    },
    {
      name: "Add Product",
      path: "/add-product",
      icon: "+",
    },
  ];

  function navigate(path: string) {
    setOpen(false);
    router.push(path);
  }

  function logout() {
    localStorage.removeItem("employee");
    router.replace("/employee-login");
  }

  return (
    <>
      {/* =====================================================
          TOP BAR
      ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-[#eadedf] bg-[#fcf9f8]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-6xl items-center justify-between px-4 sm:px-6">

          <div className="flex items-center gap-3">

            {/* MENU BUTTON */}

            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#eadedf] bg-white text-lg text-[#51484a] shadow-sm transition hover:border-[#d9b9bf] hover:bg-[#fff4f5] active:scale-95"
              aria-label="Open menu"
            >
              ☰
            </button>

            {/* BRAND */}

            <button
              type="button"
              onClick={() => navigate("/home")}
              className="flex items-center gap-3"
            >

              {/* CLEAN LOGO MARK */}

              <div className="relative flex h-10 w-10 items-center justify-center rounded-[15px] bg-[#edf4ea] shadow-sm ring-1 ring-[#dce8d8]">

                <div className="absolute h-6 w-6 rounded-full border-[2px] border-[#a45d6b]" />

                <span className="relative z-10 text-[12px] font-black tracking-[-0.08em] text-[#a45d6b]">
                  WC
                </span>

              </div>

              {/* BRAND TEXT */}

              <div className="hidden text-left sm:block">

                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#a45d6b]">
                  Ward Cosmetics
                </p>

                <p className="mt-0.5 text-sm font-bold text-[#292425]">
                  Store Management
                </p>

              </div>

            </button>

          </div>

          {/* EMPLOYEE */}

          <div className="hidden items-center gap-2.5 rounded-full border border-[#e7dfdc] bg-white px-3.5 py-2 sm:flex">

            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#91a88b] opacity-50" />

              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#91a88b]" />
            </span>

            <span className="text-xs font-semibold text-[#665b5d]">
              {employee?.name ||
                employee?.username ||
                "Employee"}
            </span>

          </div>

        </div>
      </header>

      {/* =====================================================
          DARK OVERLAY
      ===================================================== */}

      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[90] bg-[#241e20]/35 backdrop-blur-[3px]"
        />
      )}

      {/* =====================================================
          SIDE MENU
      ===================================================== */}

      <aside
        className={`fixed left-0 top-0 z-[100] flex h-full w-[300px] flex-col border-r border-[#eadedf] bg-[#fffdfc] shadow-[20px_0_60px_rgba(65,45,50,0.12)] transition-transform duration-300 ${
          open
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >

        {/* =================================================
            MENU HEADER
        ================================================= */}

        <div className="border-b border-[#eadedf] p-5">

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-3">

              {/* LOGO */}

              <div className="relative flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#edf4ea] shadow-sm ring-1 ring-[#dce8d8]">

                <div className="absolute h-7 w-7 rounded-full border-[2px] border-[#a45d6b]" />

                <span className="relative z-10 text-[12px] font-black tracking-[-0.08em] text-[#a45d6b]">
                  WC
                </span>

              </div>

              <div>

                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#a45d6b]">
                  Ward Cosmetics
                </p>

                <p className="mt-0.5 text-sm font-bold text-[#292425]">
                  Employee Area
                </p>

              </div>

            </div>

            {/* CLOSE */}

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f7f1f1] text-xl text-[#665b5d] transition hover:bg-[#fff0f2] hover:text-[#a45d6b]"
              aria-label="Close menu"
            >
              ×
            </button>

          </div>

          {/* EMPLOYEE CARD */}

          <div className="mt-5 rounded-[20px] border border-[#dce8d8] bg-[#edf4ea] p-3.5">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-extrabold text-[#a45d6b] shadow-sm">
                {(employee?.name ||
                  employee?.username ||
                  "E")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="min-w-0">

                <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#71806d]">
                  Signed in as
                </p>

                <p className="mt-0.5 truncate text-sm font-bold text-[#3e493c]">
                  {employee?.name ||
                    employee?.username ||
                    "Employee"}
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="flex-1 overflow-y-auto p-4">

          <p className="mb-3 px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#a09698]">
            Navigation
          </p>

          <div className="space-y-1.5">

            {links.map((link) => {

              const active =
                pathname === link.path ||
                pathname.startsWith(
                  `${link.path}/`
                );

              return (
                <button
                  key={link.path}
                  type="button"
                  onClick={() =>
                    navigate(link.path)
                  }
                  className={`group flex w-full items-center gap-3 rounded-[18px] px-3.5 py-3.5 text-left text-sm font-bold transition duration-150 ${
                    active
                      ? "bg-[#a45d6b] text-white shadow-[0_8px_20px_rgba(164,93,107,0.18)]"
                      : "text-[#51484a] hover:bg-[#fff1f3]"
                  }`}
                >

                  {/* ICON */}

                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base font-bold transition ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-[#edf4ea] text-[#71806d] group-hover:bg-[#dfeadc] group-hover:text-[#5f705b]"
                    }`}
                  >
                    {link.icon}
                  </span>

                  <span className="flex-1">
                    {link.name}
                  </span>

                  {/* ACTIVE INDICATOR */}

                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}

                </button>
              );
            })}

          </div>

        </nav>

        {/* =================================================
            BOTTOM
        ================================================= */}

        <div className="border-t border-[#eadedf] p-4">

          <div className="mb-3 rounded-2xl bg-[#fff4f5] px-3.5 py-3">

            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#a45d6b]">
              Ward Cosmetics
            </p>

            <p className="mt-0.5 text-[10px] text-[#8b777b]">
              Store Management System
            </p>

          </div>

          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-[18px] border border-[#eadedf] bg-white px-4 py-3.5 text-sm font-bold text-[#a45d6b] transition hover:border-[#dfc2c7] hover:bg-[#fff0f2] active:scale-[0.99]"
          >
            <span className="text-base">
              ⇥
            </span>

            Sign out
          </button>

        </div>

      </aside>
    </>
  );
}