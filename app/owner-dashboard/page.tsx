"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function OwnerDashboard() {
  const [sales, setSales] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  useEffect(() => {
    const admin = localStorage.getItem("admin");

    if (!admin) {
      window.location.href = "/admin-login";
      return;
    }

    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [{ data: salesData }, { data: itemsData }, { data: productData }] =
      await Promise.all([
        supabase.from("sales").select("*"),
        supabase.from("sale_items").select("*"),
        supabase.from("products").select("*"),
      ]);

    setSales(salesData || []);
    setItems(itemsData || []);
    setProducts(productData || []);
    setLoading(false);
  }

  /* ================= FILTER ================= */

  const filteredSales = sales.filter((s) => {
    const d = new Date(s.created_at);

    const matchDay =
      selectedDate === "" ||
      d.toISOString().split("T")[0] === selectedDate;

    const matchMonth =
      selectedMonth === "" ||
      d.toISOString().slice(0, 7) === selectedMonth;

    return matchDay && matchMonth;
  });

  const saleIds = filteredSales.map((s) => s.id);

  const filteredItems = items.filter((i) =>
    saleIds.includes(i.sale_id)
  );

  const revenue = filteredSales.reduce(
    (sum, s) => sum + Number(s.total || 0),
    0
  );

  const itemsSold = filteredItems.reduce(
    (sum, i) => sum + (i.quantity || 0),
    0
  );

  /* ================= PRODUCT STATS ================= */

  const productStats = products
    .map((p) => {
      const related = filteredItems.filter(
        (i) => i.product_id === p.id
      );

      const qtySold = related.reduce(
        (sum, i) => sum + (i.quantity || 0),
        0
      );

      const revenue = related.reduce(
        (sum, i) =>
          sum + (i.quantity || 0) * Number(i.price || 0),
        0
      );

      return { ...p, qtySold, revenue };
    })
    .filter((p) => p.qtySold > 0)
    .sort((a, b) => b.qtySold - a.qtySold);

  const lowStock = products.filter(
    (p) => (p.stock_quantity || 0) <= 5
  );

  if (loading) {
    return <p style={{ color: "black" }}>Loading...</p>;
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>👑 Owner Dashboard</h1>

      {/* FILTERS */}
      <div style={styles.filters}>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={styles.input}
        />

        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={styles.input}
        />
      </div>

      {/* STATS */}
      <div style={styles.grid}>
        <div style={styles.card}>
          <h3 style={styles.text}>💰 Revenue</h3>
          <p style={styles.big}>{revenue.toFixed(2)}</p>
        </div>

        <div style={styles.card}>
          <h3 style={styles.text}>🧾 Sales</h3>
          <p style={styles.big}>{filteredSales.length}</p>
        </div>

        <div style={styles.card}>
          <h3 style={styles.text}>📦 Items Sold</h3>
          <p style={styles.big}>{itemsSold}</p>
        </div>
      </div>

      {/* PRODUCTS */}
      <h2 style={styles.section}>🛒 Product Performance</h2>

      <div style={styles.grid}>
        {productStats.map((p) => (
          <div key={p.id} style={styles.card}>
            <h3 style={styles.text}>{p.name}</h3>
            <p style={styles.text}>Qty: {p.qtySold}</p>
            <p style={styles.text}>
              Revenue: {p.revenue.toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      {/* LOW STOCK */}
      <h2 style={styles.section}>⚠️ Low Stock</h2>

      <div style={styles.grid}>
        {lowStock.map((p) => (
          <div key={p.id} style={styles.alertCard}>
            <h3 style={styles.text}>{p.name}</h3>
            <p style={styles.text}>
              Stock: {p.stock_quantity}
            </p>
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
    background: "#f2f3f8",
    minHeight: "100vh",
  },

  title: {
    color: "black",
    fontSize: 24,
    marginBottom: 20,
  },

  section: {
    marginTop: 20,
    color: "black",
  },

  filters: {
    display: "flex",
    gap: 10,
    marginBottom: 15,
  },

  input: {
    padding: 10,
    borderRadius: 10,
    border: "1px solid #ccc",
    color: "black",
    background: "white",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 12,
  },

  card: {
    background: "white",
    padding: 15,
    borderRadius: 12,
    color: "black", // ✅ IMPORTANT FIX
  },

  alertCard: {
    background: "#fee2e2",
    padding: 15,
    borderRadius: 12,
    color: "black", // ✅ IMPORTANT FIX
  },

  text: {
    color: "black",
  },

  big: {
    fontSize: 20,
    fontWeight: "bold",
    color: "black",
  },
};