"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function RegisterPage() {
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const scannerRef = useRef<any>(null);

  /* ================= FIND PRODUCT ================= */
  async function findProduct(code: string) {
    const value = code.trim();
    if (!value) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("barcode", value)
      .maybeSingle();

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

  /* ================= START CAMERA SCANNER ================= */
  function startScanner() {
    setScannerOpen(true);

    setTimeout(() => {
      if (scannerRef.current) return;

      const scanner = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: 250,
          rememberLastUsedCamera: true,
          facingMode: "environment", // BACK CAMERA FIX
        },
        false
      );

      scanner.render(
        (decodedText) => {
          scanner.clear();
          setScannerOpen(false);
          findProduct(decodedText);
        },
        (error) => {
          // ignore scan errors
        }
      );

      scannerRef.current = scanner;
    }, 300);
  }

  function stopScanner() {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setScannerOpen(false);
  }

  /* ================= CART ================= */
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

  const total = cart.reduce(
    (sum, i) => sum + i.price * i.qty,
    0
  );

  /* ================= CHECKOUT ================= */
  async function checkout() {
    if (!cart.length) return;

    setLoading(true);

    try {
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
      alert("Checkout successful!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🧾 Register (POS)</h1>

      {/* SCANNER CONTROLS */}
      <div style={styles.scanBox}>
        <input
          style={styles.input}
          placeholder="Enter barcode manually"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
        />

        <button
          style={styles.scanBtn}
          onClick={() => findProduct(barcode)}
        >
          Add
        </button>

        {/* REAL CAMERA SCAN BUTTON */}
        <button
          style={styles.cameraBtn}
          onClick={startScanner}
        >
          📷 Scan
        </button>
      </div>

      {/* CAMERA VIEW */}
      {scannerOpen && (
        <div style={styles.scannerBox}>
          <div id="reader" />
          <button onClick={stopScanner} style={styles.stopBtn}>
            Stop Scanner
          </button>
        </div>
      )}

      {/* CART */}
      <div style={styles.cart}>
        <h3>Cart</h3>

        {cart.map((item) => (
          <div key={item.id} style={styles.cartItem}>
            <div>
              <b>{item.name}</b>
              <p>${item.price}</p>
            </div>

            <div>
              <button onClick={() => updateQty(item.id, item.qty - 1)}>
                -
              </button>

              <span>{item.qty}</span>

              <button onClick={() => updateQty(item.id, item.qty + 1)}>
                +
              </button>
            </div>

            <button onClick={() => removeItem(item.id)}>
              ❌
            </button>
          </div>
        ))}
      </div>

      {/* TOTAL */}
      <div style={styles.total}>
        <h2>Total: ${total.toFixed(2)}</h2>

        <button onClick={checkout} style={styles.checkout}>
          Checkout
        </button>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles: any = {
  page: {
    padding: 20,
    background: "#0f0f10",
    minHeight: "100vh",
    color: "white",
  },

  title: { marginBottom: 20 },

  scanBox: {
    display: "flex",
    gap: 10,
    marginBottom: 20,
  },

  input: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    background: "#1a1a1a",
    color: "white",
    border: "1px solid #333",
  },

  scanBtn: {
    padding: 12,
    background: "#3b82f6",
    color: "white",
    borderRadius: 10,
    border: "none",
  },

  cameraBtn: {
    padding: 12,
    background: "#10b981",
    color: "black",
    borderRadius: 10,
    border: "none",
    fontWeight: "bold",
  },

  scannerBox: {
    marginBottom: 20,
    background: "#111",
    padding: 10,
    borderRadius: 10,
  },

  stopBtn: {
    marginTop: 10,
    padding: 10,
    background: "red",
    color: "white",
    border: "none",
    borderRadius: 8,
  },

  cart: {
    background: "#1a1a1a",
    padding: 15,
    borderRadius: 12,
  },

  cartItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: 10,
    borderBottom: "1px solid #333",
  },

  total: {
    marginTop: 20,
    textAlign: "center",
  },

  checkout: {
    width: "100%",
    padding: 15,
    background: "#4ade80",
    border: "none",
    borderRadius: 10,
  },
};