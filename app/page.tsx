"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const cards = [
    { title: "Search Products", icon: "🔍", route: "/search" },
    { title: "Scan Barcode", icon: "📷", route: "/scan" },
    { title: "Register POS", icon: "🧾", route: "/register" },
    { title: "Add Product", icon: "➕", route: "/admin/add-product" },
    { title: "Dashboard", icon: "📊", route: "/dashboard" },
  ];

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Ward Cosmetics POS</h1>
      <p style={styles.subtitle}>Inventory & Sales System</p>

      <div style={styles.grid}>
        {cards.map((c) => (
          <div
            key={c.title}
            style={styles.card}
            onClick={() => router.push(c.route)}
          >
            <div style={styles.icon}>{c.icon}</div>
            <div style={styles.cardTitle}>{c.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: any = {
  page: {
    paddingTop: 60,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#94a3b8",
    marginBottom: 30,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 15,
  },

  card: {
    background: "#111827",
    padding: 20,
    borderRadius: 12,
    cursor: "pointer",
    border: "1px solid #1f2937",
    transition: "0.2s",
  },

  icon: {
    fontSize: 30,
    marginBottom: 10,
  },

  cardTitle: {
    fontSize: 14,
  },
};