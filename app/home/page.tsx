"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const [employee, setEmployee] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("employee");

    if (!stored) {
      router.replace("/employee-login");
      return;
    }

    try {
      setEmployee(JSON.parse(stored));
    } catch {
      localStorage.removeItem("employee");
      router.replace("/employee-login");
    }
  }, [router]);

  function signOut() {
    localStorage.removeItem("employee");
    router.replace("/employee-login");
  }

  if (!employee) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8faf7] text-[#53604f]">
        Loading...
      </main>
    );
  }

  const menuItems = [
   {
  icon: "🧴",
  title: "Products",
  description: "Search products or scan a barcode",
  path: "/products",
  iconBackground: "#e3eddf",
},
    {
      icon: "🧾",
      title: "Register",
      description: "Process a customer sale",
      path: "/register",
      background: "#f8e9ed",
    },
    {
      icon: "📊",
      title: "Dashboard",
      description: "View store performance",
      path: "/dashboard",
      background: "#e7efe4",
    },
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#faf9f7] text-[#292d29]">
      {/* BACKGROUND DECORATION */}
      <div className="pointer-events-none fixed -right-32 -top-32 h-80 w-80 rounded-full bg-[#e7d0d6]/40 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-32 -left-32 h-80 w-80 rounded-full bg-[#dbe8d6]/50 blur-3xl" />

      {/* HEADER */}
      <header className="relative z-50 border-b border-[#e7e2df] bg-[#faf9f7]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] w-full max-w-6xl items-center justify-between px-4 sm:h-[76px] sm:px-6 lg:px-8">
          
          {/* BRAND */}
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#dfeada] text-lg shadow-sm sm:h-11 sm:w-11 sm:text-xl">
              🛍️
            </div>

            <div className="min-w-0">
              <p className="truncate text-[10px] font-extrabold tracking-[0.18em] text-[#a45d6b] sm:text-[11px]">
                WARD COSMETICS
              </p>

              <p className="mt-0.5 text-[10px] text-[#8d928c] sm:text-[11px]">
                Store Management
              </p>
            </div>
          </div>

          {/* PROFILE */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 rounded-full border border-[#e5dfdc] bg-white py-1.5 pl-1.5 pr-2.5 shadow-sm transition active:scale-95 sm:gap-2.5 sm:pr-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#52634e] text-xs font-bold text-white sm:h-9 sm:w-9">
                {(employee.username || "E")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <span className="hidden max-w-[120px] truncate text-xs font-bold text-[#4e544e] sm:block">
                {employee.username}
              </span>

              <span className="text-[8px] text-[#9a9e99]">
                {menuOpen ? "▲" : "▼"}
              </span>
            </button>

            {menuOpen && (
              <>
                {/* Mobile backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />

                <div className="absolute right-0 top-[48px] z-50 w-52 overflow-hidden rounded-2xl border border-[#e6dfdd] bg-white p-2 shadow-[0_20px_50px_rgba(60,45,45,0.15)]">
                  <div className="rounded-xl bg-[#f8f5f4] px-3 py-3">
                    <p className="truncate text-sm font-bold text-[#303530]">
                      {employee.username}
                    </p>

                    <p className="mt-0.5 text-[10px] text-[#969b95]">
                      Employee
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={signOut}
                    className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-xs font-bold text-[#a45d6b] transition hover:bg-[#fff1f3]"
                  >
                    <span className="text-base">↪</span>
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 pt-5 sm:px-6 sm:pb-14 sm:pt-8 lg:px-8">

        {/* HERO */}
        <section className="relative overflow-hidden rounded-[26px] bg-[#52634e] shadow-[0_18px_45px_rgba(65,82,61,0.18)] sm:rounded-[32px]">
          
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#a45d6b]/30" />
          <div className="pointer-events-none absolute -bottom-28 -left-16 h-56 w-56 rounded-full bg-[#dce8d7]/20" />

          <div className="relative px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
            
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-[9px] font-bold uppercase tracking-[0.15em] text-[#edf4ea] sm:text-[10px]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#e7b9c2]" />
                Employee Workspace
              </div>

              <h1 className="mt-5 text-[30px] font-extrabold leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-5xl">
                Hello,{" "}
                <span className="text-[#e8bdc5]">
                  {employee.username}
                </span>
                !
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-6 text-[#dbe5d8] sm:text-[15px]">
                Everything you need to manage Ward
                Cosmetics is right here.
              </p>

              <div className="mt-6 flex items-center gap-2 text-[10px] font-semibold text-[#dbe5d8] sm:text-xs">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                  ✓
                </span>
                Ready to manage your store
              </div>
            </div>

            {/* Desktop decoration */}
            <div className="absolute bottom-8 right-8 hidden h-24 w-24 items-center justify-center rounded-[28px] bg-white/10 text-4xl lg:flex">
              ✨
            </div>
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className="mt-8 sm:mt-10">
          <div className="mb-4">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#a45d6b] sm:text-[10px]">
              Workspace
            </p>

            <h2 className="mt-1 text-[23px] font-extrabold tracking-tight text-[#303530] sm:text-2xl">
              Quick Actions
            </h2>

            <p className="mt-1 text-xs text-[#8b9189] sm:text-sm">
              Choose what you want to do
            </p>
          </div>

          {/* MOBILE = 1 COLUMN
              TABLET/DESKTOP = 2 COLUMNS */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {menuItems.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => router.push(item.path)}
                className="group flex min-h-[92px] w-full items-center gap-4 rounded-[22px] border border-[#e8e3e0] bg-white p-4 text-left shadow-[0_5px_22px_rgba(70,55,55,0.045)] transition duration-200 hover:-translate-y-0.5 hover:border-[#d8c7ca] hover:shadow-[0_12px_30px_rgba(70,55,55,0.09)] active:scale-[0.98] sm:min-h-[105px] sm:rounded-[25px] sm:p-5"
              >
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] text-2xl sm:h-16 sm:w-16 sm:rounded-[20px] sm:text-[26px]"
                  style={{
                    background: item.background,
                  }}
                >
                  {item.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-extrabold text-[#303530] sm:text-[15px]">
                    {item.title}
                  </h3>

                  <p className="mt-1 text-[11px] leading-5 text-[#858b84] sm:text-xs">
                    {item.description}
                  </p>
                </div>

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f4f6f2] text-[#73806f] transition group-hover:bg-[#f5e5e8] group-hover:text-[#a45d6b]">
                  →
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* STORE TIP */}
        <section className="mt-7 rounded-[22px] border border-[#e3e9df] bg-[#eaf1e7] p-4 sm:mt-8 sm:rounded-[26px] sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-white text-lg shadow-sm">
              💡
            </div>

            <div className="min-w-0">
              <h3 className="text-xs font-extrabold text-[#4f5e4b] sm:text-sm">
                Keep your store moving
              </h3>

              <p className="mt-1 text-[11px] leading-5 text-[#71806c] sm:text-xs sm:leading-5">
                Search products, scan barcodes,
                process sales, and monitor your
                store performance from one place.
              </p>
            </div>
          </div>
        </section>

        {/* MINI FEATURES */}
        <section className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-[18px] border border-[#e9e4e1] bg-white p-3 text-center sm:rounded-[20px] sm:p-4">
            <div className="text-lg sm:text-xl">🔎</div>
            <p className="mt-2 text-[9px] font-bold text-[#646b63] sm:text-[10px]">
              Search
            </p>
          </div>

          <div className="rounded-[18px] border border-[#e9e4e1] bg-white p-3 text-center sm:rounded-[20px] sm:p-4">
            <div className="text-lg sm:text-xl">📦</div>
            <p className="mt-2 text-[9px] font-bold text-[#646b63] sm:text-[10px]">
              Inventory
            </p>
          </div>

          <div className="rounded-[18px] border border-[#e9e4e1] bg-white p-3 text-center sm:rounded-[20px] sm:p-4">
            <div className="text-lg sm:text-xl">💳</div>
            <p className="mt-2 text-[9px] font-bold text-[#646b63] sm:text-[10px]">
              Sales
            </p>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="pb-2 pt-8 text-center">
          <p className="text-[10px] font-bold text-[#8e938d] sm:text-[11px]">
            Ward Cosmetics
          </p>

          <p className="mt-1 text-[9px] text-[#b0b3ae]">
            Store Management System
          </p>
        </footer>
      </div>
    </main>
  );
}