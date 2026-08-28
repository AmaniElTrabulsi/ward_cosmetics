"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import EmployeeGuard from "@/components/EmployeeGuard";

export default function DashboardPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);

    const [
      { data: salesData },
      { data: itemsData },
      { data: productData },
    ] = await Promise.all([
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
      .channel("employee-dashboard")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sales",
        },
        loadData
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sale_items",
        },
        loadData
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        loadData
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const today = new Date().toDateString();

  const todaySales = sales.filter(
    (sale) =>
      new Date(sale.created_at).toDateString() === today
  );

  const todayRevenue = todaySales.reduce(
    (sum, sale) => sum + Number(sale.total || 0),
    0
  );

  const todayIds = todaySales.map((sale) => sale.id);

  const todayItems = items.filter((item) =>
    todayIds.includes(item.sale_id)
  );

  const itemsSold = todayItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const productsSold = products
    .map((product) => {
      const related = todayItems.filter(
        (item) => item.product_id === product.id
      );

      const quantity = related.reduce(
        (sum, item) =>
          sum + Number(item.quantity || 0),
        0
      );

      return {
        ...product,
        quantity,
      };
    })
    .filter((product) => product.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity);

  const lowStock = products.filter(
    (product) =>
      Number(product.stock_quantity || 0) <= 5
  );

  return (
    <EmployeeGuard>
      <div style={styles.page}>
        <div style={styles.header}>
          <div>
            <div style={styles.eyebrow}>STORE OVERVIEW</div>
            <h1 style={styles.title}>Dashboard</h1>
          </div>

          <div style={styles.live}>
            <span style={styles.dot} />
            Live
          </div>
        </div>

        {loading && (
          <p style={styles.loading}>Loading...</p>
        )}

        <div style={styles.grid}>
          <div style={styles.card}>
            <div style={styles.cardIcon}>💰</div>
            <div style={styles.label}>Today's Revenue</div>
            <div style={styles.number}>
              ${todayRevenue.toFixed(2)}
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardIcon}>🧾</div>
            <div style={styles.label}>Today's Sales</div>
            <div style={styles.number}>
              {todaySales.length}
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardIcon}>📦</div>
            <div style={styles.label}>Items Sold</div>
            <div style={styles.number}>
              {itemsSold}
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardIcon}>🛒</div>
            <div style={styles.label}>Products Sold</div>
            <div style={styles.number}>
              {productsSold.length}
            </div>
          </div>
        </div>

        <h2 style={styles.section}>
          🛒 Today's Products
        </h2>

        <div style={styles.list}>
          {productsSold.length === 0 && (
            <div style={styles.empty}>
              No products sold today.
            </div>
          )}

          {productsSold.map((product) => (
            <div
              key={product.id}
              style={styles.productRow}
            >
              <div>
                <strong style={styles.productName}>
                  {product.name}
                </strong>

                <div style={styles.small}>
                  {product.brand}
                </div>
              </div>

              <div style={styles.quantity}>
                ×{product.quantity}
              </div>
            </div>
          ))}
        </div>

        <h2 style={styles.section}>
          ⚠️ Low Stock
        </h2>

        <div style={styles.list}>
          {lowStock.length === 0 && (
            <div style={styles.empty}>
              All products have sufficient stock.
            </div>
          )}

          {lowStock.map((product) => (
            <div
              key={product.id}
              style={styles.lowStockRow}
            >
              <div>
                <strong style={styles.productName}>
                  {product.name}
                </strong>
              </div>

              <div style={styles.lowStockBadge}>
                {product.stock_quantity} left
              </div>
            </div>
          ))}
        </div>
      </div>
    </EmployeeGuard>
  );
}

const styles: any = {
  page: {
    padding: 20,
    paddingTop: 45,
    minHeight: "100vh",
    background: "#f5f7fb",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },

  eyebrow: {
    fontSize: 11,
    color: "#6366f1",
    fontWeight: 700,
    letterSpacing: 1,
  },

  title: {
    margin: "4px 0",
    fontSize: 28,
    color: "#111827",
  },

  live: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#dcfce7",
    color: "#166534",
    padding: "7px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#22c55e",
  },

  loading: {
    color: "#6b7280",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },

  card: {
    background: "white",
    borderRadius: 17,
    padding: 16,
    boxShadow: "0 5px 18px rgba(0,0,0,0.05)",
  },

  cardIcon: {
    fontSize: 22,
    marginBottom: 10,
  },

  label: {
    color: "#6b7280",
    fontSize: 11,
  },

  number: {
    color: "#111827",
    fontSize: 23,
    fontWeight: 800,
    marginTop: 4,
  },

  section: {
    color: "#111827",
    fontSize: 19,
    marginTop: 28,
    marginBottom: 10,
  },

  list: {
    background: "white",
    borderRadius: 16,
    padding: "4px 15px",
  },

  productRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 0",
    borderBottom: "1px solid #eee",
  },

  productName: {
    color: "#111827",
  },

  small: {
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 3,
  },

  quantity: {
    background: "#eef2ff",
    color: "#4f46e5",
    padding: "6px 10px",
    borderRadius: 9,
    fontWeight: 700,
  },

  empty: {
    padding: 20,
    textAlign: "center",
    color: "#6b7280",
  },

  lowStockRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 0",
    borderBottom: "1px solid #eee",
  },

  lowStockBadge: {
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "6px 10px",
    borderRadius: 9,
    fontWeight: 700,
    fontSize: 12,
  },
};