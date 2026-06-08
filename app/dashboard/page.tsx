"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD ALL DATA ================= */
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

  useEffect(() => {
    loadData();

    /* ================= REALTIME SUBSCRIPTION ================= */
    const channel = supabase
      .channel("dashboard-realtime")

      // SALES CHANGES
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sales" },
        () => {
          loadData();
        }
      )

      // SALE ITEMS CHANGES
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sale_items" },
        () => {
          loadData();
        }
      )

      // PRODUCT CHANGES (stock updates)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          loadData();
        }
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* ================= TODAY + MONTH ================= */
  const todayStr = new Date().toDateString();

  const todaySales = sales.filter(
    (s) => new Date(s.created_at).toDateString() === todayStr
  );

  const todayRevenue = todaySales.reduce(
    (sum, s) => sum + Number(s.total || 0),
    0
  );

  const totalRevenue = sales.reduce(
    (sum, s) => sum + Number(s.total || 0),
    0
  );

  /* ================= PRODUCT ANALYTICS ================= */
  const productStats = products.map((p) => {
    const related = items.filter((i) => i.product_id === p.id);

    const qtySold = related.reduce(
      (sum, i) => sum + (i.quantity || 0),
      0
    );

    const revenue = related.reduce(
      (sum, i) => sum + (i.quantity || 0) * Number(i.price || 0),
      0
    );

    return { ...p, qtySold, revenue };
  });

  const bestSelling = [...productStats].sort(
    (a, b) => b.qtySold - a.qtySold
  );

  const topRevenue = [...productStats].sort(
    (a, b) => b.revenue - a.revenue
  );

  const lowStock = products.filter(
    (p) => (p.stock_quantity || 0) <= 5
  );

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>📊 LIVE Dashboard</h1>

      {loading && <p>Loading...</p>}

      {/* ================= SUMMARY ================= */}
      <div style={styles.grid}>
        <div style={styles.card}>
          <h3>💰 Today Revenue</h3>
          <p style={styles.big}>${todayRevenue.toFixed(2)}</p>
        </div>

        <div style={styles.card}>
          <h3>💰 Total Revenue</h3>
          <p style={styles.big}>${totalRevenue.toFixed(2)}</p>
        </div>

        <div style={styles.card}>
          <h3>🧾 Sales</h3>
          <p style={styles.big}>{sales.length}</p>
        </div>

        <div style={styles.card}>
          <h3>📦 Items Sold</h3>
          <p style={styles.big}>
            {items.reduce((s, i) => s + (i.quantity || 0), 0)}
          </p>
        </div>
      </div>

      {/* ================= BEST SELLERS ================= */}
      <h2 style={styles.section}>🥇 Best Selling</h2>

      <div style={styles.grid}>
        {bestSelling.slice(0, 5).map((p) => (
          <div key={p.id} style={styles.card}>
            <h3 style={{ color: "black" }}>{p.name}</h3>
            <p>Sold: {p.qtySold}</p>
          </div>
        ))}
      </div>

      {/* ================= TOP REVENUE ================= */}
      <h2 style={styles.section}>💰 Top Revenue</h2>

      <div style={styles.grid}>
        {topRevenue.slice(0, 5).map((p) => (
          <div key={p.id} style={styles.card}>
            <h3 style={{ color: "black" }}>{p.name}</h3>
            <p>${p.revenue.toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* ================= LOW STOCK ================= */}
      <h2 style={styles.section}>⚠️ Low Stock</h2>

      <div style={styles.grid}>
        {lowStock.map((p) => (
          <div key={p.id} style={styles.alertCard}>
            <h3 style={{ color: "black" }}>{p.name}</h3>
            <p>Stock: {p.stock_quantity}</p>
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
    paddingTop: 50,
    background: "#f2f3f8",
    minHeight: "100vh",
  },

  title: {
    color: "black",
    fontSize: 24,
    marginBottom: 20,
  },

  section: {
    marginTop: 25,
    color: "black",
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
    boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
    color:"black",
  },

  alertCard: {
    background: "#fee2e2",
    padding: 15,
    borderRadius: 12,
  },

  big: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
};