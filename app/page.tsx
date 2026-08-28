"use client";

import Link from "next/link";

function EmployeeIcon() {
  return (
    <svg
      width="32"
      height="32"
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
      width="32"
      height="32"
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
      width="19"
      height="19"
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
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
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
    <main className="min-h-screen bg-[#faf9f7] text-[#171717]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-10 sm:px-8 sm:py-14">

        {/* Header */}
        <header className="flex justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white shadow-sm">
              <LogoIcon />
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight">
              Ward Cosmetics
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Welcome
            </p>
          </div>
        </header>

        {/* Main */}
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-12">

          {/* Intro */}
          <div className="mb-10 text-center">
            <p className="text-sm font-medium tracking-wide text-gray-400">
              GET STARTED
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              How would you like to continue?
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-gray-500">
              Choose whether you are a Ward Cosmetics employee or a customer.
            </p>
          </div>

          {/* Options */}
          <div className="grid gap-5 sm:grid-cols-2">

            {/* Employee */}
            <a
              href="/employee-login"
              className="group rounded-[28px] border border-black/5 bg-white p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] sm:p-8"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-white">
                  <EmployeeIcon />
                </div>

                <div className="text-gray-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-black">
                  <ArrowIcon />
                </div>
              </div>

              <h3 className="mt-7 text-xl font-bold">
                Employee
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Manage products, sales, inventory, scanning, and the store
                dashboard.
              </p>

              <div className="mt-7 text-sm font-semibold">
                Employee Login →
              </div>
            </a>

            {/* Shopping */}
            <Link
              href="/shop"
              className="group rounded-[28px] border border-black/5 bg-white p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] sm:p-8"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f0eeeb] text-black">
                  <ShoppingIcon />
                </div>

                <div className="text-gray-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-black">
                  <ArrowIcon />
                </div>
              </div>

              <h3 className="mt-7 text-xl font-bold">
                Shopping
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Browse products and shop from Ward Cosmetics.
              </p>

              <div className="mt-7 text-sm font-semibold">
                Start Shopping →
              </div>
            </Link>

          </div>
        </div>

        {/* Footer */}
        <footer className="pt-8 text-center text-xs text-gray-400">
          Ward Cosmetics
        </footer>

      </div>
    </main>
  );
}