"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const items = [
    { label: "Home", route: "/" },
    { label: "Search", route: "/search" },
    { label: "Register", route: "/register" },
    { label: "Add Product", route: "/admin/add-product" },
    { label: "Dashboard", route: "/dashboard" },
  ];

  return (
    <>
      {/* TOP BAR */}
      <div style={styles.topBar}>
        <button onClick={() => setOpen(!open)} style={styles.burger}>
          ☰
        </button>

        <h3 style={styles.logo}>Ward POS</h3>
      </div>

      {/* OVERLAY */}
      {open && <div style={styles.overlay} onClick={() => setOpen(false)} />}

      {/* SIDEBAR */}
      <div style={{ ...styles.sidebar, left: open ? 0 : -260 }}>
        {items.map((i) => (
          <div
            key={i.route}
            style={styles.item}
            onClick={() => {
              router.push(i.route);
              setOpen(false);
            }}
          >
            {i.label}
          </div>
        ))}
      </div>
    </>
  );
}

const styles: any = {
  topBar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: 55,
    background: "white",
    display: "flex",
    alignItems: "center",
    padding: "0 15px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
    zIndex: 1000,
  },

  burger: {
    fontSize: 22,
    background: "none",
    border: "none",
    cursor: "pointer",
  },

  logo: {
    marginLeft: 10,
    fontWeight: "bold",
  },

  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.3)",
    zIndex: 999,
  },

  sidebar: {
    position: "fixed",
    top: 0,
    left: -260,
    width: 260,
    height: "100vh",
    background: "#111827",
    color: "white",
    paddingTop: 70,
    transition: "0.3s",
    zIndex: 1001,
  },

  item: {
    padding: 15,
    cursor: "pointer",
    borderBottom: "1px solid #1f2937",
  },
};