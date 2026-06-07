"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AddProduct() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [brand, setBrand] = useState("");
  const [stock, setStock] = useState("");
  const [serial, setSerial] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    console.log("BUTTON CLICKED");

    try {
      setLoading(true);

      if (!file) {
        alert("Select an image first");
        return;
      }

      // 1. Upload image
      const fileName = `${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(`products/${fileName}`, file);

      if (uploadError) {
        console.log("UPLOAD ERROR:", uploadError);
        alert("Image upload failed");
        return;
      }

      // 2. Get public URL
      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(`products/${fileName}`);

      const imageUrl = data.publicUrl;

      console.log("IMAGE URL:", imageUrl);

      // 3. Insert product
      const { error: insertError } = await supabase.from("products").insert({
        name,
        price: Number(price),
        brand,
        stock_quantity: Number(stock),
        serial_number: serial,
        image_url: imageUrl,
      });

      if (insertError) {
        console.log("INSERT ERROR:", insertError);
        alert("Product insert failed");
        return;
      }

      alert("Product added successfully!");

      // reset form
      setName("");
      setPrice("");
      setBrand("");
      setStock("");
      setSerial("");
      setFile(null);

    } catch (err) {
      console.log("ERROR:", err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Add Product</h1>

      <input placeholder="Name" onChange={(e) => setName(e.target.value)} />
      <br />

      <input placeholder="Brand" onChange={(e) => setBrand(e.target.value)} />
      <br />

      <input placeholder="Price" onChange={(e) => setPrice(e.target.value)} />
      <br />

      <input placeholder="Stock" onChange={(e) => setStock(e.target.value)} />
      <br />

      <input
        placeholder="Serial Number"
        onChange={(e) => setSerial(e.target.value)}
      />
      <br />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <br /><br />

      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Adding..." : "Add Product"}
      </button>
    </div>
  );
}