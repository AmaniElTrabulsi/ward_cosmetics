"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Html5Qrcode } from "html5-qrcode";

export default function RegisterPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerId = "reader";

  /* ================= FIND PRODUCT ================= */
  async function addByBarcode(code: string) {
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("barcode", code)
      .single();

    if (error || !data) {
      alert("Product not found");
      setLoading(false);
      return;
    }

    setCart((prev) => {
      const exists = prev.find((i) => i.id === data.id);

      if (exists) {
        return prev.map((i) =>
          i.id === data.id ? { ...i, qty: i.qty + 1 } : i
        );
      }

      return [...prev, { ...data, qty: 1 }];
    });

    setLoading(false);
  }

  /* ================= START SCANNER (BACK CAMERA FIX) ================= */
  async function startScanner() {
    try {
      setScannerOpen(true);

      const html5QrCode = new Html5Qrcode(readerId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" }, // 🔥 BACK CAMERA FIX
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          await html5QrCode.stop();
          await html5QrCode.clear();

          setScannerOpen(false);
          addByBarcode(decodedText);
        },
        (error) => {
          // ignore scan errors
        }
      );
    } catch (err) {
      console.log(err);
      alert("Camera failed to open");
    }
  }

  /* ================= STOP SCANNER ================= */
  async function stopScanner() {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      await scannerRef.current.clear();
      scannerRef.current = null;
    }
    setScannerOpen(false);
  }

  /* ================= CART ================= */
  function removeItem(id: string) {
    setCart(cart.filter((i) => i.id !== id));
  }

  function updateQty(id: string, qty: number) {
    setCart((prev) =>
      prev.map((i) =>
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
        const newStock = (item.stock_quantity || 0) - item.qty;

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
      <h1 style={styles.title}>🧾 Register</h1>

      {/* SCAN BUTTON */}
      <button style={styles.scanBtn} onClick={startScanner}>
        📷 Scan Barcode
      </button>

      {/* CAMERA VIEW */}
      {scannerOpen && (
        <div style={styles.cameraBox}>
          <div id={readerId} style={{ width: "100%" }} />

          <button style={styles.closeBtn} onClick={stopScanner}>
            Close Camera
          </button>
        </div>
      )}

      {/* CART */}
      <div style={styles.card}>
        <h3>Cart</h3>

        {cart.map((item) => (
          <div key={item.id} style={styles.item}>
            <div>
              <b>{item.name}</b>
              <p>${item.price}</p>
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

            <button onClick={() => removeItem(item.id)}>❌</button>
          </div>
        ))}
      </div>

      <h2>Total: ${total.toFixed(2)}</h2>

      <button style={styles.payBtn} onClick={checkout}>
        Checkout
      </button>
    </div>
  );
}

/* ================= STYLES ================= */

const styles: any = {
  page: {
    padding: 20,
    background: "#f6f7fb",
    minHeight: "100vh",
  },

  title: {
    fontSize: 28,
    marginBottom: 15,
  },

  scanBtn: {
    padding: 14,
    background: "#06b6d4",
    border: "none",
    borderRadius: 12,
    color: "white",
    marginBottom: 15,
  },

  cameraBox: {
    background: "white",
    padding: 10,
    borderRadius: 12,
    marginBottom: 15,
  },

  closeBtn: {
    marginTop: 10,
    padding: 10,
    background: "#ef4444",
    border: "none",
    color: "white",
    borderRadius: 8,
  },

  card: {
    background: "white",
    padding: 15,
    borderRadius: 16,
  },

  item: {
    display: "flex",
    justifyContent: "space-between",
    padding: 10,
    borderBottom: "1px solid #eee",
  },

  qty: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },

  payBtn: {
    width: "100%",
    padding: 15,
    background: "#10b981",
    color: "white",
    border: "none",
    borderRadius: 12,
    marginTop: 10,
  },
};