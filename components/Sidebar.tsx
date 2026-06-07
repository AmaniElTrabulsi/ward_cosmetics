"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const menu = [
    { name: "Home", path: "/" },
    { name: "Search", path: "/search" },
    { name: "Register", path: "/register" },
    { name: "Add Product", path: "/admin/add-product" },
  ];

  return (
    <>
      {/* BURGER BUTTON */}
      <button style={styles.burger} onClick={() => setOpen(true)}>
        ☰
      </button>

      {/* OVERLAY */}
      {open && (
        <div style={styles.overlay} onClick={() => setOpen(false)}>
          <div style={styles.sidebar} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 20 }}>Menu</h3>

            {menu.map((item) => (
              <div
                key={item.path}
                style={styles.item}
                onClick={() => {
                  router.push(item.path);
                  setOpen(false);
                }}
              >
                {item.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

const styles: any = {
  burger: {
    position: "fixed",
    top: 15,
    left: 15,
    fontSize: 26,
    background: "transparent",
    border: "none",
    color: "white",
    zIndex: 1000,
  },

  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 999,
  },

  sidebar: {
    width: 250,
    height: "100%",
    backgroundColor: "#111",
    padding: 20,
  },

  item: {
    padding: 10,
    cursor: "pointer",
    borderBottom: "1px solid #333",
  },
};