"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  /* ================= ADD PRODUCT BY BARCODE ================= */
  async function addByBarcode(code?: string) {
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
      const exists = prev.find((p) => p.id === data.id);

      if (exists) {
        return prev.map((p) =>
          p.id === data.id
            ? { ...p, qty: p.qty + 1 }
            : p
        );
      }

      return [...prev, { ...data, qty: 1 }];
    });

    setBarcode("");
    setLoading(false);
  }

  /* ================= CAMERA SCAN (BACK CAMERA) ================= */
  async function startScan() {
    try {
      setScanning(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { exact: "environment" }, // BACK CAMERA FIX
        },
      });

      const video = document.getElementById("video") as HTMLVideoElement;
      if (video) {
        video.srcObject = stream;
        video.play();
      }
    } catch (err) {
      console.log(err);

      alert("Camera not supported or permission denied");
      setScanning(false);
    }
  }

  function stopScan() {
    const video = document.getElementById("video") as HTMLVideoElement;
    const stream = video?.srcObject as MediaStream;

    stream?.getTracks().forEach((t) => t.stop());

    setScanning(false);
  }

  /* ================= CART ================= */
  function updateQty(id: string, qty: number) {
    setCart((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, qty: Math.max(1, qty) } : p
      )
    );
  }

  function removeItem(id: string) {
    setCart((prev) => prev.filter((p) => p.id !== id));
  }

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  /* ================= CHECKOUT (DECREASE STOCK) ================= */
  async function checkout() {
    if (cart.length === 0) return;

    setLoading(true);

    try {
      for (const item of cart) {
        const newStock =
          (item.stock_quantity || 0) - item.qty;

        await supabase
          .from("products")
          .update({
            stock_quantity: newStock,
          })
          .eq("id", item.id);
      }

      setCart([]);
      alert("Checkout successful");
    } catch (err) {
      console.log(err);
      alert("Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <h1>🧾 Register (POS)</h1>

      {/* BARCODE INPUT */}
      <div style={styles.row}>
        <input
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Scan or enter barcode"
          style={styles.input}
          onKeyDown={(e) => {
            if (e.key === "Enter") addByBarcode();
          }}
        />

        <button onClick={() => addByBarcode()} style={styles.btn}>
          Add
        </button>

        {!scanning ? (
          <button onClick={startScan} style={styles.scan}>
            📷 Scan
          </button>
        ) : (
          <button onClick={stopScan} style={styles.stop}>
            Stop
          </button>
        )}
      </div>

      {/* CAMERA VIEW */}
      {scanning && (
        <video id="video" style={styles.video} />
      )}

      {/* CART */}
      <div style={styles.cart}>
        {cart.length === 0 && (
          <p style={{ color: "#888" }}>Cart empty</p>
        )}

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

            <button onClick={() => removeItem(item.id)}>
              ❌
            </button>
          </div>
        ))}
      </div>

      {/* TOTAL */}
      <h2>Total: ${total.toFixed(2)}</h2>

      <button onClick={checkout} style={styles.checkout}>
        💳 Checkout (Deduct Stock)
      </button>
    </div>
  );
}

/* ================= STYLES ================= */

const styles: any = {
  page: {
    padding: 20,
    fontFamily: "Arial",
  },

  row: {
    display: "flex",
    gap: 10,
  },

  input: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    border: "1px solid #ccc",
  },

  btn: {
    padding: 12,
    background: "#6366f1",
    color: "white",
    border: "none",
  },

  scan: {
    padding: 12,
    background: "#10b981",
    color: "black",
    border: "none",
  },

  stop: {
    padding: 12,
    background: "#ef4444",
    color: "white",
    border: "none",
  },

  video: {
    width: "100%",
    marginTop: 10,
    borderRadius: 12,
  },

  cart: {
    marginTop: 20,
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

  checkout: {
    width: "100%",
    padding: 15,
    background: "#10b981",
    border: "none",
    marginTop: 20,
    borderRadius: 10,
  },
};