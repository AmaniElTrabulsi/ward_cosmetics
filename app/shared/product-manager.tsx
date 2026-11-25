
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  brand: string;
  name: string;
  price: number;
  stock_quantity: number | null;
  image_url: string | null;
  barcode: string | null;
  description: string | null;
};

type ProductForm = {
  brand: string;
  name: string;
  price: string;
  stock_quantity: string;
  image_url: string;
  barcode: string;
  description: string;
};

const EMPTY_FORM: ProductForm = {
  brand: "",
  name: "",
  price: "",
  stock_quantity: "0",
  image_url: "",
  barcode: "",
  description: "",
};

export default function ProductManager() {
  const [items, setItems] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>({ ...EMPTY_FORM });
  const [editing, setEditing] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scanning, setScanning] = useState(false);

  const photoVideoRef = useRef<HTMLVideoElement>(null);
  const barcodeVideoRef = useRef<HTMLVideoElement>(null);
  const photoStreamRef = useRef<MediaStream | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/products");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load products.");
      }

      setItems(result.products || []);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to load products."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Release temporary image previews.
  useEffect(() => {
    if (!preview.startsWith("blob:")) return;

    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  // Open the live camera for taking product photos.
  useEffect(() => {
    if (!cameraOpen) return;

    let active = true;

    async function startCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            "Camera access is unavailable. Open the app using HTTPS."
          );
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
          },
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        photoStreamRef.current = stream;

        if (photoVideoRef.current) {
          photoVideoRef.current.srcObject = stream;
          await photoVideoRef.current.play();
        }
      } catch (error) {
        if (active) {
          setCameraError(
            error instanceof Error
              ? error.message
              : "Unable to open camera."
          );
        }
      }
    }

    void startCamera();

    return () => {
      active = false;

      photoStreamRef.current?.getTracks().forEach((track) => track.stop());
      photoStreamRef.current = null;
    };
  }, [cameraOpen]);

  // Live barcode scanner using the rear-facing camera.
  useEffect(() => {
    if (!scanning) return;

    let active = true;
    let stopScanner: (() => void) | undefined;

    const reader = new BrowserMultiFormatReader();

    async function startScanner() {
      try {
        if (!barcodeVideoRef.current) return;

        const controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: "environment" },
            },
          },
          barcodeVideoRef.current,
          (result) => {
            if (!active || !result) return;

            const barcode = result.getText();

            setForm((current) => ({
              ...current,
              barcode,
            }));

            setMessage(`Barcode scanned: ${barcode}`);
            setScanning(false);
          }
        );

        if (!active) {
          controls.stop();
        } else {
          stopScanner = () => controls.stop();
        }
      } catch (error) {
        if (active) {
          setMessage(
            error instanceof Error
              ? `Barcode scanner error: ${error.message}`
              : "Unable to start barcode scanner."
          );
          setScanning(false);
        }
      }
    }

    void startScanner();

    return () => {
      active = false;
      stopScanner?.();
    };
  }, [scanning]);

  const filtered = items.filter((product) =>
    `${product.name} ${product.brand} ${product.barcode || ""}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  function changeField(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please select a valid image.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage("Image must be smaller than 10 MB.");
      event.target.value = "";
      return;
    }

    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setMessage("");

    // Allow selecting the same image again later.
    event.target.value = "";
  }

  function closeCamera() {
    setCameraOpen(false);
    photoStreamRef.current?.getTracks().forEach((track) => track.stop());
    photoStreamRef.current = null;
  }

  async function takePhoto() {
    const video = photoVideoRef.current;

    if (!video || !video.videoWidth) {
      setCameraError("Camera is not ready yet. Please wait.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setCameraError("Unable to capture photo.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Unable to create photo.");
          return;
        }

        const file = new File(
          [blob],
          `product-${Date.now()}.jpg`,
          { type: "image/jpeg" }
        );

        setImageFile(file);
        setPreview(URL.createObjectURL(file));
        setCameraError("");
        closeCamera();
      },
      "image/jpeg",
      0.88
    );
  }

  function resetForm() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setImageFile(null);
    setPreview("");
    setMessage("");
    setCameraOpen(false);
    setScanning(false);
  }

  function editProduct(product: Product) {
    setEditing(product.id);

    setForm({
      brand: product.brand,
      name: product.name,
      price: String(product.price),
      stock_quantity: String(product.stock_quantity ?? 0),
      image_url: product.image_url || "",
      barcode: product.barcode || "",
      description: product.description || "",
    });

    setImageFile(null);
    setPreview(product.image_url || "");
    setMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadImage(): Promise<string | null> {
    if (!imageFile) return form.image_url || null;

    const extension =
      imageFile.name.split(".").pop()?.toLowerCase() || "jpg";

    const safeExtension = /^[a-z0-9]+$/.test(extension)
      ? extension
      : "jpg";

    const filePath = `products/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${safeExtension}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(filePath, imageFile, {
        cacheControl: "3600",
        contentType: imageFile.type,
        upsert: false,
      });

    if (error) {
      throw new Error(`Image upload failed: ${error.message}`);
    }

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busy) return;

    setBusy(true);
    setMessage("");

    try {
      const imageUrl = await uploadImage();

      const response = await fetch(
        editing ? `/api/products/${editing}` : "/api/products",
        {
          method: editing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            price: Number(form.price),
            stock_quantity: Number(form.stock_quantity),
            image_url: imageUrl,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to save product.");
      }

      setMessage(
        editing
          ? "Product updated successfully."
          : "Product added successfully."
      );

      setForm({ ...EMPTY_FORM });
      setEditing(null);
      setImageFile(null);
      setPreview("");

      await load();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save product."
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteProduct(id: string) {
    const confirmed = window.confirm(
      "Delete this product? Products already used in orders or sales cannot be deleted."
    );

    if (!confirmed) return;

    setMessage("");

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to delete product.");
      }

      setMessage("Product deleted successfully.");

      if (editing === id) {
        resetForm();
      }

      await load();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to delete product."
      );
    }
  }

  return (
    <>
      <style jsx>{`
        .product-page { min-width: 0; }
        .product-form-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
        .product-actions { display:flex; flex-wrap:wrap; gap:10px; }
        .product-table-actions { display:flex; flex-wrap:wrap; gap:7px; }
        @media(max-width:650px) {
          .product-form-grid { grid-template-columns:1fr; }
          .product-page .topbar { align-items:flex-start; flex-direction:column; }
          .product-page .navlinks { width:100%; overflow-x:auto; flex-wrap:nowrap; }
          .product-page .navlinks a { white-space:nowrap; }
          .product-page .shell { padding:16px 12px 36px; }
          .product-page .panel { padding:15px; }
          .product-page .row { align-items:flex-start; flex-wrap:wrap; }
          .product-page .row > .field { width:100%; max-width:none !important; }
          .product-page .btn { min-height:43px; }
          .product-page video { min-height:190px !important; }
          .product-page .tablewrap { margin-inline:-2px; }
        }
      `}</style>
      <div className="product-page">
      <header className="topbar">
        <Link
          href="/app"
          className="brand"
          style={{ textDecoration: "none" }}
        >
          WARD COSMETICS
        </Link>

        <nav className="navlinks">
          <Link href="/app">Dashboard</Link>
          <Link href="/app/orders">Orders</Link>
          <Link href="/app/pos">POS</Link>
        </nav>
      </header>

      <main className="shell">
        <div className="eyebrow">Inventory</div>

        <h1 className="section-title">Product management</h1>

        <form className="panel stack" onSubmit={save}>
          <div className="row">
            <h2
              className="section-title"
              style={{ fontSize: 23, margin: 0 }}
            >
              {editing ? "Edit product" : "Add a product"}
            </h2>

            {editing && (
              <button
                type="button"
                className="btn btn-light"
                onClick={resetForm}
              >
                Cancel edit
              </button>
            )}
          </div>

          <div className="product-form-grid">
            <label className="label">
              Brand
              <input
                className="field"
                name="brand"
                required
                value={form.brand}
                onChange={changeField}
              />
            </label>

            <label className="label">
              Product name
              <input
                className="field"
                name="name"
                required
                value={form.name}
                onChange={changeField}
              />
            </label>

            <label className="label">
              Price (USD)
              <input
                className="field"
                name="price"
                type="number"
                min="0"
                step="0.01"
                required
                value={form.price}
                onChange={changeField}
              />
            </label>

            <label className="label">
              Stock quantity
              <input
                className="field"
                name="stock_quantity"
                type="number"
                min="0"
                step="1"
                value={form.stock_quantity}
                onChange={changeField}
              />
            </label>
          </div>

          {/* BARCODE SCANNER */}
          <section className="stack">
            <h3>Product barcode</h3>

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <input
                className="field"
                value={form.barcode}
                placeholder="Scan a product barcode"
                readOnly
                style={{ flex: "1 1 220px" }}
              />

              {!scanning ? (
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setMessage("");
                    setScanning(true);
                  }}
                >
                  Scan barcode
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => setScanning(false)}
                >
                  Stop scanner
                </button>
              )}

              {form.barcode && (
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      barcode: "",
                    }))
                  }
                >
                  Clear
                </button>
              )}
            </div>

            {scanning && (
              <div className="stack">
                <p className="small">
                  Point your rear camera at the barcode. Keep it inside the
                  camera view.
                </p>

                <video
                  ref={barcodeVideoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{
                    width: "100%",
                    maxWidth: 480,
                    minHeight: 220,
                    objectFit: "cover",
                    borderRadius: 14,
                    background: "#111",
                  }}
                />

                <p className="small">
                  The barcode will be entered automatically when detected.
                </p>
              </div>
            )}
          </section>

          {/* PRODUCT PHOTO */}
          <section className="stack">
            <h3>Product photo</h3>

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <label className="btn btn-light">
                Choose from gallery
                <input
                  type="file"
                  accept="image/*"
                  onChange={selectImage}
                  style={{ display: "none" }}
                />
              </label>

              <button
                type="button"
                className="btn btn-light"
                onClick={() => {
                  setCameraError("");
                  setCameraOpen(true);
                }}
              >
                Open camera
              </button>

              {preview && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    setImageFile(null);
                    setPreview("");
                    setForm((current) => ({
                      ...current,
                      image_url: "",
                    }));
                  }}
                >
                  Remove photo
                </button>
              )}
            </div>

            {cameraOpen && (
              <div className="panel stack">
                <h3>Take product photo</h3>

                {cameraError && (
                  <p className="small">{cameraError}</p>
                )}

                <video
                  ref={photoVideoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{
                    width: "100%",
                    maxWidth: 480,
                    minHeight: 220,
                    objectFit: "cover",
                    borderRadius: 14,
                    background: "#111",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    className="btn"
                    onClick={takePhoto}
                  >
                    Take photo
                  </button>

                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={closeCamera}
                  >
                    Cancel camera
                  </button>
                </div>
              </div>
            )}

            {preview && (
              <div style={{ marginTop: 10 }}>
                <img
                  src={preview}
                  alt="Product preview"
                  style={{
                    width: 180,
                    height: 180,
                    objectFit: "contain",
                    borderRadius: 12,
                    background: "#f5f3ef",
                    padding: 8,
                  }}
                />
              </div>
            )}

            <p className="small">
              Choose an existing photo or take a new one with the camera.
              Maximum image size: 10 MB.
            </p>
          </section>

          <label className="label">
            Description
            <textarea
              className="field"
              name="description"
              rows={3}
              value={form.description}
              onChange={changeField}
            />
          </label>

          <button className="btn" disabled={busy}>
            {busy
              ? "Saving..."
              : editing
                ? "Save changes"
                : "Add product"}
          </button>

          {message && (
            <p className="small" role="status">
              {message}
            </p>
          )}
        </form>

        {/* PRODUCT LIST */}
        <section style={{ marginTop: 24 }}>
          <div className="row">
            <h2 className="section-title">
              All products ({items.length})
            </h2>

            <input
              className="field"
              style={{ maxWidth: 280 }}
              placeholder="Search products..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          {loading ? (
            <p className="small">Loading products...</p>
          ) : (
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Brand</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Barcode</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.brand}</td>
                      <td>${Number(product.price).toFixed(2)}</td>
                      <td>{product.stock_quantity ?? 0}</td>
                      <td>{product.barcode || "—"}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-light"
                          onClick={() => editProduct(product)}
                        >
                          Edit
                        </button>{" "}

                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => deleteProduct(product.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6}>No products found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      </div>
    </>
  );
}
