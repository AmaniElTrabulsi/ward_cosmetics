"use client";

import { useEffect, useRef, useState } from "react";
import EmployeeGuard from "@/components/EmployeeGuard";
import { supabase } from "@/lib/supabase";

type CartItem = {
  id: string;
  name: string;
  brand: string | null;
  price: number;
  stock_quantity: number;
  qty: number;
};

export default function RegisterPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcode, setBarcode] = useState("");

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [scannerError, setScannerError] = useState("");

  const [processing, setProcessing] = useState(false);

  const scannerRef = useRef<any>(null);

  /* =========================================================
     ADD PRODUCT BY BARCODE
  ========================================================= */

  async function addByBarcode(code: string) {
    const cleanCode = code.trim();

    if (!cleanCode) {
      return;
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("barcode", cleanCode)
      .maybeSingle();

    if (error) {
      console.error("Product lookup error:", error);
      alert("Could not search for this product.");
      return;
    }

    if (!data) {
      alert(`Product not found: ${cleanCode}`);
      return;
    }

    const stock = Number(data.stock_quantity || 0);

    if (stock <= 0) {
      alert("This product is out of stock.");
      return;
    }

    setCart((previous) => {
      const existing = previous.find(
        (item) => item.id === data.id
      );

      if (existing) {
        if (existing.qty >= stock) {
          alert("Not enough stock.");
          return previous;
        }

        return previous.map((item) =>
          item.id === data.id
            ? {
                ...item,
                qty: item.qty + 1,
              }
            : item
        );
      }

      return [
        ...previous,
        {
          id: data.id,
          name: data.name,
          brand: data.brand,
          price: Number(data.price || 0),
          stock_quantity: stock,
          qty: 1,
        },
      ];
    });

    setBarcode("");

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(80);
    }
  }

  /* =========================================================
     BARCODE SCANNER
  ========================================================= */

  async function startScanner() {
    setScannerError("");
    setScannerLoading(true);
    setScannerOpen(true);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      await new Promise((resolve) =>
        setTimeout(resolve, 250)
      );

      const scanner = new Html5Qrcode("register-scanner");

      scannerRef.current = scanner;

      await scanner.start(
        {
          facingMode: "environment",
        },
        {
          fps: 10,
          qrbox: {
            width: 280,
            height: 140,
          },
          aspectRatio: 1.7777778,
        },
        async (decodedText: string) => {
          await stopScanner();
          await addByBarcode(decodedText);
        },
        () => {
          // Normal scanning failures are ignored.
        }
      );

      setScannerLoading(false);
    } catch (error) {
      console.error("Scanner error:", error);

      setScannerLoading(false);

      setScannerError(
        "The camera could not be opened. Please allow camera access and make sure you are using HTTPS or localhost."
      );
    }
  }

  async function stopScanner() {
    try {
      if (scannerRef.current) {
        const scanner = scannerRef.current;

        if (scanner.isScanning) {
          await scanner.stop();
        }

        await scanner.clear();
      }
    } catch (error) {
      console.error("Scanner cleanup error:", error);
    }

    scannerRef.current = null;
    setScannerOpen(false);
    setScannerLoading(false);
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop();
          }

          scannerRef.current.clear();
        } catch {}
      }
    };
  }, []);

  /* =========================================================
     CART
  ========================================================= */

  function changeQty(id: string, amount: number) {
    setCart((previous) =>
      previous.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const newQty = item.qty + amount;

        if (newQty < 1) {
          return item;
        }

        if (newQty > item.stock_quantity) {
          alert("Not enough stock.");
          return item;
        }

        return {
          ...item,
          qty: newQty,
        };
      })
    );
  }

  function removeItem(id: string) {
    setCart((previous) =>
      previous.filter((item) => item.id !== id)
    );
  }

  const total = cart.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * item.qty,
    0
  );

  const units = cart.reduce(
    (sum, item) => sum + item.qty,
    0
  );

  /* =========================================================
     CHECKOUT
  ========================================================= */

  async function checkout() {
    if (!cart.length) {
      return;
    }

    for (const item of cart) {
      if (item.qty > item.stock_quantity) {
        alert(`Not enough stock for ${item.name}.`);
        return;
      }
    }

    setProcessing(true);

    try {
      /* -------------------------------------------------------
         CREATE SALE
      ------------------------------------------------------- */

      const {
        data: sale,
        error: saleError,
      } = await supabase
        .from("sales")
        .insert({
          total,
        })
        .select()
        .single();

      if (saleError || !sale) {
        console.error("Sale error:", saleError);
        alert("Failed to create sale.");
        return;
      }

      /* -------------------------------------------------------
         CREATE SALE ITEMS
      ------------------------------------------------------- */

      const saleItems = cart.map((item) => ({
        sale_id: sale.id,
        product_id: item.id,
        quantity: item.qty,
        price: item.price,
      }));

      const {
        error: itemsError,
      } = await supabase
        .from("sale_items")
        .insert(saleItems);

      if (itemsError) {
        console.error("Sale items error:", itemsError);
        alert("Failed to create sale items.");
        return;
      }

      /* -------------------------------------------------------
         UPDATE STOCK
      ------------------------------------------------------- */

      for (const item of cart) {
        const newStock =
          item.stock_quantity - item.qty;

        const { error: stockError } =
          await supabase
            .from("products")
            .update({
              stock_quantity: newStock,
            })
            .eq("id", item.id);

        if (stockError) {
          console.error(
            "Stock update error:",
            stockError
          );

          alert(
            `Stock update failed for ${item.name}.`
          );

          return;
        }
      }

      /* -------------------------------------------------------
         SUCCESS
      ------------------------------------------------------- */

      setCart([]);

      alert("Sale completed successfully!");
    } catch (error) {
      console.error("Checkout error:", error);

      alert(
        "Something went wrong while completing the sale."
      );
    } finally {
      setProcessing(false);
    }
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <EmployeeGuard>
      <main className="app-page">

        <div className="app-container max-w-5xl">

          {/* =================================================
              PAGE HEADER
          ================================================= */}

          <section className="mb-7">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

              <div>

                <div className="mb-3 flex flex-wrap items-center gap-2">

                  <span className="app-badge app-badge-rose">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--rose-dark)]" />
                    Point of Sale
                  </span>

                  <span className="app-badge app-badge-green">
                    Ready
                  </span>

                </div>

                <h1 className="app-title">
                  Register
                </h1>

                <p className="app-subtitle">
                  Scan products or enter a barcode to
                  build the customer's sale.
                </p>

              </div>

              {/* ITEMS COUNTER */}

              <div className="flex w-fit items-center gap-3 rounded-2xl border border-[#ead5d9] bg-[var(--rose-light)] px-4 py-3 shadow-sm">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--rose)] text-lg text-[var(--rose-dark)]">
                  🛒
                </div>

                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--rose-dark)]">
                    Items
                  </p>

                  <p className="text-xl font-extrabold text-[var(--rose-dark)]">
                    {units}
                  </p>
                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              SCAN / BARCODE
          ================================================= */}

          <section className="app-card p-5 sm:p-6">

            <div className="mb-5">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--green)] text-lg text-[var(--green-dark)]">
                  ▣
                </div>

                <div>
                  <h2 className="text-base font-extrabold text-[var(--foreground)]">
                    Add a product
                  </h2>

                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    Enter a barcode or scan it with your camera.
                  </p>
                </div>

              </div>

            </div>

            <div className="flex flex-col gap-3 sm:flex-row">

              <input
                value={barcode}
                onChange={(e) =>
                  setBarcode(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addByBarcode(barcode);
                  }
                }}
                placeholder="Enter barcode..."
                inputMode="numeric"
                className="app-input flex-1"
              />

              <button
                type="button"
                onClick={() => addByBarcode(barcode)}
                className="app-button app-button-rose sm:min-w-[100px]"
              >
                Add Product
              </button>

            </div>

            <button
              type="button"
              onClick={startScanner}
              className="mt-3 flex w-full items-center justify-center gap-3 rounded-2xl border border-[#d5e3d7] bg-[var(--green-light)] px-5 py-4 text-sm font-extrabold text-[var(--green-dark)] transition hover:-translate-y-0.5 hover:bg-[var(--green)]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--green)]">
                📷
              </span>

              Scan Barcode
            </button>

          </section>

          {/* =================================================
              CART
          ================================================= */}

          <section className="app-list mt-5">

            {/* CART HEADER */}

            <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--green-light)] px-5 py-5">

              <div>

                <p className="app-eyebrow">
                  Current sale
                </p>

                <h2 className="mt-1 text-xl font-extrabold text-[var(--foreground)]">
                  Shopping Cart
                </h2>

              </div>

              <span className="app-badge app-badge-green">
                {cart.length}{" "}
                {cart.length === 1
                  ? "product"
                  : "products"}
              </span>

            </div>

            {/* EMPTY CART */}

            {cart.length === 0 ? (
              <div className="app-empty">

                <div className="app-empty-icon">
                  🛒
                </div>

                <p className="text-sm font-extrabold text-[var(--foreground)]">
                  Your cart is empty
                </p>

                <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[var(--muted)]">
                  Scan a barcode or enter one above to
                  add products to this sale.
                </p>

              </div>
            ) : (
              <div>

                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 border-b border-[#edf0ed] px-5 py-5 last:border-b-0 sm:flex-row sm:items-center"
                  >

                    {/* PRODUCT */}

                    <div className="min-w-0 flex-1">

                      <div className="flex items-start gap-3">

                        <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--rose-light)] text-[var(--rose-dark)] sm:flex">
                          ✦
                        </div>

                        <div className="min-w-0">

                          <p className="truncate text-sm font-extrabold text-[var(--foreground)]">
                            {item.name}
                          </p>

                          {item.brand && (
                            <p className="mt-0.5 text-xs text-[var(--muted)]">
                              {item.brand}
                            </p>
                          )}

                          <p className="mt-1 text-xs font-extrabold text-[var(--rose-dark)]">
                            $
                            {Number(
                              item.price || 0
                            ).toFixed(2)}
                            {" "}each
                          </p>

                        </div>

                      </div>

                    </div>

                    {/* QUANTITY */}

                    <div className="flex items-center justify-between gap-3 sm:justify-end">

                      <div className="flex items-center rounded-2xl border border-[var(--border)] bg-[var(--green-light)] p-1">

                        <button
                          type="button"
                          onClick={() =>
                            changeQty(
                              item.id,
                              -1
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-lg font-extrabold text-[var(--green-dark)] transition hover:bg-[var(--green)]"
                        >
                          −
                        </button>

                        <span className="flex w-9 justify-center text-sm font-extrabold text-[var(--foreground)]">
                          {item.qty}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            changeQty(
                              item.id,
                              1
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-lg font-extrabold text-[var(--green-dark)] transition hover:bg-[var(--green)]"
                        >
                          +
                        </button>

                      </div>

                      {/* ITEM TOTAL */}

                      <p className="w-20 text-right text-sm font-extrabold text-[var(--foreground)]">
                        $
                        {(
                          Number(item.price || 0) *
                          item.qty
                        ).toFixed(2)}
                      </p>

                      {/* REMOVE */}

                      <button
                        type="button"
                        onClick={() =>
                          removeItem(item.id)
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--rose-light)] text-sm font-extrabold text-[var(--rose-dark)] transition hover:bg-[var(--rose)]"
                        aria-label={`Remove ${item.name}`}
                      >
                        ×
                      </button>

                    </div>

                  </div>
                ))}

              </div>
            )}

          </section>

          {/* =================================================
              CHECKOUT
          ================================================= */}

          <section className="mt-5 overflow-hidden rounded-[28px] border border-[#d5e2d7] bg-[var(--green)] shadow-[0_12px_35px_rgba(70,90,75,0.10)]">

            <div className="p-5 sm:p-7">

              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--green-dark)]">
                    Sale total
                  </p>

                  <p className="mt-1 text-3xl font-extrabold tracking-tight text-[var(--green-dark)]">
                    ${total.toFixed(2)}
                  </p>

                  <p className="mt-1 text-xs text-[var(--green-dark)]/70">
                    {units}{" "}
                    {units === 1
                      ? "item"
                      : "items"}{" "}
                    in this sale
                  </p>

                </div>

                <button
                  type="button"
                  onClick={checkout}
                  disabled={
                    cart.length === 0 ||
                    processing
                  }
                  className="w-full rounded-2xl bg-[var(--rose)] px-6 py-4 text-sm font-extrabold text-[var(--rose-dark)] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#efd3d8] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:min-w-[190px]"
                >
                  {processing
                    ? "Processing..."
                    : "Complete Sale →"}
                </button>

              </div>

            </div>

          </section>

          {/* =================================================
              FOOTER
          ================================================= */}

          <footer className="py-10 text-center">

            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--muted)]">
              Ward Cosmetics
            </p>

            <p className="mt-1 text-[10px] text-[var(--muted)]">
              Point of Sale
            </p>

          </footer>

        </div>

        {/* ===================================================
            BARCODE SCANNER MODAL
        =================================================== */}

        {scannerOpen && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-[#30282a]/55 p-4 backdrop-blur-sm"
            onClick={stopScanner}
          >

            <div
              className="w-full max-w-md overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--card)] shadow-2xl"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* MODAL HEADER */}

              <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--green-light)] px-5 py-5">

                <div>

                  <p className="app-eyebrow">
                    Barcode scanner
                  </p>

                  <h2 className="mt-1 text-lg font-extrabold text-[var(--foreground)]">
                    Scan product
                  </h2>

                </div>

                <button
                  type="button"
                  onClick={stopScanner}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl text-[var(--muted)] shadow-sm transition hover:bg-[var(--rose-light)] hover:text-[var(--rose-dark)]"
                  aria-label="Close scanner"
                >
                  ×
                </button>

              </div>

              {/* SCANNER */}

              <div className="p-5">

                <div className="overflow-hidden rounded-[24px] border border-[#dfe6df] bg-[#171717]">

                  <div
                    id="register-scanner"
                    className="min-h-[280px] w-full"
                  />

                </div>

                {scannerLoading && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-[var(--muted)]">

                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#d5e1d7] border-t-[var(--rose-dark)]" />

                    Starting camera...

                  </div>
                )}

                {scannerError && (
                  <div className="mt-4 rounded-2xl border border-[#edd0d5] bg-[var(--rose-light)] p-4 text-xs leading-5 text-[var(--rose-dark)]">

                    <p className="font-extrabold">
                      Camera unavailable
                    </p>

                    <p className="mt-1">
                      {scannerError}
                    </p>

                  </div>
                )}

                {!scannerError &&
                  !scannerLoading && (
                    <p className="mt-4 text-center text-xs leading-5 text-[var(--muted)]">
                      Point the camera at the product
                      barcode. The product will be
                      added automatically when detected.
                    </p>
                  )}

                <button
                  type="button"
                  onClick={stopScanner}
                  className="app-button app-button-light mt-5 w-full"
                >
                  Close Scanner
                </button>

              </div>

            </div>

          </div>
        )}

      </main>
    </EmployeeGuard>
  );
}