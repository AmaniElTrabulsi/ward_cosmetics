"use client";

import { useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/lib/supabase";
import EmployeeGuard from "@/components/EmployeeGuard";

export default function RegisterPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [barcode, setBarcode] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);

  async function addByBarcode(code: string) {
    const cleanCode = code.trim();

    if (!cleanCode) return;

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("barcode", cleanCode)
      .maybeSingle();

    if (error || !data) {
      alert(`Product not found: ${cleanCode}`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find(
        (item) => item.id === data.id
      );

      if (existing) {
        if (existing.qty >= existing.stock_quantity) {
          alert("Not enough stock");
          return prev;
        }

        return prev.map((item) =>
          item.id === data.id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }

      return [
        ...prev,
        {
          ...data,
          qty: 1,
        },
      ];
    });

    setBarcode("");

    if (navigator.vibrate) {
      navigator.vibrate(120);
    }
  }

  async function startScanner() {
    setScannerOpen(true);

    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("register-reader");

        scannerRef.current = scanner;

        const cameras = await Html5Qrcode.getCameras();

        if (!cameras?.length) {
          alert("No camera found");
          setScannerOpen(false);
          return;
        }

        const camera =
          cameras.find(
            (c) =>
              c.label.toLowerCase().includes("back") ||
              c.label.toLowerCase().includes("rear")
          ) || cameras[0];

        await scanner.start(
          camera.id,
          {
            fps: 10,
            qrbox: 250,
          },
          async (decodedText) => {
            await stopScanner();
            await addByBarcode(decodedText);
          },
          () => {}
        );
      } catch (error) {
        console.error(error);
        alert("Camera failed to open");
        setScannerOpen(false);
      }
    }, 300);
  }

  async function stopScanner() {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      }
    } catch {}

    scannerRef.current = null;
    setScannerOpen(false);
  }

  function changeQty(id: string, amount: number) {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const newQty = item.qty + amount;

        if (newQty < 1) {
          return item;
        }

        if (newQty > item.stock_quantity) {
          alert("Not enough stock");
          return item;
        }

        return {
          ...item,
          qty: newQty,
        };
      })
    );
  }

  function removeItem(id: string) {
    setCart((prev) =>
      prev.filter((item) => item.id !== id)
    );
  }

  const total = cart.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * item.qty,
    0
  );

  async function checkout() {
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    for (const item of cart) {
      if (item.qty > item.stock_quantity) {
        alert(`Not enough stock for ${item.name}`);
        return;
      }
    }

    const { data: sale, error: saleError } =
      await supabase
        .from("sales")
        .insert({
          total,
        })
        .select()
        .single();

    if (saleError || !sale) {
      console.error(saleError);
      alert("Failed to create sale");
      return;
    }

    const saleItems = cart.map((item) => ({
      sale_id: sale.id,
      product_id: item.id,
      quantity: item.qty,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from("sale_items")
      .insert(saleItems);

    if (itemsError) {
      console.error(itemsError);
      alert("Failed to create sale items");
      return;
    }

    for (const item of cart) {
      const newStock =
        item.stock_quantity - item.qty;

      const { error } = await supabase
        .from("products")
        .update({
          stock_quantity: newStock,
        })
        .eq("id", item.id);

      if (error) {
        console.error(error);
        alert(`Stock update failed for ${item.name}`);
        return;
      }
    }

    setCart([]);

    alert("Sale completed successfully");
  }

  return (
    <EmployeeGuard>
      <div style={styles.page}>
        <div style={styles.header}>
          <div>
            <div style={styles.eyebrow}>POINT OF SALE</div>
            <h1 style={styles.title}>Register</h1>
          </div>

          <div style={styles.cartBadge}>
            🛒 {cart.length}
          </div>
        </div>

        <div style={styles.inputRow}>
          <input
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Enter barcode..."
            style={styles.input}
          />

          <button
            style={styles.addButton}
            onClick={() => addByBarcode(barcode)}
          >
            Add
          </button>
        </div>

        <button
          style={styles.scanButton}
          onClick={startScanner}
        >
          📷 Scan Barcode
        </button>

        {scannerOpen && (
          <div style={styles.cameraCard}>
            <div id="register-reader" />

            <button
              style={styles.stopButton}
              onClick={stopScanner}
            >
              Stop Camera
            </button>
          </div>
        )}

        <div style={styles.cartCard}>
          <div style={styles.cartHeader}>
            <h2>Current Sale</h2>
            <span>{cart.length} products</span>
          </div>

          {cart.length === 0 && (
            <div style={styles.empty}>
              <div style={{ fontSize: 40 }}>🛒</div>
              <p>Your cart is empty</p>
              <small>
                Scan or enter a barcode to add a product.
              </small>
            </div>
          )}

          {cart.map((item) => (
            <div key={item.id} style={styles.item}>
              <div style={{ flex: 1 }}>
                <strong style={styles.itemName}>
                  {item.name}
                </strong>

                <div style={styles.itemPrice}>
                  ${Number(item.price).toFixed(2)}
                </div>
              </div>

              <div style={styles.qtyControls}>
                <button
                  style={styles.qtyButton}
                  onClick={() =>
                    changeQty(item.id, -1)
                  }
                >
                  −
                </button>

                <strong>{item.qty}</strong>

                <button
                  style={styles.qtyButton}
                  onClick={() =>
                    changeQty(item.id, 1)
                  }
                >
                  +
                </button>
              </div>

              <button
                style={styles.removeButton}
                onClick={() => removeItem(item.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div style={styles.totalCard}>
          <span>Total</span>
          <strong>${total.toFixed(2)}</strong>
        </div>

        <button
          style={{
            ...styles.checkoutButton,
            opacity: cart.length === 0 ? 0.5 : 1,
          }}
          onClick={checkout}
          disabled={cart.length === 0}
        >
          Complete Sale
        </button>
      </div>
    </EmployeeGuard>
  );
}

const styles: any = {
  page: {
    padding: 20,
    paddingTop: 45,
    minHeight: "100vh",
    background: "#f5f7fb",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  eyebrow: {
    fontSize: 11,
    color: "#6366f1",
    fontWeight: 700,
    letterSpacing: 1,
  },

  title: {
    color: "#111827",
    margin: "4px 0",
    fontSize: 28,
  },

  cartBadge: {
    background: "#111827",
    color: "white",
    padding: "9px 13px",
    borderRadius: 20,
    fontWeight: 700,
  },

  inputRow: {
    display: "flex",
    gap: 8,
  },

  input: {
    flex: 1,
    padding: 13,
    border: "1px solid #ddd",
    borderRadius: 12,
    color: "#111827",
    background: "white",
  },

  addButton: {
    padding: "13px 18px",
    background: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: 12,
    fontWeight: 700,
  },

  scanButton: {
    width: "100%",
    padding: 14,
    marginTop: 10,
    background: "#06b6d4",
    color: "white",
    border: "none",
    borderRadius: 12,
    fontWeight: 700,
  },

  cameraCard: {
    background: "white",
    padding: 12,
    borderRadius: 15,
    marginTop: 12,
  },

  stopButton: {
    width: "100%",
    padding: 12,
    marginTop: 10,
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: 10,
  },

  cartCard: {
    background: "white",
    borderRadius: 16,
    padding: 15,
    marginTop: 18,
  },

  cartHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#111827",
  },

  empty: {
    textAlign: "center",
    padding: 35,
    color: "#6b7280",
  },

  item: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "14px 0",
    borderBottom: "1px solid #eee",
  },

  itemName: {
    color: "#111827",
  },

  itemPrice: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 3,
  },

  qtyControls: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    color: "#111827",
  },

  qtyButton: {
    width: 30,
    height: 30,
    border: "none",
    borderRadius: 8,
    background: "#6366f1",
    color: "white",
    fontWeight: 700,
    fontSize: 17,
  },

  removeButton: {
    border: "none",
    background: "#fee2e2",
    color: "#b91c1c",
    width: 30,
    height: 30,
    borderRadius: 8,
  },

  totalCard: {
    marginTop: 15,
    background: "#111827",
    color: "white",
    padding: 18,
    borderRadius: 15,
    display: "flex",
    justifyContent: "space-between",
    fontSize: 20,
  },

  checkoutButton: {
    width: "100%",
    marginTop: 10,
    padding: 16,
    border: "none",
    borderRadius: 14,
    background: "#10b981",
    color: "white",
    fontWeight: 800,
    fontSize: 16,
  },
};