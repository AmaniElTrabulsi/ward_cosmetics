"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Html5Qrcode } from "html5-qrcode";

export default function RegisterPage() {
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);

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
  }

  /* ================= SCANNER ================= */
  async function startScanner() {
    setScannerOpen(true);

    setTimeout(async () => {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (text) => {
          await html5QrCode.stop();
          setScannerOpen(false);
          findProduct(text);
        }
      );
    }, 200);
  }

  async function stopScanner() {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScannerOpen(false);
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
  }

  function removeItem(id: string) {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }

  /* ================= CHECKOUT ================= */
  async function checkout() {
    setLoading(true);

    for (const item of cart) {
      await supabase
        .from("products")
        .update({
          stock_quantity: (item.stock_quantity || 0) - item.qty,
        })
        .eq("id", item.id);
    }

    setCart([]);
    setLoading(false);
    alert("Checkout successful");
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>🧾 Register</h1>

        {/* INPUT BAR */}
        <div style={styles.row}>
          <input
            style={styles.input}
            placeholder="Scan or enter barcode"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
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
              Stop
            </button>
          </div>
        )}

        {/* CART */}
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Cart</h3>

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

              <button
                style={styles.delete}
                onClick={() => removeItem(item.id)}
              >
                ✕
              </button>
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

/* ================= STYLES (MATCH APP THEME) ================= */

const styles: any = {
  page: {
    padding: 20,
    backgroundColor: "#0f0f10",
    minHeight: "100vh",
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
    backgroundColor: "#1a1a1a",
    border: "1px solid #333",
    color: "white",
  },

  card: {
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    border: "1px solid #2a2a2a",
  },

  sectionTitle: {
    marginBottom: 10,
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
    color: "#888",
    fontSize: 12,
  },

  btnBlue: {
    padding: "10px 14px",
    backgroundColor: "#3b82f6",
    border: "none",
    borderRadius: 8,
    color: "white",
  },

  btnGreen: {
    padding: "10px 14px",
    backgroundColor: "#10b981",
    border: "none",
    borderRadius: 8,
    color: "black",
    fontWeight: "bold",
  },

  btnRed: {
    marginTop: 10,
    width: "100%",
    padding: 10,
    backgroundColor: "#ef4444",
    border: "none",
    borderRadius: 8,
    color: "white",
  },

  delete: {
    background: "transparent",
    border: "none",
    color: "red",
  },

  footer: {
    textAlign: "center",
    marginTop: 20,
  },

  checkout: {
    width: "100%",
    padding: 14,
    backgroundColor: "#4ade80",
    border: "none",
    borderRadius: 10,
    fontWeight: "bold",
  },
};