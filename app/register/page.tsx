"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [barcode, setBarcode] = useState("");

  const scannerRef = useRef<Html5Qrcode | null>(null);

  /* ================= VIBRATION ONLY ================= */
  function successFeedback() {
    if (navigator.vibrate) {
      navigator.vibrate(120);
    }
  }

  /* ================= FIND PRODUCT ================= */
  async function addByBarcode(code: string) {
    const cleanCode = code.trim();

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("barcode", cleanCode)
      .maybeSingle();

    if (error || !data) {
      alert(`Product not found: ${cleanCode}`);
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
  }

  /* ================= CAMERA ================= */
  async function startScanner() {
    setScannerOpen(true);

    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        const cameras = await Html5Qrcode.getCameras();

        if (!cameras?.length) {
          alert("No camera found");
          return;
        }

        const backCamera =
          cameras.find(
            (c) =>
              c.label.toLowerCase().includes("back") ||
              c.label.toLowerCase().includes("rear")
          ) || cameras[0];

        await html5QrCode.start(
          backCamera.id,
          { fps: 10, qrbox: 250 },
          async (decodedText) => {
            await stopScanner();

            const scanned = decodedText.trim();
            setBarcode(scanned);

            await addByBarcode(scanned);

            // ✅ vibration only
            successFeedback();
          },
          () => {}
        );
      } catch (err) {
        console.log(err);
        alert("Camera failed to open");
        setScannerOpen(false);
      }
    }, 300);
  }

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
    if (cart.length === 0) return;

    for (const item of cart) {
      if ((item.stock_quantity || 0) < item.qty) {
        alert(
          `Not enough stock for ${item.name}\nAvailable: ${item.stock_quantity}`
        );
        return;
      }
    }

    for (const item of cart) {
      await supabase
        .from("products")
        .update({
          stock_quantity: item.stock_quantity - item.qty,
        })
        .eq("id", item.id);
    }

    setCart([]);
    alert("Checkout successful");
  }

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🧾 Register (POS)</h1>

      <div style={styles.inputRow}>
        <input
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Enter barcode..."
          style={styles.input}
        />

        <button
          style={styles.addBtn}
          onClick={() => addByBarcode(barcode)}
        >
          Add
        </button>
      </div>

      <button style={styles.scanBtn} onClick={startScanner}>
        📷 Scan Barcode
      </button>

      {scannerOpen && (
        <div style={styles.cameraBox}>
          <div id="reader" />
          <button onClick={stopScanner} style={styles.closeBtn}>
            Close Camera
          </button>
        </div>
      )}

      <div style={styles.card}>
        {cart.length === 0 && (
          <p style={{ color: "#777" }}>No items yet</p>
        )}

        {cart.map((item) => (
          <div key={item.id} style={styles.row}>
            <div>
              <b>{item.name}</b>
              <div style={{ color: "#666", fontSize: 12 }}>
                ${item.price}
              </div>
            </div>

            <div style={styles.qtyControls}>
              <button
                style={styles.qtyBtn}
                onClick={() =>
                  setCart((prev) =>
                    prev.map((i) =>
                      i.id === item.id
                        ? { ...i, qty: Math.max(1, i.qty - 1) }
                        : i
                    )
                  )
                }
              >
                -
              </button>

              <span>{item.qty}</span>

              <button
                style={styles.qtyBtn}
                onClick={() =>
                  setCart((prev) =>
                    prev.map((i) =>
                      i.id === item.id
                        ? { ...i, qty: i.qty + 1 }
                        : i
                    )
                  )
                }
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ color: "#111827" }}>
        Total: ${total.toFixed(2)}
      </h2>

      <button style={styles.payBtn} onClick={checkout}>
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
  title: {
    color: "#111827",
    marginBottom: 20,
  },
  inputRow: {
    display: "flex",
    gap: 10,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    border: "1px solid #ddd",
    color: "#111827",
    background: "white",
  },
  addBtn: {
    padding: "12px 18px",
    background: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: 12,
  },
  scanBtn: {
    width: "100%",
    padding: 14,
    background: "#06b6d4",
    color: "white",
    border: "none",
    borderRadius: 12,
    marginBottom: 15,
  },
  cameraBox: {
    background: "white",
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
  },
  closeBtn: {
    marginTop: 10,
    width: "100%",
    padding: 12,
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: 12,
  },
  card: {
    background: "white",
    borderRadius: 12,
    padding: 15,
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: 10,
    borderBottom: "1px solid #eee",
    color: "#111827",
  },
  payBtn: {
    width: "100%",
    padding: 15,
    marginTop: 15,
    background: "#10b981",
    color: "white",
    border: "none",
    borderRadius: 12,
    fontWeight: "bold",
  },
  qtyControls: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    border: "none",
    borderRadius: 8,
    background: "#6366f1",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },
};