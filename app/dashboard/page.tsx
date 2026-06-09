"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sales" },
        () => loadData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sale_items" },
        () => loadData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* ================= TODAY ================= */

  const todayStr = new Date().toDateString();

  const todaySales = sales.filter(
    (s) => new Date(s.created_at).toDateString() === todayStr
  );

  const todayRevenue = todaySales.reduce(
    (sum, s) => sum + Number(s.total || 0),
    0
  );

  const todaySaleIds = todaySales.map((s) => s.id);

  const todayItems = items.filter((i) =>
    todaySaleIds.includes(i.sale_id)
  );

  const todayItemsSold = todayItems.reduce(
    (sum, i) => sum + (i.quantity || 0),
    0
  );

  /* ================= PRODUCTS SOLD TODAY ================= */

  const productsSoldToday = products
    .map((p) => {
      const related = todayItems.filter(
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

      return {
        ...p,
        qtySold,
        revenue,
      };
    })
    .filter((p) => p.qtySold > 0)
    .sort((a, b) => b.qtySold - a.qtySold);

  /* ================= LOW STOCK ================= */

  const lowStock = products.filter(
    (p) => (p.stock_quantity || 0) <= 5
  );

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>📊 Dashboard</h1>

      {loading && <p>Loading...</p>}

      {/* SUMMARY */}
      <div style={styles.grid}>
        <div style={styles.card}>
          <h3>💰 Today Revenue</h3>
          <p style={styles.big}>
            ${todayRevenue.toFixed(2)}
          </p>
        </div>

        <div style={styles.card}>
          <h3>🧾 Today's Sales</h3>
          <p style={styles.big}>
            {todaySales.length}
          </p>
        </div>

        <div style={styles.card}>
          <h3>📦 Items Sold Today</h3>
          <p style={styles.big}>
            {todayItemsSold}
          </p>
        </div>

        <div style={styles.card}>
          <h3>🛒 Products Sold</h3>
          <p style={styles.big}>
            {productsSoldToday.length}
          </p>
        </div>
      </div>

      {/* PRODUCTS SOLD TODAY */}

      <h2 style={styles.section}>
        🛒 Products Sold Today
      </h2>

      <div style={styles.grid}>
        {productsSoldToday.map((p) => (
          <div key={p.id} style={styles.card}>
            <h3 style={{ color: "black" }}>
              {p.name}
            </h3>

            <p style={{ color: "black" }}>
              Qty Sold: {p.qtySold}
            </p>

            <p style={{ color: "black" }}>
              Revenue: ${p.revenue.toFixed(2)}
            </p>
          </div>
        ))}

        {productsSoldToday.length === 0 && (
          <div style={styles.card}>
            <p style={{ color: "black" }}>
              No products sold today
            </p>
          </div>
        )}
      </div>

      {/* LOW STOCK */}

      <h2 style={styles.section}>
        ⚠️ Low Stock Alerts
      </h2>

      <div style={styles.grid}>
        {lowStock.map((p) => (
          <div key={p.id} style={styles.alertCard}>
            <h3 style={{ color: "black" }}>
              {p.name}
            </h3>

            <p style={{ color: "black" }}>
              Stock: {p.stock_quantity}
            </p>
          </div>
        ))}

        {lowStock.length === 0 && (
          <div style={styles.card}>
            <p style={{ color: "black" }}>
              No low stock products
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

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
    paddingTop: 50,
  },

  section: {
    marginTop: 25,
    marginBottom: 10,
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
    color: "black",
  },

  alertCard: {
    background: "#fee2e2",
    padding: 15,
    borderRadius: 12,
  },

  big: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 10,
  },
};