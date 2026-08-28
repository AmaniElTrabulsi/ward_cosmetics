"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import EmployeeGuard from "@/components/EmployeeGuard";

export default function AddProduct() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [barcode, setBarcode] = useState("");

  const [file, setFile] =
    useState<File | null>(null);

  const [preview, setPreview] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  async function save() {
    if (!name.trim()) {
      alert("Please enter a product name.");
      return;
    }

    if (!price) {
      alert("Please enter a price.");
      return;
    }

    setSaving(true);

    try {
      let imageUrl = "";

      if (file) {
        const fileName =
          Date.now() +
          "_" +
          file.name.replace(/\s/g, "-");

        const {
          error: uploadError,
        } = await supabase.storage
          .from("product-images")
          .upload(
            "products/" + fileName,
            file
          );

        if (uploadError) {
          console.log(uploadError);
          alert("Image upload failed.");
          setSaving(false);
          return;
        }

        const { data } =
          supabase.storage
            .from("product-images")
            .getPublicUrl(
              "products/" + fileName
            );

        imageUrl = data.publicUrl;
      }

      const {
        error: insertError,
      } = await supabase
        .from("products")
        .insert({
          name: name.trim(),
          brand: brand.trim(),
          price: Number(price),
          stock_quantity: Number(stock || 0),
          barcode: barcode.trim(),
          image_url: imageUrl,
        });

      if (insertError) {
        console.log(insertError);
        alert(
          "Failed to add product."
        );
        setSaving(false);
        return;
      }

      alert("Product added successfully.");

      router.push("/search");
    } catch (error) {
      console.log(error);
      alert("Something went wrong.");
    }

    setSaving(false);
  }

  return (
    <EmployeeGuard>
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.headerIcon}>
            ➕
          </div>

          <h1 style={styles.title}>
            Add Product
          </h1>

          <p style={styles.subtitle}>
            Add a new product to the
            inventory.
          </p>

          <label style={styles.label}>
            Product Name
          </label>

          <input
            placeholder="Product name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            style={styles.input}
          />

          <label style={styles.label}>
            Brand
          </label>

          <input
            placeholder="Brand"
            value={brand}
            onChange={(e) =>
              setBrand(e.target.value)
            }
            style={styles.input}
          />

          <label style={styles.label}>
            Price
          </label>

          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={price}
            onChange={(e) =>
              setPrice(e.target.value)
            }
            style={styles.input}
          />

          <label style={styles.label}>
            Stock
          </label>

          <input
            type="number"
            placeholder="0"
            value={stock}
            onChange={(e) =>
              setStock(e.target.value)
            }
            style={styles.input}
          />

          <label style={styles.label}>
            Barcode
          </label>

          <input
            placeholder="Barcode"
            value={barcode}
            onChange={(e) =>
              setBarcode(e.target.value)
            }
            style={styles.input}
          />

          <label style={styles.label}>
            Product Image
          </label>

          <label style={styles.fileBtn}>
            📷 Choose Image

            <input
              type="file"
              accept="image/*"
              capture="environment"
              style={styles.hiddenFile}
              onChange={(e) => {
                const f =
                  e.target.files?.[0] ||
                  null;

                setFile(f);

                if (f) {
                  setPreview(
                    URL.createObjectURL(f)
                  );
                }
              }}
            />
          </label>

          {file && (
            <p style={styles.fileText}>
              {file.name}
            </p>
          )}

          {preview && (
            <img
              src={preview}
              style={styles.preview}
            />
          )}

          <button
            onClick={save}
            disabled={saving}
            style={{
              ...styles.btn,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving
              ? "Saving..."
              : "Save Product"}
          </button>
        </div>
      </div>
    </EmployeeGuard>
  );
}

const styles: any = {
  page: {
    padding: 20,
    paddingTop: 40,
    background: "#f2f3f8",
    minHeight: "100vh",
  },

  card: {
    background: "white",
    padding: 22,
    borderRadius: 18,
    maxWidth: 420,
    margin: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    boxShadow:
      "0 8px 25px rgba(0,0,0,0.06)",
  },

  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    background: "#eef2ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
  },

  title: {
    color: "#111827",
    fontSize: 24,
    margin: "8px 0 0",
  },

  subtitle: {
    color: "#6b7280",
    fontSize: 13,
    marginTop: 0,
    marginBottom: 10,
  },

  label: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 6,
  },

  input: {
    padding: 12,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    color: "#111827",
    background: "white",
    fontSize: 14,
  },

  fileBtn: {
    background: "#6366f1",
    color: "white",
    padding: "12px",
    borderRadius: 10,
    cursor: "pointer",
    textAlign: "center",
    fontWeight: "bold",
    marginTop: 3,
  },

  hiddenFile: {
    display: "none",
  },

  fileText: {
    fontSize: 12,
    color: "#6b7280",
    margin: 0,
  },

  preview: {
    width: "100%",
    maxHeight: 220,
    objectFit: "cover",
    borderRadius: 12,
    marginTop: 5,
  },

  btn: {
    marginTop: 12,
    width: "100%",
    padding: 14,
    background: "#10b981",
    color: "white",
    border: "none",
    borderRadius: 12,
    fontWeight: "bold",
    fontSize: 15,
    cursor: "pointer",
  },
};