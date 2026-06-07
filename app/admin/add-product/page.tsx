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

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(`products/${fileName}`, file);

        if (uploadError) {
          alert("Image upload failed");
          setLoading(false);
          return;
        }

        const { data } = supabase.storage
          .from("product-images")
          .getPublicUrl(`products/${fileName}`);

        imageUrl = data.publicUrl;
      }

      /* ================= INSERT PRODUCT ================= */
      const { error } = await supabase.from("products").insert({
        name,
        brand,
        price: Number(price),
        stock_quantity: Number(stock),
        barcode,
        image_url: imageUrl,
      });

      if (error) {
        console.log(error);
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
      <div style={styles.card}>
        <h1 style={styles.title}>➕ Add Product</h1>
        <p style={styles.subtitle}>Create a new inventory item</p>

        {/* INPUTS */}
        <div style={styles.form}>
          <input placeholder="Product Name" onChange={(e) => setName(e.target.value)} />
          <input placeholder="Brand" onChange={(e) => setBrand(e.target.value)} />
          <input placeholder="Price" onChange={(e) => setPrice(e.target.value)} />
          <input placeholder="Stock" onChange={(e) => setStock(e.target.value)} />
          <input placeholder="Barcode" onChange={(e) => setBarcode(e.target.value)} />

          {/* IMAGE UPLOAD (FIXED: GALLERY + CAMERA) */}
          <label style={styles.label}>📷 Add Product Image</label>

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

          {/* PREVIEW */}
          {preview && (
            <img src={preview} style={styles.preview} />
          )}

          {/* SAVE BUTTON */}
          <button onClick={save} disabled={loading} style={styles.button}>
            {loading ? "Saving..." : "Save Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles: any = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#0f0f10",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 16,
    padding: 20,
    color: "white",
  },

  title: {
    margin: 0,
    fontSize: 22,
  },

  subtitle: {
    fontSize: 13,
    color: "#888",
    marginBottom: 15,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
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

  button: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    border: "none",
    backgroundColor: "#4ade80",
    color: "#000",
    fontWeight: "bold",
    cursor: "pointer",
  },
};