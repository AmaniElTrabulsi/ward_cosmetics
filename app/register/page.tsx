"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  /* ================= SCAN / SEARCH PRODUCT ================= */
  async function findProduct() {
    if (!barcode) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("barcode", barcode)
      .single();

    if (error || !data) {
      alert("Product not found");
      setLoading(false);
      return;
    }

    // check if already in cart
    const existing = cart.find((i) => i.id === data.id);

    if (existing) {
      setCart(
        cart.map((i) =>
          i.id === data.id
            ? { ...i, qty: i.qty + 1 }
            : i
        )
      );
    } else {
      setCart([...cart, { ...data, qty: 1 }]);
    }

    setBarcode("");
    setLoading(false);
  }

  /* ================= REMOVE ITEM ================= */
  function removeItem(id: string) {
    setCart(cart.filter((i) => i.id !== id));
  }

  /* ================= UPDATE QTY ================= */
  function updateQty(id: string, qty: number) {
    setCart(
      cart.map((i) =>
        i.id === id ? { ...i, qty: Math.max(1, qty) } : i
      )
    );
  }

  /* ================= TOTAL ================= */
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
        // reduce stock
        const newStock =
          (item.stock_quantity || 0) - item.qty;

        await supabase
          .from("products")
          .update({ stock_quantity: newStock })
          .eq("id", item.id);
      }

      alert("Checkout successful!");

      setCart([]);
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

      {/* SCAN INPUT */}
      <div style={styles.scanBox}>
        <input
          style={styles.input}
          placeholder="Scan / Enter barcode"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
        />

        <button
          style={styles.scanBtn}
          onClick={findProduct}
          disabled={loading}
        >
          {loading ? "Searching..." : "Add"}
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
              <button
                onClick={() =>
                  updateQty(item.id, item.qty - 1)
                }
              >
                -
              </button>

              <span>{item.qty}</span>

              <button
                onClick={() =>
                  updateQty(item.id, item.qty + 1)
                }
              >
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
    marginBottom: 20,
  },

  cartItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
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
    cursor: "pointer",
  },

  totalBox: {
    textAlign: "center",
  },

  checkoutBtn: {
    marginTop: 10,
    padding: 15,
    width: "100%",
    backgroundColor: "#4ade80",
    border: "none",
    borderRadius: 10,
    fontWeight: "bold",
    cursor: "pointer",
  },
};