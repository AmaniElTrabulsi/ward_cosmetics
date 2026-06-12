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
    { title: "Admin Login", icon: "🔐", route: "/admin-login", color: "#a3e635" },
  ];

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Ward Cosmetics</h1>
      <p style={styles.subtitle}>Inventory & Admin Panel</p>

      <div style={styles.grid}>
        {cards.map((c) => (
          <div
            key={c.title}
            style={{
              ...styles.card,
              borderTop: `4px solid ${c.color}`,
            }}
            onClick={() => router.push(c.route)}
          >
            <div style={{ ...styles.iconWrap, background: `${c.color}15` }}>
              <div style={{ ...styles.icon, color: c.color }}>
                {c.icon}
              </div>
            </div>

            <h3 style={styles.cardTitle}>{c.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: any = {
  page: {
    padding: 16,
    paddingTop: 50,
    background: "#f2f3f8",
    minHeight: "100vh",
  },

  title: {
    fontSize: 30,
    fontWeight: 800,
    marginBottom: 4,
    color: "#111827",
  },

  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 18,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 14,
  },

  card: {
    background: "white",
    borderRadius: 18,
    padding: 18,
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
    transition: "all 0.2s ease",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    textAlign: "center",
  },

  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  icon: {
    fontSize: 24,
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#111827",
  },
};