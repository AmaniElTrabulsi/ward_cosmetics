"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SearchPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [editProduct, setEditProduct] = useState<any | null>(null);
  const [form, setForm] = useState<any>({});

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
      (p.barcode || "").toLowerCase().includes(q)
    );
  });

  async function deleteProduct(id: string) {
    const ok = confirm("Delete this product?");
    if (!ok) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Delete failed");
      return;
    }

    loadProducts();
  }

  function openEdit(product: any) {
    setEditProduct(product);
    setForm({
      name: product.name,
      brand: product.brand,
      price: product.price,
      stock_quantity: product.stock_quantity,
      barcode: product.barcode,
    });
  }

  async function saveEdit() {
    if (!editProduct) return;

    const { error } = await supabase
      .from("products")
      .update({
        name: form.name,
        brand: form.brand,
        price: Number(form.price),
        stock_quantity: Number(form.stock_quantity),
        barcode: form.barcode,
      })
      .eq("id", editProduct.id);

    if (error) {
      alert("Update failed");
      return;
    }

    setEditProduct(null);
    loadProducts();
  }

  return (
    <div style={styles.page}>
      <h1 style={{ color: "black", fontSize: 20 }}>🔍 Products</h1>

      <input
        style={styles.search}
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <p>Loading...</p>}

      <div style={styles.grid}>
        {filtered.map((p) => (
          <div key={p.id} style={styles.card}>
            {p.image_url && (
              <img src={p.image_url} style={styles.image} />
            )}

            <h3 style={{ color: "black", fontSize: 16 }}>
              {p.name}
            </h3>

            <p style={styles.text}>Brand: {p.brand}</p>
            <p style={styles.text}>Price: ${p.price}</p>

            <p
              style={{
                display: "inline-block",
                padding: "3px 8px",
                borderRadius: 6,
                fontSize: 12,
                background:
                  p.stock_quantity <= 3 ? "#fee2e2" : "#f3f4f6",
                color:
                  p.stock_quantity <= 3 ? "#b91c1c" : "#111827",
                fontWeight: 600,
              }}
            >
              Stock: {p.stock_quantity}
            </p>

            {p.barcode && (
              <p style={styles.barcode}>
                Barcode: {p.barcode}
              </p>
            )}

            <div style={styles.actions}>
              <button
                style={styles.editBtn}
                onClick={() => openEdit(p)}
              >
                ✏️ Edit
              </button>

              <button
                style={styles.deleteBtn}
                onClick={() => deleteProduct(p.id)}
              >
                🗑 Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* EDIT MODAL */}
      {editProduct && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={{ color: "black" }}>Edit Product</h2>

            <input
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              placeholder="Name"
              style={styles.input}
            />

            <input
              value={form.brand}
              onChange={(e) =>
                setForm({ ...form, brand: e.target.value })
              }
              placeholder="Brand"
              style={styles.input}
            />

            <input
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: e.target.value })
              }
              placeholder="Price"
              style={styles.input}
            />

            <input
              value={form.stock_quantity}
              onChange={(e) =>
                setForm({
                  ...form,
                  stock_quantity: e.target.value,
                })
              }
              placeholder="Stock"
              style={styles.input}
            />

            <input
              value={form.barcode}
              onChange={(e) =>
                setForm({ ...form, barcode: e.target.value })
              }
              placeholder="Barcode"
              style={styles.input}
            />

            <div style={styles.modalActions}>
              <button
                onClick={() => setEditProduct(null)}
                style={styles.cancelBtn}
              >
                Cancel
              </button>

              <button onClick={saveEdit} style={styles.saveBtn}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: any = {
  page: {
    padding: 20,
    paddingTop: 50,
    background: "#f2f3f8",
    minHeight: "100vh",
  },

  search: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "1px solid #040404",
    marginBottom: 15,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 12,
  },

  card: {
    background: "white",
    borderRadius: 14,
    padding: 12,
    boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  image: {
    width: "100%",
    height: 120,
    objectFit: "cover",
    borderRadius: 10,
  },

  text: {
    fontSize: 12,
    color: "#242323",
  },

  barcode: {
    fontSize: 11,
    color: "#888",
  },

  actions: {
    display: "flex",
    gap: 8,
    marginTop: 10,
  },

  editBtn: {
    flex: 1,
    padding: 8,
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: 8,
  },

  deleteBtn: {
    flex: 1,
    padding: 8,
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: 8,
  },

  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(153, 149, 149, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  modal: {
    background: "white",
    padding: 20,
    borderRadius: 12,
    width: 300,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  input: {
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ddd",
  },

  modalActions: {
    display: "flex",
    gap: 10,
    marginTop: 10,
  },

  cancelBtn: {
    flex: 1,
    padding: 10,
    background: "#ccc",
    border: "none",
    borderRadius: 8,
  },

  saveBtn: {
    flex: 1,
    padding: 10,
    background: "#10b981",
    border: "none",
    borderRadius: 8,
    color: "white",
  },
};