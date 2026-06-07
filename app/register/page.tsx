"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Html5Qrcode } from "html5-qrcode";

export default function RegisterPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [barcode, setBarcode] = useState("");
  const [scanning, setScanning] = useState(false);

  const scannerRef = useRef<any>(null);

  /* ================= FIND PRODUCT ================= */
  async function findProduct(code: string) {
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

  /* ================= START SCANNER ================= */
  async function startScanner() {
    try {
      setScanning(true);

      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      const devices = await Html5Qrcode.getCameras();

      const cameraId = devices?.[0]?.id;

      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: 250,
        },
        (decodedText) => {
          findProduct(decodedText);
          stopScanner();
        },
        () => {}
      );
    } catch (err) {
      console.log(err);
      alert("Scanner failed to start");
      setScanning(false);
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

    setScanning(false);
  }

  /* ================= CART ================= */
  const total = cart.reduce(
    (sum, i) => sum + i.price * i.qty,
    0
  );

  return (
    <div style={styles.page}>
      <h1>🧾 Register (POS)</h1>

      {/* INPUT */}
      <div style={styles.row}>
        <input
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Enter barcode"
          style={styles.input}
        />

        <button onClick={() => findProduct(barcode)}>
          Add
        </button>

        {!scanning ? (
          <button onClick={startScanner}>📷 Scan</button>
        ) : (
          <button onClick={stopScanner}>Stop</button>
        )}
      </div>

      {/* CAMERA VIEW */}
      <div
        id="reader"
        style={{
          width: "100%",
          marginTop: 10,
          borderRadius: 10,
          overflow: "hidden",
        }}
      />

      {/* CART */}
      <div style={styles.cart}>
        {cart.map((i) => (
          <div key={i.id} style={styles.item}>
            <b>{i.name}</b>
            <span>{i.qty}</span>
          </div>
        ))}
      </div>

      <h2>Total: ${total.toFixed(2)}</h2>
    </div>
  );
}

const styles: any = {
  page: {
    padding: 20,
    background: "#0b0f19",
    color: "white",
    minHeight: "100vh",
  },

  row: {
    display: "flex",
    gap: 10,
  },

  input: {
    flex: 1,
    padding: 10,
  },

  cart: {
    marginTop: 20,
    padding: 10,
    background: "#111827",
  },

  item: {
    display: "flex",
    justifyContent: "space-between",
  },
};