"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SearchPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase.from("products").select("*");
    setProducts(data || []);
  }

  const filtered = products.filter((p) =>
    (p.name + p.brand + p.barcode).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h2>Search Products</h2>

      <input
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={styles.input}
      />

      <div style={styles.grid}>
        {filtered.map((p) => {
          const low = (p.stock_quantity || 0) <= 5;

          return (
            <div key={p.id} style={styles.card}>
              {p.image_url && <img src={p.image_url} style={styles.img} />}

              <div style={styles.barcode}>#{p.barcode}</div>

              <h3>{p.name}</h3>

              <p>{p.brand}</p>

              <p style={{ color: low ? "red" : "green" }}>
                Stock: {p.stock_quantity}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles: any = {
  input: {
    padding: 12,
    width: "100%",
    marginBottom: 15,
    borderRadius: 10,
    border: "1px solid #ddd",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: 12,
  },

  card: {
    background: "white",
    borderRadius: 14,
    padding: 12,
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
  },

  img: {
    width: "100%",
    height: 120,
    objectFit: "cover",
    borderRadius: 10,
  },

  barcode: {
    fontSize: 11,
    color: "#888",
    marginTop: 5,
  },
};