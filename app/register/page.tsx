"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
      const exists = prev.find((i) => i.id === data.id);

      if (exists) {
        return prev.map((i) =>
          i.id === data.id ? { ...i, qty: i.qty + 1 } : i
        );
      }

      return [...prev, { ...data, qty: 1 }];
    });

    setBarcode("");
    setLoading(false);

    setTimeout(() => inputRef.current?.focus(), 50);
  }

  /* ================= SCAN BUTTON ================= */
  function triggerScan() {
    inputRef.current?.focus();
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

      {/* SCAN AREA */}
      <div style={styles.scanBox}>
        <input
          ref={inputRef}
          style={styles.input}
          placeholder="Scan or type barcode..."
          value={barcode}
          onChange={(e) => {
            const value = e.target.value;
            setBarcode(value);

            if (value.length >= 6) {
              findProduct(value);
            }
          }}
        />

        {/* ADD BUTTON */}
        <button
          style={styles.addBtn}
          onClick={() => findProduct()}
        >
          Add
        </button>

        {/* SCAN BUTTON (RESTORED) */}
        <button
          style={styles.scanBtn}
          onClick={triggerScan}
        >
          📷 Scan
        </button>
      </div>

      {/* CART */}
      <div style={styles.card}>
        <h3>Cart</h3>

        {cart.length === 0 && (
          <p style={{ color: "#888" }}>No items yet</p>
        )}

        {cart.map((item) => (
          <div key={item.id} style={styles.item}>
            <div>
              <b>{item.name}</b>
              <p style={{ fontSize: 12, color: "#666" }}>
                ${item.price}
              </p>
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
              onClick={() => removeItem(item.id)}
              style={{ color: "red", border: "none", background: "transparent" }}
            >
              ❌
            </button>
          </div>
        ))}
      </div>

      {/* TOTAL */}
      <div style={styles.totalBox}>
        <h2>Total: ${total.toFixed(2)}</h2>

        <button style={styles.checkoutBtn} onClick={checkout}>
          Checkout
        </button>
      </div>
    </div>
  );
}

/* ================= MODERN LIGHT THEME ================= */

const styles: any = {
  page: {
    padding: 20,
    background: "#f6f7fb",
    minHeight: "100vh",
    fontFamily: "Arial",
  },

  title: {
    fontSize: 28,
    marginBottom: 20,
  },

  scanBox: {
    display: "flex",
    gap: 10,
    marginBottom: 20,
  },

  input: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "white",
    outline: "none",
  },

  addBtn: {
    padding: "12px 16px",
    background: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
  },

  scanBtn: {
    padding: "12px 16px",
    background: "#06b6d4",
    color: "white",
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
  },

  card: {
    background: "white",
    padding: 15,
    borderRadius: 16,
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
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

  totalBox: {
    marginTop: 20,
    textAlign: "center",
  },

  checkoutBtn: {
    width: "100%",
    marginTop: 10,
    padding: 14,
    background: "#10b981",
    color: "white",
    border: "none",
    borderRadius: 12,
    fontWeight: "bold",
  },
};