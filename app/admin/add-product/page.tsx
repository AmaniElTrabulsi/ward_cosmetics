"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AddProduct() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [barcode, setBarcode] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  const [loading, setLoading] = useState(false);

  async function save() {
    try {
      setLoading(true);

      let imageUrl = "";

      /* ================= UPLOAD IMAGE ================= */
      if (file) {
        const fileName = `${Date.now()}-${file.name}`;

        const { error } = await supabase.storage
          .from("product-images")
          .upload(`products/${fileName}`, file);

        if (error) {
          alert("Image upload failed");
          return;
        }

        const { data } = supabase.storage
          .from("product-images")
          .getPublicUrl(`products/${fileName}`);

        imageUrl = data.publicUrl;
      }

      /* ================= INSERT PRODUCT ================= */
      const { error: insertError } = await supabase.from("products").insert({
        name,
        brand,
        price: Number(price),
        stock_quantity: Number(stock),
        barcode,
        image_url: imageUrl,
      });

      if (insertError) {
        alert("Failed to save product");
        return;
      }

      router.push("/search");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>➕ Add Product</h1>
        <p style={styles.subtitle}>Create or add inventory item</p>

        {/* FORM CARD */}
        <div style={styles.card}>
          <div style={styles.form}>
            <input
              style={styles.input}
              placeholder="Product name"
              onChange={(e) => setName(e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="Brand"
              onChange={(e) => setBrand(e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="Price"
              onChange={(e) => setPrice(e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="Stock"
              onChange={(e) => setStock(e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="Barcode"
              onChange={(e) => setBarcode(e.target.value)}
            />

            {/* IMAGE UPLOAD */}
            <label style={styles.label}>📷 Product Image</label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;

                setFile(f);
                setPreview(URL.createObjectURL(f));
              }}
            />

            {preview && (
              <img src={preview} style={styles.preview} />
            )}

            {/* SAVE */}
            <button
              style={styles.saveBtn}
              onClick={save}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Product"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= STYLES (MATCH ENTIRE APP) ================= */

const styles: any = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#0f0f10",
    padding: 20,
    color: "white",
  },

  container: {
    maxWidth: 800,
    margin: "0 auto",
  },

  title: {
    fontSize: 24,
    marginBottom: 5,
  },

  subtitle: {
    color: "#888",
    marginBottom: 20,
    fontSize: 13,
  },

  card: {
    backgroundColor: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 12,
    padding: 20,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  input: {
    padding: 12,
    borderRadius: 10,
    border: "1px solid #333",
    backgroundColor: "#111",
    color: "white",
    outline: "none",
  },

  label: {
    fontSize: 12,
    color: "#aaa",
    marginTop: 5,
  },

  preview: {
    width: "100%",
    borderRadius: 10,
    marginTop: 10,
  },

  saveBtn: {
    marginTop: 10,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#4ade80",
    border: "none",
    color: "black",
    fontWeight: "bold",
    cursor: "pointer",
  },
};