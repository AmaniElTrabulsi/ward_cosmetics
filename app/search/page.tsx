"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SearchPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // MODAL STATE
  const [editOpen, setEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // EDIT FIELDS
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editBarcode, setEditBarcode] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");

    if (error) console.log(error);

    setProducts(data || []);
    setLoading(false);
  }

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      (p.barcode || "").toLowerCase().includes(q) ||
      (p.serial_number || "").toLowerCase().includes(q)
    );
  });

  /* ================= OPEN EDIT MODAL ================= */
  function openEdit(p: any) {
    setSelectedProduct(p);

    setEditName(p.name || "");
    setEditPrice(p.price || "");
    setEditStock(p.stock_quantity || "");
    setEditBarcode(p.barcode || "");

    setEditOpen(true);
  }

  /* ================= SAVE EDIT ================= */
  async function saveEdit() {
    if (!selectedProduct) return;

    const { error } = await supabase
      .from("products")
      .update({
        name: editName,
        price: Number(editPrice),
        stock_quantity: Number(editStock),
        barcode: editBarcode,
      })
      .eq("id", selectedProduct.id);

    if (error) {
      alert("Update failed");
      return;
    }

    setEditOpen(false);
    setSelectedProduct(null);
    loadProducts();
  }

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <h1 style={styles.title}>🔍 Search Products</h1>

      {/* SEARCH */}
      <input
        style={styles.search}
        placeholder="Search by name, brand, barcode..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <p style={styles.info}>
        Showing {filtered.length} / {products.length}
      </p>

      {loading && <p style={{ color: "#888" }}>Loading products...</p>}

      {/* GRID */}
      <div style={styles.grid}>
        {filtered.map((p) => {
          const lowStock = (p.stock_quantity || 0) <= 5;

          return (
            <div key={p.id} style={styles.card}>
              {/* IMAGE */}
              {p.image_url && (
                <img src={p.image_url} style={styles.image} />
              )}

              {/* BARCODE */}
              {p.barcode && (
                <p style={styles.barcode}>Barcode: {p.barcode}</p>
              )}

              {/* INFO */}
              <h3 style={styles.name}>{p.name}</h3>

              <p style={styles.text}>Brand: {p.brand}</p>
              <p style={styles.text}>Price: ${p.price}</p>

              <p
                style={{
                  ...styles.text,
                  color: lowStock ? "red" : "#aaa",
                  fontWeight: lowStock ? "bold" : "normal",
                }}
              >
                Stock: {p.stock_quantity}
              </p>

              {p.serial_number && (
                <p style={styles.serial}>SN: {p.serial_number}</p>
              )}

              {/* ACTIONS */}
              <div style={styles.actions}>
                <button
                  style={styles.editBtn}
                  onClick={() => openEdit(p)}
                >
                  ✏️ Edit
                </button>

                <button
                  style={styles.deleteBtn}
                  onClick={async () => {
                    const ok = confirm("Delete this product?");
                    if (!ok) return;

                    await supabase
                      .from("products")
                      .delete()
                      .eq("id", p.id);

                    loadProducts();
                  }}
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= EDIT MODAL ================= */}
      {editOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={{ marginBottom: 10 }}>Edit Product</h2>

            <input
              style={styles.input}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Name"
            />

            <input
              style={styles.input}
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              placeholder="Price"
              type="number"
            />

            <input
              style={styles.input}
              value={editStock}
              onChange={(e) => setEditStock(e.target.value)}
              placeholder="Stock"
              type="number"
            />

            <input
              style={styles.input}
              value={editBarcode}
              onChange={(e) => setEditBarcode(e.target.value)}
              placeholder="Barcode"
            />

            <div style={styles.modalActions}>
              <button style={styles.saveBtn} onClick={saveEdit}>
                Save
              </button>

              <button
                style={styles.cancelBtn}
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */

const styles: any = {
  page: {
    padding: 20,
    backgroundColor: "#0f0f10",
    minHeight: "100vh",
    color: "white",
    fontFamily: "Arial",
  },

  title: {
    marginBottom: 15,
  },

  search: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "1px solid #333",
    backgroundColor: "#1a1a1a",
    color: "white",
    marginBottom: 10,
  },

  info: {
    color: "#888",
    fontSize: 12,
    marginBottom: 15,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 12,
  },

  card: {
    backgroundColor: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 14,
    padding: 10,
  },

  image: {
    width: "100%",
    height: 120,
    objectFit: "cover",
    borderRadius: 10,
    marginBottom: 6,
  },

  barcode: {
    fontSize: 11,
    color: "#888",
    marginBottom: 6,
  },

  name: {
    fontSize: 14,
    margin: "5px 0",
  },

  text: {
    fontSize: 12,
    color: "#aaa",
    margin: "2px 0",
  },

  serial: {
    fontSize: 11,
    color: "#666",
    marginTop: 5,
  },

  actions: {
    display: "flex",
    gap: 8,
    marginTop: 10,
  },

  editBtn: {
    flex: 1,
    padding: "6px 8px",
    backgroundColor: "#3b82f6",
    border: "none",
    color: "white",
    borderRadius: 8,
    fontSize: 12,
    cursor: "pointer",
  },

  deleteBtn: {
    flex: 1,
    padding: "6px 8px",
    backgroundColor: "#ef4444",
    border: "none",
    color: "white",
    borderRadius: 8,
    fontSize: 12,
    cursor: "pointer",
  },

  /* MODAL */
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  modal: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#1a1a1a",
    padding: 20,
    borderRadius: 12,
    border: "1px solid #333",
  },

  input: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    border: "1px solid #333",
    backgroundColor: "#0f0f10",
    color: "white",
  },

  modalActions: {
    display: "flex",
    gap: 10,
  },

  saveBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: "#4ade80",
    border: "none",
    borderRadius: 8,
    fontWeight: "bold",
  },

  cancelBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: "#ef4444",
    border: "none",
    borderRadius: 8,
    color: "white",
  },
};