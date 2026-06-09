"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const cards = [
    { title: "Search", icon: "🔍", route: "/search", color: "#6366f1" },
    { title: "Scan", icon: "📷", route: "/scan", color: "#06b6d4" },
    { title: "Register", icon: "🧾", route: "/register", color: "#10b981" },
    { title: "Add Product", icon: "➕", route: "/admin/add-product", color: "#f59e0b" },
    { title: "Dashboard", icon: "📊", route: "/dashboard", color: "#ef4444" },
    { title: "Admin-Login", icon: "📊", route: "/admin-login", color: "#97cd19" },
  ];

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Ward Cosmetics</h1>

      <div style={styles.grid}>
        {cards.map((c) => (
          <div
            key={c.title}
            style={{ ...styles.card, borderTop: `4px solid ${c.color}` }}
            onClick={() => router.push(c.route)}
          >
            <div style={{ ...styles.icon, color: c.color }}>{c.icon}</div>
            <h3>{c.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: any = {
  page: {
    padding: 10,
  },

  title: {
    fontSize: 32,
    marginBottom: 5,
    paddingTop: 40,
    color:"black",
  },

  subtitle: {
    color: "#0b0b0b",
    marginBottom: 20,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: 15,
  },

  card: {
    background: "white",
    borderRadius: 16,
    padding: 20,
    cursor: "pointer",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    transition: "0.2s",
    color:"black",
  },

  icon: {
    fontSize: 28,
    marginBottom: 10,
  },
};