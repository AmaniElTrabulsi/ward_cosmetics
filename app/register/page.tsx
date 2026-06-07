"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Html5Qrcode } from "html5-qrcode";

export default function RegisterPage() {
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  /* ================= AUTO FOCUS ================= */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function focusInput() {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }

  /* ================= FIND PRODUCT ================= */
  async function findProduct(code?: string) {
    const value = code || barcode;
    if (!value) return;

    setLoading(true);

    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("barcode", value)
      .single();

    if (!data) {
      alert("Product not found");
      setLoading(false);
      focusInput();
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.id === data.id);

      if (existing) {
        return prev.map((i) =>
          i.id === data.id ? { ...i, qty: i.qty + 1 } : i
        );
      }

      return [...prev, { ...data, qty: 1 }];
    });

    setBarcode("");
    setLoading(false);
    focusInput();
  }

  /* ================= SCANNER (FIXED 4 ARGS) ================= */
  async function startScanner() {
    setScannerOpen(true);

    setTimeout(async () => {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" }, // back camera
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          await html5QrCode.stop();
          setScannerOpen(false);
          findProduct(decodedText);
        },
        () => {} // REQUIRED 4th arg (error callback)
      );
    }, 200);
  }

  async function stopScanner() {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScannerOpen(false);
    focusInput();
  }

  /* ================= CART ================= */
  const total = cart.reduce(
    (sum, i) => sum + i.price * i.qty,
    0
  );

  function updateQty(id: string, qty: number) {
    setCart((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, qty: Math.max(1, qty) } : i
      )
    );
    focusInput();
  }

  function removeItem(id: string) {
    setCart((prev) => prev.filter((i) => i.id !== id));
    focusInput();
  }

  /* ================= CHECKOUT ================= */
  async function checkout() {
    setLoading(true);

    for (const item of cart) {
      await supabase
        .from("products")
        .update({
          stock_quantity:
            (item.stock_quantity || 0) - item.qty,
        })
        .eq("id", item.id);
    }

    setCart([]);
    setLoading(false);
    focusInput();
    alert("Checkout successful");
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>🧾 Register</h1>

        {/* INPUT BAR */}
        <div style={styles.row}>
          <input
            ref={inputRef}
            style={styles.input}
            placeholder="Scan barcode..."
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") findProduct();
            }}
          />

          <button style={styles.btnBlue} onClick={() => findProduct()}>
            Add
          </button>

          <button style={styles.btnGreen} onClick={startScanner}>
            Scan
          </button>
        </div>

        {/* SCANNER */}
        {scannerOpen && (
          <div style={styles.card}>
            <div id="reader" />
            <button style={styles.btnRed} onClick={stopScanner}>
              Stop Scanner
            </button>
          </div>
        )}

        {/* CART */}
        <div style={styles.card}>
          <h3>Cart</h3>

          {cart.length === 0 && (
            <p style={styles.muted}>No items yet</p>
          )}

          {cart.map((item) => (
            <div key={item.id} style={styles.item}>
              <div>
                <b>{item.name}</b>
                <p style={styles.muted}>${item.price}</p>
              </div>

              <div style={styles.qty}>
                <button onClick={() => updateQty(item.id, item.qty - 1)}>
                  -
                </button>
                <span>{item.qty}</span>
                <button onClick={() => updateQty(item.id, item.qty + 1)}>
                  +
                </button>
              </div>

              <button onClick={() => removeItem(item.id)}>✕</button>
            </div>
          ))}
        </div>

        {/* TOTAL */}
        <div style={styles.footer}>
          <h2>Total: ${total.toFixed(2)}</h2>

          <button style={styles.checkout} onClick={checkout}>
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= MODERN STYLES ================= */

const styles: any = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f0f10, #151a2d)",
    padding: 20,
    color: "white",
  },

  container: {
    maxWidth: 900,
    margin: "0 auto",
  },

  title: {
    fontSize: 24,
    marginBottom: 20,
  },

  row: {
    display: "flex",
    gap: 10,
    marginBottom: 20,
  },

  input: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    border: "1px solid #333",
    backgroundColor: "#111",
    color: "white",
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    padding: 15,
    borderRadius: 14,
    marginBottom: 15,
    backdropFilter: "blur(10px)",
  },

  item: {
    display: "flex",
    justifyContent: "space-between",
    padding: 10,
    borderBottom: "1px solid #333",
  },

  qty: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },

  muted: {
    color: "#aaa",
    fontSize: 12,
  },

  btnBlue: {
    padding: "10px 14px",
    background: "#3b82f6",
    border: "none",
    borderRadius: 10,
    color: "white",
  },

  btnGreen: {
    padding: "10px 14px",
    background: "#10b981",
    border: "none",
    borderRadius: 10,
    color: "black",
    fontWeight: "bold",
  },

  btnRed: {
    marginTop: 10,
    width: "100%",
    padding: 10,
    background: "#ef4444",
    border: "none",
    borderRadius: 10,
    color: "white",
  },

  footer: {
    textAlign: "center",
    marginTop: 20,
  },

  checkout: {
    width: "100%",
    padding: 14,
    background: "#4ade80",
    border: "none",
    borderRadius: 10,
    fontWeight: "bold",
  },
};