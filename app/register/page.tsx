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

  async function save() {
    setLoading(true);

    let imageUrl = "";

    if (file) {
      const fileName = Date.now() + file.name;

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
        <h2>➕ Add Product</h2>

        <input placeholder="Name" onChange={(e) => setName(e.target.value)} />
        <input placeholder="Brand" onChange={(e) => setBrand(e.target.value)} />
        <input placeholder="Price" onChange={(e) => setPrice(e.target.value)} />
        <input placeholder="Stock" onChange={(e) => setStock(e.target.value)} />
        <input placeholder="Barcode" onChange={(e) => setBarcode(e.target.value)} />

        {/* CAMERA + GALLERY FIX */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <button onClick={save} style={styles.btn}>
          Save
        </button>
      </div>
    </div>
  );
}

const styles: any = {
  page: {
    display: "flex",
    justifyContent: "center",
  },

  card: {
    width: 400,
    background: "white",
    padding: 20,
    borderRadius: 16,
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  btn: {
    marginTop: 10,
    padding: 12,
    background: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: 10,
  },
};