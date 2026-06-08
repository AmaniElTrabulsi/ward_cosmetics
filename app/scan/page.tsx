"use client";

import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "@/lib/supabase";

export default function ScanPage() {
  const [barcode, setBarcode] = useState("");
  const [product, setProduct] = useState<any>(null);
  const [error, setError] = useState("");
  const [scannerStarted, setScannerStarted] = useState(false);

  // FETCH PRODUCT
  async function fetchProduct(code: string) {
    setError("");
    setProduct(null);

    if (!code) return;

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("barcode", code)
      .single();

    if (error || !data) {
      setError("❌ Product not found");
      return;
    }

    setProduct(data);
  }

  // SCANNER
  useEffect(() => {
    if (!scannerStarted) return;

    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: 250,
      },
      false
    );

    scanner.render(async (decodedText) => {
      setBarcode(decodedText);
      await fetchProduct(decodedText);
      scanner.clear();
      setScannerStarted(false);
    });

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [scannerStarted]);

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>📷 Scan / Search Product</h2>

      {/* BUTTONS */}
      <div style={styles.buttons}>
        <button
          style={styles.btnPrimary}
          onClick={() => setScannerStarted(true)}
        >
          Start Camera Scan
        </button>

        <button
          style={styles.btnSecondary}
          onClick={() => setScannerStarted(false)}
        >
          Stop Camera
        </button>
      </div>

      {/* CAMERA */}
      {scannerStarted && (
        <div id="reader" style={styles.scanner}></div>
      )}

      {/* MANUAL INPUT */}
      <div style={styles.manualBox}>
        <input
          placeholder="Enter barcode manually..."
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          style={styles.input}
        />

        <button
          style={styles.searchBtn}
          onClick={() => fetchProduct(barcode)}
        >
          Search
        </button>
      </div>

      {/* ERROR */}
      {error && <p style={styles.error}>{error}</p>}

      {/* PRODUCT CARD (MATCHES SEARCH PAGE STYLE) */}
      {product && (
        <div style={styles.card}>
          {product.image_url && (
            <img src={product.image_url} style={styles.image} />
          )}

          <h3 style={styles.titleText}>{product.name}</h3>

          <p style={styles.text}><b>Brand:</b> {product.brand}</p>
          <p style={styles.text}><b>Price:</b> {product.price}$</p>

          {/* STOCK BADGE */}
          <p
            style={{
              display: "inline-block",
              padding: "3px 8px",
              borderRadius: 6,
              fontSize: 12,
              background:
                product.stock_quantity <= 3 ? "#fee2e2" : "#f3f4f6",
              color:
                product.stock_quantity <= 3 ? "#b91c1c" : "#111827",
              fontWeight: 600,
            }}
          >
            Stock: {product.stock_quantity}
          </p>

          {product.barcode && (
            <p style={styles.barcode}>
              Barcode: {product.barcode}
            </p>
          )}
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

  title: {
    marginBottom: 15,
    color: "black",
    fontSize: 20,
  },

  titleText: {
    color: "black",
    fontSize: 20,
    marginBottom: 5,
    fontWeight: "bold"
  },

  buttons: {
    display: "flex",
    gap: 10,
    marginBottom: 15,
  },

  btnPrimary: {
    background: "#6366f1",
    color: "white",
    border: "none",
    padding: "10px 12px",
    borderRadius: 10,
    cursor: "pointer",
  },

  btnSecondary: {
    background: "#ef4444",
    color: "white",
    border: "none",
    padding: "10px 12px",
    borderRadius: 10,
    cursor: "pointer",
  },

  scanner: {
    width: "100%",
    maxWidth: 400,
    marginBottom: 20,
  },

  manualBox: {
    display: "flex",
    gap: 10,
    marginBottom: 20,
  },

  input: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    border: "1px solid #ddd",
    color: "black",
  },

  searchBtn: {
    background: "#10b981",
    color: "white",
    border: "none",
    padding: "10px 12px",
    borderRadius: 10,
    cursor: "pointer",
  },

  card: {
    background: "white",
    borderRadius: 14,
    padding: 12,
    boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginTop: 10,
  },

  image: {
    width: "100%",
    height: 180,
    objectFit: "cover",
    borderRadius: 10,
    marginBottom: 8,
  },

  text: {
    fontSize: 15,
    color: "#242323",
  },

  barcode: {
    fontSize: 11,
    color: "#888",
  },

  error: {
    color: "red",
    marginBottom: 10,
  },
};