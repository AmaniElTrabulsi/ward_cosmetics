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
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    try {
      setLoading(true);

      if (!name || !brand || !price) {
        alert("Please fill all required fields");
        setLoading(false);
        return;
      }

      let imageUrl = "";

      // 1. Upload image if exists
      if (file) {
        const fileName = `${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(`products/${fileName}`, file);

        if (uploadError) {
          console.log(uploadError);
          alert("Image upload failed");
          setLoading(false);
          return;
        }

        const { data } = supabase.storage
          .from("product-images")
          .getPublicUrl(`products/${fileName}`);

        imageUrl = data.publicUrl;
      }

      // 2. Insert product
      const { error: insertError } = await supabase.from("products").insert({
        name,
        brand,
        price: Number(price),
        stock_quantity: Number(stock || 0),
        barcode,
        image_url: imageUrl,
      });

      if (insertError) {
        console.log(insertError);
        alert("Failed to add product");
        setLoading(false);
        return;
      }

      alert("Product added successfully!");

      // reset form
      setName("");
      setBrand("");
      setPrice("");
      setStock("");
      setBarcode("");
      setFile(null);

      // 3. Redirect to search page
      router.push("/search");

    } catch (err) {
      console.log(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>➕ Add New Product</h1>
        <p style={styles.subtitle}>Create inventory item</p>

        <div style={styles.form}>
          <input placeholder="Name *" onChange={(e) => setName(e.target.value)} />
          <input placeholder="Brand *" onChange={(e) => setBrand(e.target.value)} />
          <input placeholder="Price *" onChange={(e) => setPrice(e.target.value)} />
          <input placeholder="Stock" onChange={(e) => setStock(e.target.value)} />
          <input placeholder="Barcode" onChange={(e) => setBarcode(e.target.value)} />

          <label style={styles.label}>📷 Take or upload product photo</label>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <button onClick={handleUpload} disabled={loading} style={styles.button}>
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
    fontFamily: "Arial",
    color: "white",
  },

  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 16,
    padding: 20,
  },

  title: {
    margin: 0,
    fontSize: 22,
  },

  subtitle: {
    marginTop: 5,
    fontSize: 13,
    color: "#888",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 20,
  },

  label: {
    fontSize: 12,
    color: "#aaa",
    marginTop: 5,
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