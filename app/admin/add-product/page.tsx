"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AddProduct() {
  const router = useRouter();

  const [mode, setMode] = useState<"new" | "update">("new");

  const [search, setSearch] = useState("");
  const [existingProduct, setExistingProduct] = useState<any>(null);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [barcode, setBarcode] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  const [loading, setLoading] = useState(false);

  /* ================= FIND EXISTING PRODUCT ================= */
  async function findProduct() {
    if (!search) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .or(`name.ilike.%${search}%,barcode.ilike.%${search}%`)
      .maybeSingle();

    if (error) {
      console.log(error);
      setExistingProduct(null);
    } else {
      setExistingProduct(data);
    }

    setLoading(false);
  }

  /* ================= SAVE ================= */
  async function handleSave() {
    try {
      setLoading(true);

      let imageUrl = "";

      /* ================= IMAGE UPLOAD ================= */
      if (file) {
        const fileName = `${Date.now()}-${file.name}`;

        const { error } = await supabase.storage
          .from("product-images")
          .upload(`products/${fileName}`, file);

        if (error) {
          console.log(error);
          alert("Image upload failed");
          setLoading(false);
          return;
        }

        const { data } = supabase.storage
          .from("product-images")
          .getPublicUrl(`products/${fileName}`);

        imageUrl = data.publicUrl;
      }

      /* ================= NEW PRODUCT ================= */
      if (mode === "new") {
        const { error } = await supabase.from("products").insert({
          name,
          brand,
          price: Number(price),
          stock_quantity: Number(stock || 0),
          barcode,
          image_url: imageUrl,
        });

        if (error) throw error;
      }

      /* ================= UPDATE STOCK ================= */
      if (mode === "update" && existingProduct) {
        const { error } = await supabase
          .from("products")
          .update({
            stock_quantity:
              (existingProduct.stock_quantity || 0) +
              Number(stock || 0),
          })
          .eq("id", existingProduct.id);

        if (error) throw error;
      }

      alert("Saved successfully!");

      router.push("/search");
    } catch (err) {
      console.log(err);
      alert("Error saving product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>➕ Add / Update Product</h1>

        {/* MODE SWITCH */}
        <div style={styles.switchRow}>
          <button
            style={mode === "new" ? styles.activeBtn : styles.btn}
            onClick={() => setMode("new")}
          >
            New Product
          </button>

          <button
            style={mode === "update" ? styles.activeBtn : styles.btn}
            onClick={() => setMode("update")}
          >
            Add Stock
          </button>
        </div>

        {/* ================= NEW PRODUCT ================= */}
        {mode === "new" && (
          <div style={styles.form}>
            <input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              placeholder="Brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />

            <input
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />

            <input
              placeholder="Stock"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />

            <input
              placeholder="Barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
            />
          </div>
        )}

        {/* ================= UPDATE STOCK ================= */}
        {mode === "update" && (
          <div style={styles.form}>
            <input
              placeholder="Search product (name or barcode)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <button onClick={findProduct} style={styles.smallBtn}>
              Find Product
            </button>

            {existingProduct && (
              <div style={styles.foundBox}>
                <p><b>{existingProduct.name}</b></p>
                <p>Current Stock: {existingProduct.stock_quantity}</p>
              </div>
            )}

            <input
              placeholder="Add stock amount"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>
        )}

        {/* ================= IMAGE ================= */}
        <label style={styles.label}>📷 Image (gallery or camera)</label>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setFile(f);
              setPreview(URL.createObjectURL(f));
            }
          }}
        />

        {preview && (
          <img src={preview} style={styles.preview} />
        )}

        {/* SAVE BUTTON */}
        <button
          onClick={handleSave}
          disabled={loading}
          style={styles.saveBtn}
        >
          {loading ? "Saving..." : "Save"}
        </button>
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
    padding: 20,
    color: "white",
  },

  card: {
    width: "100%",
    maxWidth: 450,
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    border: "1px solid #2a2a2a",
  },

  title: {
    marginBottom: 10,
  },

  switchRow: {
    display: "flex",
    gap: 10,
    marginBottom: 15,
  },

  btn: {
    flex: 1,
    padding: 10,
    backgroundColor: "#2a2a2a",
    border: "none",
    color: "white",
    borderRadius: 8,
  },

  activeBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: "#4ade80",
    border: "none",
    color: "black",
    borderRadius: 8,
    fontWeight: "bold",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  smallBtn: {
    padding: 8,
    backgroundColor: "#333",
    color: "white",
    border: "none",
    borderRadius: 6,
  },

  foundBox: {
    padding: 10,
    backgroundColor: "#111",
    borderRadius: 8,
    border: "1px solid #333",
  },

  label: {
    fontSize: 12,
    color: "#aaa",
    marginTop: 10,
  },

  preview: {
    width: "100%",
    marginTop: 10,
    borderRadius: 10,
  },

  saveBtn: {
    marginTop: 15,
    padding: 12,
    width: "100%",
    backgroundColor: "#4ade80",
    border: "none",
    borderRadius: 10,
    fontWeight: "bold",
  },
};