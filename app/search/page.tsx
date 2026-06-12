"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SearchPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [editProduct, setEditProduct] = useState<any | null>(null);
  const [form, setForm] = useState<any>({});
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [previewImage, setPreviewImage] = useState<string | null>(null);

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

  // ======================
  // 📊 STATS
  // ======================
  const totalProducts = filtered.length;

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
      image_url: product.image_url || "",
    });

    setImageFile(null);
  }

  async function saveEdit() {
    if (!editProduct) return;

    let imageUrl = form.image_url;

    if (imageFile) {
      const fileName =
        Date.now() + "-" + imageFile.name.replace(/\s/g, "-");

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, imageFile);

      if (uploadError) {
        alert("Image upload failed");
        return;
      }

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      imageUrl = data.publicUrl;
    }

    const { error } = await supabase
      .from("products")
      .update({
        name: form.name,
        brand: form.brand,
        price: Number(form.price),
        stock_quantity: Number(form.stock_quantity),
        barcode: form.barcode,
        image_url: imageUrl,
      })
      .eq("id", editProduct.id);

    if (error) {
      alert("Update failed");
      return;
    }

    setEditProduct(null);
    setImageFile(null);
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

      {/* ================= KPI CARD ================= */}
      <div style={styles.statsBar}>
        <div style={styles.statBox}>
          <div style={styles.statIcon}>📦</div>
          <div>
            <div style={styles.statNumber}>{totalProducts}</div>
            <div style={styles.statLabel}>Total Products</div>
          </div>
        </div>
      </div>

      {loading && <p>Loading...</p>}

      <div style={styles.grid}>
        {filtered.map((p) => (
          <div key={p.id} style={styles.card}>
            {p.image_url && (
              <img
                src={p.image_url}
                style={{ ...styles.image, cursor: "pointer" }}
                onClick={() => setPreviewImage(p.image_url)}
              />
            )}

            <h3 style={{ color: "black", fontSize: 16 }}>
              {p.name}
            </h3>

            <p style={styles.text}>Brand: {p.brand}</p>
            <p style={styles.text}>Price: ${p.price}</p>

            <p
              style={{
                ...styles.text,
                color: p.stock_quantity < 5 ? "red" : "#242323",
                fontWeight: p.stock_quantity < 5 ? "bold" : "normal",
              }}
            >
              Stock: {p.stock_quantity}
            </p>

            {p.barcode && (
              <p style={styles.barcode}>Barcode: {p.barcode}</p>
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

            <label style={styles.label}>Image</label>

            {form.image_url && (
              <img
                src={form.image_url}
                style={{
                  width: "100%",
                  height: 150,
                  objectFit: "cover",
                  borderRadius: 10,
                }}
              />
            )}

            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  const file = e.target.files[0];
                  setImageFile(file);

                  setForm({
                    ...form,
                    image_url: URL.createObjectURL(file),
                  });
                }
              }}
              style={styles.input}
            />

            <label style={styles.label}>Name</label>
            <input
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              style={styles.input}
            />

            <label style={styles.label}>Brand</label>
            <input
              value={form.brand}
              onChange={(e) =>
                setForm({ ...form, brand: e.target.value })
              }
              style={styles.input}
            />

            <label style={styles.label}>Price</label>
            <input
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: e.target.value })
              }
              style={styles.input}
            />

            <label style={styles.label}>Stock</label>
            <input
              value={form.stock_quantity}
              onChange={(e) =>
                setForm({
                  ...form,
                  stock_quantity: e.target.value,
                })
              }
              style={styles.input}
            />

            <label style={styles.label}>Barcode</label>
            <input
              value={form.barcode}
              onChange={(e) =>
                setForm({ ...form, barcode: e.target.value })
              }
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

      {/* IMAGE PREVIEW */}
      {previewImage && (
        <div style={styles.previewOverlay}>
          <div style={styles.previewBox}>
            <button
              onClick={() => setPreviewImage(null)}
              style={styles.closeBtn}
            >
              ✕
            </button>

            <img src={previewImage} style={styles.previewImage} />
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
    paddingTop: 50,
    background: "#f2f3f8",
    minHeight: "100vh",
  },

  search: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "1px solid #040404",
    marginBottom: 10,
    color: "black",
  },

  statsBar: {
    display: "flex",
    marginBottom: 18,
  },

  statBox: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    background: "linear-gradient(135deg, #4f46e5, #3b82f6)",
    boxShadow: "0 10px 25px rgba(59,130,246,0.25)",
    color: "white",
  },

  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    background: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
  },

  statNumber: {
    fontSize: 22,
    fontWeight: 800,
    lineHeight: 1,
    color: "white",
  },

  statLabel: {
    fontSize: 11,
    opacity: 0.85,
    marginTop: 2,
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
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
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  modal: {
    background: "white",
    padding: 20,
    borderRadius: 12,
    width: 320,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: "black",
    marginTop: 6,
  },

  input: {
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ddd",
    color: "black",
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

  previewOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.85)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },

  previewBox: {
    position: "relative",
    maxWidth: "90%",
    maxHeight: "90%",
  },

  previewImage: {
    width: "100%",
    maxHeight: "90vh",
    borderRadius: 12,
  },

  closeBtn: {
    position: "absolute",
    top: -15,
    right: -15,
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "none",
    background: "white",
    color: "black",
    fontSize: 18,
    fontWeight: "bold",
    cursor: "pointer",
  },
};