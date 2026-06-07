"use client";

import { useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);

  const readerId = "reader";

  /* ================= ADD PRODUCT ================= */
  async function addByBarcode(code: string) {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("barcode", code)
      .single();

    if (!data) {
      alert("Product not found");
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
  }

  /* ================= START SCANNER (FIXED) ================= */
  async function startScanner() {
    try {
      if (isRunningRef.current) return;

      setScannerOpen(true);

      const html5QrCode = new Html5Qrcode(readerId);
      scannerRef.current = html5QrCode;

      isRunningRef.current = true;

      await html5QrCode.start(
        { facingMode: "environment" }, // back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          await stopScanner();
          addByBarcode(decodedText);
        },
        (err) => {
          // ignore scan errors
        }
      );
    } catch (err) {
      console.log("Camera error:", err);
      alert(
        "Camera failed to open.\nCheck HTTPS + permissions + camera access."
      );
      setScannerOpen(false);
      isRunningRef.current = false;
    }
  }

  /* ================= STOP SCANNER ================= */
  async function stopScanner() {
    try {
      if (scannerRef.current && isRunningRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      }
    } catch {}

    scannerRef.current = null;
    isRunningRef.current = false;
    setScannerOpen(false);
  }

  /* ================= CHECKOUT ================= */
  async function checkout() {
    for (const item of cart) {
      await supabase
        .from("products")
        .update({
          stock_quantity: (item.stock_quantity || 0) - item.qty,
        })
        .eq("id", item.id);
    }

    setCart([]);
    alert("Checkout done");
  }

  const total = cart.reduce(
    (s, i) => s + i.price * i.qty,
    0
  );

  return (
    <div style={styles.page}>
      <h1>🧾 Register</h1>

      {/* SCAN BUTTON */}
      <button style={styles.scanBtn} onClick={startScanner}>
        📷 Scan Barcode (Back Camera)
      </button>

      {/* CAMERA VIEW */}
      {scannerOpen && (
        <div style={styles.cameraBox}>
          <div id={readerId} style={{ width: "100%" }} />
          <button onClick={stopScanner} style={styles.closeBtn}>
            Close Camera
          </button>
        </div>
      )}

      {/* CART */}
      <div style={styles.card}>
        {cart.map((item) => (
          <div key={item.id} style={styles.row}>
            <b>{item.name}</b>
            <span>{item.qty}</span>
          </div>
        ))}
      </div>

      <h2>Total: ${total.toFixed(2)}</h2>

      <button onClick={checkout} style={styles.payBtn}>
        Checkout
      </button>
    </div>
  );
}

const styles: any = {
  page: { padding: 20, background: "#f6f7fb", minHeight: "100vh" },

  scanBtn: {
    padding: 14,
    background: "#06b6d4",
    border: "none",
    borderRadius: 12,
    color: "white",
    marginBottom: 10,
  },

  cameraBox: {
    background: "white",
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
  },

  closeBtn: {
    marginTop: 10,
    padding: 10,
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: 8,
  },

  card: {
    background: "white",
    padding: 15,
    borderRadius: 12,
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: 8,
    borderBottom: "1px solid #eee",
  },

  payBtn: {
    width: "100%",
    marginTop: 10,
    padding: 15,
    background: "#10b981",
    color: "white",
    border: "none",
    borderRadius: 12,
  },
};