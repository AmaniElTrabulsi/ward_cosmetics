"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SearchPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");

    if (error) {
      console.log(error);
    }

    setProducts(data || []);
    setLoading(false);
  }

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      (p.serial_number || "").toLowerCase().includes(q)
    );
  });

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <h1 style={styles.title}>Search Products</h1>

      {/* SEARCH BAR */}
      <input
        style={styles.search}
        placeholder="Search by name, brand, serial..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <p style={styles.info}>
        Showing {filtered.length} / {products.length}
      </p>

      {/* LOADING */}
      {loading && <p>Loading products...</p>}

      {/* PRODUCT GRID */}
      <div style={styles.grid}>
        {filtered.map((p) => (
          <div key={p.id} style={styles.card}>
            {p.image_url && (
              <img src={p.image_url} style={styles.image} />
            )}

            <h3 style={styles.name}>{p.name}</h3>

            <p style={styles.text}>Brand: {p.brand}</p>
            <p style={styles.text}>Price: ${p.price}</p>
            <p
  style={{
    ...styles.text,
    color: (p.stock_quantity || 0) <= 5 ? "red" : "#aaa",
    fontWeight: (p.stock_quantity || 0) <= 5 ? "bold" : "normal",
  }}
>
  Stock: {p.stock_quantity}
</p>

            {p.serial_number && (
              <p style={styles.serial}>
                SN: {p.serial_number}
              </p>
            )}
          </div>
        ))}
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
    marginBottom: 15,
  },

  search: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "1px solid #333",
    backgroundColor: "#1a1a1a",
    color: "white",
    marginBottom: 10,
  },

  info: {
    color: "#888",
    fontSize: 12,
    marginBottom: 15,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 12,
  },

  card: {
    backgroundColor: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 14,
    padding: 10,
  },

  image: {
    width: "100%",
    height: 120,
    objectFit: "cover",
    borderRadius: 10,
    marginBottom: 8,
  },

  name: {
    fontSize: 14,
    margin: "5px 0",
  },

  text: {
    fontSize: 12,
    color: "#aaa",
    margin: "2px 0",
  },

  serial: {
    fontSize: 11,
    color: "#666",
    marginTop: 5,
  },
};