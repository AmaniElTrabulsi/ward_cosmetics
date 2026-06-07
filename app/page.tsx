"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const cards = [
    {
      title: "Search Item",
      subtitle: "Find products quickly",
      emoji: "🔍",
      route: "/search",
    },
    {
      title: "Scan Item",
      subtitle: "Use camera barcode scanner",
      emoji: "📷",
      route: "/scan",
    },
    {
      title: "Add Product",
      subtitle: "Create new item in stock",
      emoji: "➕",
      route: "/admin/add-product",
    },
    {
      title: "Register (Kasse)",
      subtitle: "Checkout & sales",
      emoji: "🧾",
      route: "/register",
    },
    {
      title: "Dashboard",
      subtitle: "Stock & analytics",
      emoji: "📊",
      route: "/dashboard",
    },
  ];

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>Ward Cosmetics</h1>
        <p style={styles.subtitle}>Internal POS System</p>
      </div>

      {/* GRID */}
      <div style={styles.grid}>
        {cards.map((c) => (
          <div
            key={c.title}
            style={styles.card}
            onClick={() => router.push(c.route)}
          >
            <div style={styles.icon}>{c.emoji}</div>
            <h3 style={styles.cardTitle}>{c.title}</h3>
            <p style={styles.cardSubtitle}>{c.subtitle}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles: any = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#0f0f10",
    color: "white",
    padding: 20,
    fontFamily: "Arial",
  },

  header: {
    marginBottom: 20,
  },

  title: {
    fontSize: 26,
    margin: 0,
  },

  subtitle: {
    fontSize: 14,
    color: "#888",
    marginTop: 5,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 15,
  },

  card: {
    backgroundColor: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 16,
    padding: 18,
    cursor: "pointer",
    transition: "0.2s",
    textAlign: "center",
  },

  icon: {
    fontSize: 34,
    marginBottom: 10,
  },

  cardTitle: {
    fontSize: 15,
    margin: "5px 0",
  },

  cardSubtitle: {
    fontSize: 12,
    color: "#aaa",
  },
};