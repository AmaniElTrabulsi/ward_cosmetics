"use client";

import Link from "next/link";

function EmployeeIcon() {
  return (
    <svg
      width="28"
      height="28"
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
  );
}

function ShoppingIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 8H6" />
      <circle cx="10" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function LogoIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21 8-9 5-9-5" />
      <path d="m3 8 9-5 9 5v9l-9 5-9-5V8Z" />
      <path d="M12 13v9" />
    </svg>
  );
}

export default function AppPage() {
  return (
    <main className="relative min-h-[100svh] overflow-x-hidden bg-[#faf8f7] text-[#292425]">

      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-[#f2dce1]/50 blur-3xl sm:-left-32 sm:-top-32 sm:h-72 sm:w-72" />

      <div className="pointer-events-none absolute -bottom-24 -right-24 h-60 w-60 rounded-full bg-[#dfead9]/55 blur-3xl sm:-bottom-40 sm:-right-32 sm:h-80 sm:w-80" />

      <div className="pointer-events-none absolute left-1/2 top-[42%] h-32 w-32 -translate-x-1/2 rounded-full bg-white/70 blur-3xl sm:h-40 sm:w-40" />

      {/* =====================================================
          PAGE CONTAINER
      ===================================================== */}

      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col px-4 py-7 sm:px-8 sm:py-10 lg:py-12">

        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="flex justify-center">

          <div className="text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] border border-[#ead9dc] bg-white text-[#9b5c69] shadow-[0_8px_25px_rgba(100,70,75,0.08)] sm:h-16 sm:w-16 sm:rounded-[22px]">
              <LogoIcon />
            </div>

            <p className="mt-4 text-[9px] font-extrabold uppercase tracking-[0.23em] text-[#9b5c69] sm:mt-5 sm:text-[10px]">
              Ward Cosmetics
            </p>

            <h1 className="mt-1 text-lg font-extrabold tracking-tight text-[#292425] sm:text-2xl">
              Welcome
            </h1>

          </div>

        </header>

        {/* ===================================================
            MAIN
        =================================================== */}

        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center py-9 sm:py-14">

          {/* =================================================
              INTRO
          ================================================= */}

          <div className="mb-7 text-center sm:mb-10">

            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#e7dedb] bg-white/85 px-3 py-1.5 shadow-sm backdrop-blur-sm sm:px-3.5 sm:py-2">

              <span className="h-1.5 w-1.5 rounded-full bg-[#9b5c69] sm:h-2 sm:w-2" />

              <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#756a6c] sm:text-[10px] sm:tracking-[0.18em]">
                Store Portal
              </span>

            </div>

            <h2 className="mt-4 text-[28px] font-extrabold leading-[1.12] tracking-tight text-[#292425] sm:mt-5 sm:text-4xl lg:text-5xl">
              How would you like
              <br />
              to continue?
            </h2>

            <p className="mx-auto mt-3 max-w-[330px] text-[13px] leading-5 text-[#776d6f] sm:mt-4 sm:max-w-xl sm:text-base sm:leading-6">
              Choose how you'd like to access Ward Cosmetics.
              Employees can manage the store, while customers
              can browse and shop.
            </p>

          </div>

          {/* =================================================
              OPTIONS
          ================================================= */}

          <div className="grid w-full gap-4 sm:gap-5 md:grid-cols-2">

            {/* =================================================
                EMPLOYEE
            ================================================= */}

            <Link
              href="/employee-login"
              className="group relative min-h-[255px] overflow-hidden rounded-[26px] border border-[#e4d2d6] bg-[#f5e5e8] p-5 shadow-[0_10px_30px_rgba(120,75,85,0.08)] transition duration-300 hover:-translate-y-1 hover:border-[#d8b9c0] hover:shadow-[0_18px_40px_rgba(120,75,85,0.14)] active:scale-[0.985] sm:min-h-[300px] sm:rounded-[30px] sm:p-8"
            >

              {/* Decorative shapes */}

              <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-white/35 transition duration-500 group-hover:scale-110 sm:h-40 sm:w-40" />

              <div className="pointer-events-none absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-[#e9ccd2]/50" />

              <div className="relative flex h-full flex-col">

                <div className="flex items-start justify-between">

                  <div className="flex h-12 w-12 items-center justify-center rounded-[17px] bg-white text-[#9b5c69] shadow-sm sm:h-14 sm:w-14 sm:rounded-2xl">
                    <EmployeeIcon />
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/75 text-[#9b5c69] transition duration-300 group-hover:translate-x-1 group-hover:bg-white sm:h-10 sm:w-10">
                    <ArrowIcon />
                  </div>

                </div>

                <div className="mt-auto pt-7 sm:pt-9">

                  <div className="inline-flex rounded-full bg-white/65 px-2.5 py-1 sm:px-3">
                    <span className="text-[8px] font-extrabold uppercase tracking-[0.14em] text-[#9b5c69] sm:text-[9px] sm:tracking-[0.15em]">
                      Staff access
                    </span>
                  </div>

                  <h3 className="mt-2.5 text-xl font-extrabold tracking-tight text-[#754853] sm:mt-3 sm:text-2xl">
                    Employee
                  </h3>

                  <p className="mt-1.5 max-w-sm text-[12px] leading-5 text-[#765f64] sm:mt-2 sm:text-sm sm:leading-6">
                    Manage products, sales, inventory,
                    barcode scanning and your store dashboard.
                  </p>

                  <div className="mt-5 flex min-h-[24px] items-center gap-2 text-xs font-extrabold text-[#9b5c69] sm:mt-7 sm:text-sm">
                    Employee Login
                    <span className="transition group-hover:translate-x-1">
                      →
                    </span>
                  </div>

                </div>

              </div>

            </Link>

            {/* =================================================
                SHOPPING
            ================================================= */}

            <Link
              href="/shop"
              className="group relative min-h-[255px] overflow-hidden rounded-[26px] border border-[#d9e4d5] bg-[#eaf2e7] p-5 shadow-[0_10px_30px_rgba(70,95,70,0.07)] transition duration-300 hover:-translate-y-1 hover:border-[#c7d8c2] hover:shadow-[0_18px_40px_rgba(70,95,70,0.12)] active:scale-[0.985] sm:min-h-[300px] sm:rounded-[30px] sm:p-8"
            >

              {/* Decorative shapes */}

              <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-white/40 transition duration-500 group-hover:scale-110 sm:h-40 sm:w-40" />

              <div className="pointer-events-none absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-[#d8e7d3]/60" />

              <div className="relative flex h-full flex-col">

                <div className="flex items-start justify-between">

                  <div className="flex h-12 w-12 items-center justify-center rounded-[17px] bg-white text-[#687e62] shadow-sm sm:h-14 sm:w-14 sm:rounded-2xl">
                    <ShoppingIcon />
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/75 text-[#687e62] transition duration-300 group-hover:translate-x-1 group-hover:bg-white sm:h-10 sm:w-10">
                    <ArrowIcon />
                  </div>

                </div>

                <div className="mt-auto pt-7 sm:pt-9">

                  <div className="inline-flex rounded-full bg-white/65 px-2.5 py-1 sm:px-3">
                    <span className="text-[8px] font-extrabold uppercase tracking-[0.14em] text-[#687e62] sm:text-[9px] sm:tracking-[0.15em]">
                      Customer access
                    </span>
                  </div>

                  <h3 className="mt-2.5 text-xl font-extrabold tracking-tight text-[#52644d] sm:mt-3 sm:text-2xl">
                    Shopping
                  </h3>

                  <p className="mt-1.5 max-w-sm text-[12px] leading-5 text-[#63705f] sm:mt-2 sm:text-sm sm:leading-6">
                    Browse Ward Cosmetics products and
                    discover what is available to shop.
                  </p>

                  <div className="mt-5 flex min-h-[24px] items-center gap-2 text-xs font-extrabold text-[#687e62] sm:mt-7 sm:text-sm">
                    Start Shopping
                    <span className="transition group-hover:translate-x-1">
                      →
                    </span>
                  </div>

                </div>

              </div>

            </Link>

          </div>

          {/* =================================================
              INFO
          ================================================= */}

          <div className="mt-6 flex flex-col items-center justify-center gap-2.5 text-center sm:mt-7 sm:flex-row sm:gap-6">

            <div className="flex items-center gap-2 text-[10px] font-semibold text-[#8b8082] sm:text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9b5c69]" />
              Secure employee access
            </div>

            <div className="hidden h-1 w-1 rounded-full bg-[#d1c8c9] sm:block" />

            <div className="flex items-center gap-2 text-[10px] font-semibold text-[#8b8082] sm:text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#82987c]" />
              Easy shopping
            </div>

          </div>

        </div>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <footer className="pt-5 text-center sm:pt-6">

          <p className="text-[9px] font-extrabold uppercase tracking-[0.17em] text-[#9d9395] sm:text-[10px]">
            Ward Cosmetics
          </p>

          <p className="mt-1 text-[9px] text-[#b0a7a9] sm:text-[10px]">
            Store Management & Shopping
          </p>

        </footer>

      </div>
    </main>
  );
}