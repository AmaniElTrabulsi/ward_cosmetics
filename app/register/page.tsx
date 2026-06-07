"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  /* ================= FIND PRODUCT ================= */
  async function findProduct(code?: string) {
    const value = (code || barcode).trim(); // IMPORTANT FIX
    if (!value) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("barcode", value)
      .maybeSingle(); // FIX: safer than .single()

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

    // keep scanner ready
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  /* ================= HANDLE SCAN INPUT ================= */
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setBarcode(value);

    // many scanners send ENTER at end → auto trigger
    if (value.includes("\n") || value.length >= 6) {
      findProduct(value);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      findProduct();
    }
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

      {/* SCANNER */}
      <div style={styles.scanBox}>
        <input
          ref={inputRef}
          style={styles.input}
          placeholder="Scan barcode (scanner or camera input)"
          value={barcode}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          autoFocus
        />

        <button
          style={styles.scanBtn}
          onClick={() => findProduct()}
        >
          Add
        </button>
      </div>

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
    backgroundColor: "#0f0f10",
    minHeight: "100vh",
    color: "white",
    fontFamily: "Arial",
  },

  title: {
    marginBottom: 20,
  },

  scanBox: {
    display: "flex",
    gap: 10,
    marginBottom: 20,
  },

  input: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    border: "1px solid #333",
    backgroundColor: "#1a1a1a",
    color: "white",
  },

  scanBtn: {
    padding: "12px 16px",
    backgroundColor: "#3b82f6",
    border: "none",
    borderRadius: 10,
    color: "white",
    cursor: "pointer",
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