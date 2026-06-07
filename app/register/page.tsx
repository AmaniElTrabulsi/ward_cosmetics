"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const readerId = "reader";

  /* ================= ADD PRODUCT ================= */
  async function addByBarcode(code: string) {
    if (!code) return;

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
    setScannerOpen(true);
  }

  /* ================= CAMERA INIT ================= */
  useEffect(() => {
    if (!scannerOpen) return;

    let qr: Html5Qrcode;

    const start = async () => {
      try {
        qr = new Html5Qrcode(readerId);
        scannerRef.current = qr;

        const cameras = await Html5Qrcode.getCameras();

        if (!cameras.length) {
          alert("No camera found");
          return;
        }

        // prefer back camera
        const back =
          cameras.find((c) =>
            c.label.toLowerCase().includes("back")
          ) || cameras[0];

        await qr.start(
          back.id,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          async (text) => {
            await qr.stop();
            setScannerOpen(false);
            addByBarcode(text);
          },
          () => {}
        );
      } catch (e) {
        console.log(e);
        alert("Camera failed to open");
        setScannerOpen(false);
      }
    };

    setTimeout(start, 300);

    return () => {
      qr?.stop().catch(() => {});
    };
  }, [scannerOpen]);

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
    alert("Checkout successful");
  }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🧾 Register</h1>

      {/* MANUAL INPUT (AUTOFOCUS FIX) */}
      <div style={styles.inputBox}>
        <input
          ref={inputRef}
          autoFocus
          placeholder="Scan or type barcode"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addByBarcode(manualCode);
              setManualCode("");
            }
          }}
          style={styles.input}
        />

        <button
          style={styles.scanBtn}
          onClick={() => {
            addByBarcode(manualCode);
            setManualCode("");
          }}
        >
          Add
        </button>

        <button style={styles.cameraBtn} onClick={startScanner}>
          📷 Scan
        </button>
      </div>

      {/* CAMERA MODAL */}
      {scannerOpen && (
        <div style={styles.modal}>
          <div id={readerId} style={styles.camera} />
          <button
            style={styles.closeBtn}
            onClick={() => setScannerOpen(false)}
          >
            Close Camera
          </button>
        </div>
      )}

      {/* CART */}
      <div style={styles.card}>
        {cart.length === 0 ? (
          <p style={{ color: "#666" }}>Cart is empty</p>
        ) : (
          cart.map((i) => (
            <div key={i.id} style={styles.row}>
              <b>{i.name}</b>
              <span>× {i.qty}</span>
            </div>
          ))
        )}
      </div>

      <h2>Total: ${total.toFixed(2)}</h2>

      <button style={styles.payBtn} onClick={checkout}>
        Checkout
      </button>
    </div>
  );
}

const styles: any = {
  page: { padding: 20 },

  title: { marginBottom: 15 },

  inputBox: {
    display: "flex",
    gap: 8,
    marginBottom: 15,
  },

  input: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    border: "1px solid #ddd",
  },

  scanBtn: {
    background: "#6366f1",
    color: "white",
    border: "none",
    padding: 12,
    borderRadius: 10,
  },

  cameraBtn: {
    background: "#06b6d4",
    color: "white",
    border: "none",
    padding: 12,
    borderRadius: 10,
  },

  modal: {
    background: "white",
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
  },

  camera: {
    width: "100%",
  },

  closeBtn: {
    marginTop: 10,
    width: "100%",
    padding: 10,
    background: "#ef4444",
    border: "none",
    color: "white",
    borderRadius: 10,
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
    marginTop: 15,
    width: "100%",
    padding: 15,
    background: "#10b981",
    border: "none",
    borderRadius: 12,
    color: "white",
  },
};