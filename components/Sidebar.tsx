"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Home", href: "/", icon: "🏠" },
    { name: "Search", href: "/search", icon: "🔍" },
    { name: "Scan", href: "/scan", icon: "📷" },
    { name: "Register", href: "/register", icon: "🧾" },
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "Add Product", href: "/admin/add-product", icon: "➕" },
  ];

  return (
    <div style={styles.sidebar}>
      <h2 style={styles.logo}>Ward POS</h2>

      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          style={{
            ...styles.link,
            backgroundColor: pathname === l.href ? "#2d3748" : "transparent",
          }}
        >
          <span>{l.icon}</span>
          <span>{l.name}</span>
        </Link>
      ))}
    </div>
  );
}

const styles: any = {
  sidebar: {
    width: 220,
    backgroundColor: "#111827",
    borderRight: "1px solid #2d3748",
    padding: 20,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  logo: {
    marginBottom: 20,
    color: "white",
  },

  link: {
    display: "flex",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    textDecoration: "none",
    color: "white",
    alignItems: "center",
  },
};