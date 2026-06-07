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
      {/* TOP BAR */}
      <div style={styles.top}>
        <button onClick={() => setOpen(true)} style={styles.burger}>
          ☰
        </button>
        <div style={styles.logo}>Ward POS</div>
      </div>

      {/* OVERLAY */}
      {open && (
        <div style={styles.overlay} onClick={() => setOpen(false)} />
      )}

      {/* DRAWER */}
      <div
        style={{
          ...styles.drawer,
          transform: open ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <button onClick={() => go("/")}>Home</button>
        <button onClick={() => go("/search")}>Search</button>
        <button onClick={() => go("/register")}>Register</button>
        <button onClick={() => go("/admin/add-product")}>
          Add Product
        </button>
      </div>
    </>
  );
}

const styles: any = {
  top: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    background: "#0b0f19",
    display: "flex",
    alignItems: "center",
    padding: "0 10px",
    zIndex: 1000,
  },

  burger: {
    fontSize: 22,
    background: "none",
    border: "none",
    color: "white",
  },

  logo: {
    marginLeft: 10,
    fontWeight: "bold",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 999,
  },

  drawer: {
    position: "fixed",
    top: 50,
    left: 0,
    width: 220,
    height: "100%",
    background: "#111827",
    padding: 10,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    zIndex: 1001,
    transition: "0.3s",
  },
};