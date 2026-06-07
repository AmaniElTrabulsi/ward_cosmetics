"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const go = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  return (
    <>
      {/* BURGER BUTTON */}
      <button style={styles.burger} onClick={() => setOpen(!open)}>
        ☰
      </button>

      {/* OVERLAY */}
      {open && <div style={styles.overlay} onClick={() => setOpen(false)} />}

      {/* SIDEBAR */}
      <div style={{ ...styles.sidebar, left: open ? 0 : -260 }}>
        <h3 style={{ marginBottom: 20, color: "black" }}>Menu</h3>

        <button style={styles.link} onClick={() => go("/")}>Home</button>
        <button style={styles.link} onClick={() => go("/search")}>Search</button>
        <button style={styles.link} onClick={() => go("/register")}>Register</button>
        <button style={styles.link} onClick={() => go("/admin/add-product")}>
          Add Product
        </button>
      </div>
    </>
  );
}

const styles: any = {
  burger: {
    position: "fixed",
    top: 15,
    left: 15,
    fontSize: 22,
    background: "white",
    border: "1px solid #080808",
    borderRadius: 10,
    padding: "6px 10px",
    zIndex: 1001,
    color:"black",
  },

  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.3)",
    zIndex: 1000,
  },

  sidebar: {
    position: "fixed",
    top: 0,
    left: 0,
    width: 260,
    height: "100vh",
    background: "white",
    boxShadow: "2px 0 10px rgba(11, 10, 10, 0.77)",
    padding: 20,
    transition: "0.25s",
    zIndex: 1002,
  },

  link: {
    display: "block",
    width: "100%",
    padding: 12,
    marginBottom: 10,
    border: "none",
    background: "#a5a5ad",
    borderRadius: 10,
    textAlign: "left",
    color: "black",
  },
};