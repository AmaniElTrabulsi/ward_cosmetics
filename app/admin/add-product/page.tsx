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

  async function save() {
    let imageUrl = "";

    if (file) {
      const fileName = Date.now() + "_" + file.name;

      await supabase.storage
        .from("product-images")
        .upload("products/" + fileName, file);

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl("products/" + fileName);

      imageUrl = data.publicUrl;
    }

    await supabase.from("products").insert({
      name,
      brand,
      price: Number(price),
      stock_quantity: Number(stock),
      barcode,
      image_url: imageUrl,
    });

    router.push("/search");
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={{ color: "black" }}>➕ Add Product</h2>

        <input
          placeholder="Name"
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
        />
        <input
          placeholder="Brand"
          onChange={(e) => setBrand(e.target.value)}
          style={styles.input}
        />
        <input
          placeholder="Price"
          onChange={(e) => setPrice(e.target.value)}
          style={styles.input}
        />
        <input
          placeholder="Stock"
          onChange={(e) => setStock(e.target.value)}
          style={styles.input}
        />
        <input
          placeholder="Barcode"
          onChange={(e) => setBarcode(e.target.value)}
          style={styles.input}
        />

        {/* CUSTOM FILE UPLOAD */}
        <div style={styles.fileWrapper}>
          <label style={styles.fileBtn}>
            📷 Choose Image
            <input
              type="file"
              accept="image/*"
              style={styles.hiddenFile}
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFile(f);

                if (f) {
                  setPreview(URL.createObjectURL(f));
                }
              }}
            />
          </label>

          <span style={styles.fileText}>
            {file ? file.name : "No file selected"}
          </span>
        </div>

        {/* PREVIEW */}
        {preview && (
          <img
            src={preview}
            style={styles.preview}
          />
        )}

        <button onClick={save} style={styles.btn}>
          Save
        </button>
      </div>
    </div>
  );
}

const styles: any = {
  page: {
    padding: 20,
    background: "#f6f7fb",
    minHeight: "100vh",
  },

  card: {
    background: "white",
    padding: 20,
    borderRadius: 16,
    maxWidth: 400,
    margin: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  input: {
    padding: 10,
    borderRadius: 10,
    border: "1px solid #ddd",
  },

  btn: {
    marginTop: 10,
    width: "100%",
    padding: 12,
    background: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: 12,
  },

  fileWrapper: {
    marginTop: 10,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  fileBtn: {
    background: "#6366f1",
    color: "white",
    padding: "10px 12px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 14,
  },

  hiddenFile: {
    display: "none",
  },

  fileText: {
    fontSize: 12,
    color: "#111827",
  },

  preview: {
    width: "100%",
    marginTop: 10,
    borderRadius: 10,
  },
};