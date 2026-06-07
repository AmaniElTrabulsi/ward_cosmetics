"use client";

import { useEffect, useRef, useState } from "react";
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

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("barcode", value)
      .single();

    if (error || !data) {
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

  /* ================= OPEN CAMERA SCANNER ================= */
  async function startScanner() {
    setScannerOpen(true);

    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" }, // ✅ BACK CAMERA FIX
          {
            fps: 10,
            qrbox: 250,
          },
          async (decodedText) => {
            await html5QrCode.stop();
            setScannerOpen(false);
            findProduct(decodedText);
          },
          () => {}
        );
      } catch (err) {
        console.log("Camera error:", err);
        alert("Cannot access camera");
        setScannerOpen(false);
      }
    }, 300);
  }

  /* ================= STOP SCANNER ================= */
  async function stopScanner() {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScannerOpen(false);
  }

  /* ================= CART ================= */
  function removeItem(id: string) {
    setCart(cart.filter((i) => i.id !== id));
  }

  function updateQty(id: string, qty: number) {
    setCart(
      cart.map((i) =>
        i.id === id ? { ...i, qty: Math.max(1, qty) } : i
      )
    );
  }

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  /* ================= CHECKOUT ================= */
  async function checkout() {
    if (cart.length === 0) return;

    setLoading(true);

    try {
      for (const item of cart) {
        const newStock =
          (item.stock_quantity || 0) - item.qty;

        await supabase
          .from("products")
          .update({ stock_quantity: newStock })
          .eq("id", item.id);
      }

      setCart([]);
      alert("Checkout successful!");
    } catch (err) {
      console.log(err);
      alert("Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🧾 Register (POS)</h1>

      {/* INPUT + ACTIONS */}
      <div style={styles.scanBox}>
        <input
          style={styles.input}
          placeholder="Scan or enter barcode"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
        />

        <button
          style={styles.addBtn}
          onClick={() => findProduct()}
        >
          Add
        </button>

        <button
          style={styles.scanBtn}
          onClick={startScanner}
        >
          📷 Scan
        </button>
      </div>

      {/* CAMERA SCANNER */}
      {scannerOpen && (
        <div style={styles.scannerBox}>
          <div id="reader" style={{ width: "100%" }} />

          <button style={styles.stopBtn} onClick={stopScanner}>
            Stop Scanner
          </button>
        </div>
      )}

      {/* CART */}
      <div style={styles.cart}>
        <h3>Cart</h3>

        {cart.length === 0 && (
          <p style={{ color: "#888" }}>No items yet</p>
        )}

        {cart.map((item) => (
          <div key={item.id} style={styles.cartItem}>
            <div>
              <b>{item.name}</b>
              <p style={{ fontSize: 12, color: "#888" }}>
                ${item.price}
              </p>
            </div>

            <div style={styles.qtyBox}>
              <button onClick={() => updateQty(item.id, item.qty - 1)}>
                -
              </button>

              <span>{item.qty}</span>

              <button onClick={() => updateQty(item.id, item.qty + 1)}>
                +
              </button>
            </div>

            <button
              style={styles.removeBtn}
              onClick={() => removeItem(item.id)}
            >
              ❌
            </button>
          </div>
        ))}
      </div>

      {/* TOTAL */}
      <div style={styles.totalBox}>
        <h2>Total: ${total.toFixed(2)}</h2>

        <button
          style={styles.checkoutBtn}
          onClick={checkout}
          disabled={loading}
        >
          💳 Checkout
        </button>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles: any = {
  page: {
    padding: 20,
    minHeight: "100vh",
    backgroundColor: "#0f0f10",
    color: "white",
  },

  title: {
    marginBottom: 20,
  },

  scanBox: {
    display: "flex",
    gap: 8,
    marginBottom: 15,
  },

  input: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    border: "1px solid #333",
    backgroundColor: "#1a1a1a",
    color: "white",
  },

  addBtn: {
    padding: "12px 14px",
    backgroundColor: "#3b82f6",
    border: "none",
    borderRadius: 10,
    color: "white",
  },

  scanBtn: {
    padding: "12px 14px",
    backgroundColor: "#10b981",
    border: "none",
    borderRadius: 10,
    color: "black",
    fontWeight: "bold",
  },

  scannerBox: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#111",
    borderRadius: 10,
  },

  stopBtn: {
    marginTop: 10,
    width: "100%",
    padding: 10,
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: 8,
  },

  cart: {
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 12,
  },

  cartItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: 10,
    borderBottom: "1px solid #333",
  },

  qtyBox: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },

  removeBtn: {
    background: "transparent",
    border: "none",
    color: "red",
  },

  totalBox: {
    marginTop: 20,
    textAlign: "center",
  },

  checkoutBtn: {
    width: "100%",
    padding: 15,
    backgroundColor: "#4ade80",
    border: "none",
    borderRadius: 10,
    fontWeight: "bold",
  },
};