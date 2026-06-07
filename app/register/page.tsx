"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
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

  /* ================= START SCANNER (FIXED VERSION) ================= */
  async function startScanner() {
    try {
      setScannerOpen(true);

      const html5QrCode = new Html5Qrcode(readerId);
      scannerRef.current = html5QrCode;

      const devices = await Html5Qrcode.getCameras();

      if (!devices || devices.length === 0) {
        alert("No camera found");
        return;
      }

      // pick BACK camera (best effort)
      const backCamera =
        devices.find((d) =>
          d.label.toLowerCase().includes("back")
        ) || devices[0];

      await html5QrCode.start(
        backCamera.id,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          await stopScanner();
          addByBarcode(decodedText);
        },
        () => {}
      );
    } catch (err) {
      console.log("Scanner error:", err);
      alert("Camera failed to open. Try refresh or HTTPS.");
      setScannerOpen(false);
    }
  }

  /* ================= STOP SCANNER ================= */
  async function stopScanner() {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      }
    } catch {}

    scannerRef.current = null;
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

      <button style={styles.scanBtn} onClick={startScanner}>
        📷 Scan Barcode
      </button>

      {scannerOpen && (
        <div style={styles.cameraBox}>
          <div id={readerId} style={{ width: "100%" }} />
          <button onClick={stopScanner} style={styles.closeBtn}>
            Close Camera
          </button>
        </div>
      )}

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
  page: {
    padding: 20,
    background: "#f6f7fb",
    minHeight: "100vh",
  },

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
    border: "none",
    color: "white",
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
    border: "none",
    borderRadius: 12,
    color: "white",
  },
};