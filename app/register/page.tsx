"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Register() {
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState<any[]>([]);

  async function add() {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("barcode", barcode)
      .single();

    if (!data) return;

    setCart((prev) => {
      const found = prev.find((i) => i.id === data.id);

      if (found) {
        return prev.map((i) =>
          i.id === data.id ? { ...i, qty: i.qty + 1 } : i
        );
      }

      return [...prev, { ...data, qty: 1 }];
    });

    setBarcode("");
  }

  async function checkout() {
    for (const item of cart) {
      await supabase
        .from("products")
        .update({
          stock_quantity: item.stock_quantity - item.qty,
        })
        .eq("id", item.id);
    }

    setCart([]);
    alert("Done");
  }

  return (
    <div>
      <h2>Register</h2>

      <div style={styles.row}>
        <input
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          style={styles.input}
          placeholder="Scan barcode"
        />

        <button onClick={add} style={styles.btn}>
          Add
        </button>
      </div>

      {cart.map((i) => (
        <div key={i.id} style={styles.item}>
          {i.name} x {i.qty}
        </div>
      ))}

      <button onClick={checkout} style={styles.checkout}>
        Checkout
      </button>
    </div>
  );
}

const styles: any = {
  row: { display: "flex", gap: 10 },

  input: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    border: "1px solid #ddd",
  },

  btn: {
    padding: "12px 16px",
    background: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: 10,
  },

  item: {
    padding: 10,
    background: "#f1f5f9",
    marginTop: 8,
    borderRadius: 10,
  },

  checkout: {
    marginTop: 15,
    width: "100%",
    padding: 15,
    background: "#10b981",
    color: "white",
    border: "none",
    borderRadius: 12,
  },
};