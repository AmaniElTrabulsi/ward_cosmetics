"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import EmployeeGuard from "@/components/EmployeeGuard";

export default function AddProductPage() {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [barcode, setBarcode] = useState("");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [description, setDescription] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [scannerError, setScannerError] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const scannerRef = useRef<any>(null);
  const scannerId = "add-product-scanner";

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    setError("");
    setImageFile(file);

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }

  function removeImage() {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(null);
    setImagePreview("");
  }

  async function startScanner() {
    setScannerError("");
    setScannerLoading(true);
    setScannerOpen(true);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      await new Promise((resolve) => setTimeout(resolve, 250));

      const scanner = new Html5Qrcode(scannerId);

      scannerRef.current = scanner;

      await scanner.start(
        {
          facingMode: "environment",
        },
        {
          fps: 10,
          qrbox: {
            width: 280,
            height: 140,
          },
          aspectRatio: 1.7777778,
        },
        async (decodedText: string) => {
          setBarcode(decodedText);
          await stopScanner();
        },
        () => {}
      );

      setScannerLoading(false);
    } catch (err) {
      console.error(err);

      setScannerLoading(false);

      setScannerError(
        "The camera could not be opened. Check your browser camera permission and make sure the website is running on HTTPS or localhost."
      );
    }
  }

  async function stopScanner() {
    try {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }

        await scannerRef.current.clear();
      }
    } catch (err) {
      console.error(err);
    }

    scannerRef.current = null;
    setScannerOpen(false);
    setScannerLoading(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!name.trim()) {
      setError("Please enter a product name.");
      return;
    }

    if (!brand.trim()) {
      setError("Please enter a brand.");
      return;
    }

    if (!barcode.trim()) {
      setError("Please enter or scan a barcode.");
      return;
    }

    if (!price || Number(price) < 0) {
      setError("Please enter a valid price.");
      return;
    }

    if (stockQuantity === "" || Number(stockQuantity) < 0) {
      setError("Please enter a valid stock quantity.");
      return;
    }

    setSaving(true);

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const extension =
          imageFile.name.split(".").pop() || "jpg";

        const fileName = `${crypto.randomUUID()}.${extension}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } =
          await supabase.storage
            .from("products")
            .upload(filePath, imageFile, {
              cacheControl: "3600",
              upsert: false,
            });

        if (uploadError) {
          throw new Error(
            `Image upload failed: ${uploadError.message}`
          );
        }

        const { data } = supabase.storage
          .from("products")
          .getPublicUrl(filePath);

        imageUrl = data.publicUrl;
      }

      const { error: insertError } = await supabase
        .from("products")
        .insert({
          name: name.trim(),
          brand: brand.trim(),
          barcode: barcode.trim(),
          price: Number(price),
          stock_quantity: Number(stockQuantity),
          description: description.trim() || null,
          image_url: imageUrl,
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      setMessage(
        "The product has been added successfully to your inventory."
      );

      setName("");
      setBrand("");
      setBarcode("");
      setPrice("");
      setStockQuantity("");
      setDescription("");
      setImageFile(null);

      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }

      setImagePreview("");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "Something went wrong while adding the product."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <EmployeeGuard>
      <main className="app-page">
        <div className="app-container max-w-4xl">
          {/* PAGE HEADER */}

          <div className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <span className="app-badge app-badge-rose">
                ✦ Inventory
              </span>

              <span className="text-xs text-[var(--muted)]">
                New product
              </span>
            </div>

            <h1 className="app-title">
              Add Product
            </h1>

            <p className="app-subtitle">
              Add a beautiful, complete product record to
              your Ward Cosmetics inventory.
            </p>
          </div>

          {/* SUCCESS */}

          {message && (
            <div className="app-success mb-6 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--green)] text-[var(--green-dark)]">
                ✓
              </div>

              <div>
                <p className="font-bold">
                  Product added successfully
                </p>

                <p className="mt-1 text-xs">
                  {message}
                </p>
              </div>
            </div>
          )}

          {/* ERROR */}

          {error && (
            <div className="app-error mb-6 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--rose)] text-[var(--rose-dark)]">
                !
              </div>

              <div>
                <p className="font-bold">
                  Could not add product
                </p>

                <p className="mt-1 text-xs leading-5">
                  {error}
                </p>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* BASIC INFORMATION */}

            <section className="app-card p-5 sm:p-7">
              <div className="mb-7 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--green)] text-xl text-[var(--green-dark)]">
                  ✦
                </div>

                <div>
                  <p className="app-eyebrow">
                    Product information
                  </p>

                  <h2 className="mt-1 text-xl font-extrabold">
                    Basic details
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                    Enter the main information customers and
                    employees need.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Product name"
                  required
                  value={name}
                  onChange={setName}
                  placeholder="e.g. Hydrating Face Cream"
                  className="sm:col-span-2"
                />

                <Field
                  label="Brand"
                  required
                  value={brand}
                  onChange={setBrand}
                  placeholder="e.g. CeraVe"
                />

                <div>
                  <label className="app-label">
                    Price *
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--rose-dark)]">
                      $
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) =>
                        setPrice(e.target.value)
                      }
                      placeholder="0.00"
                      className="app-input pl-9"
                    />
                  </div>
                </div>

                <Field
                  label="Stock quantity"
                  required
                  value={stockQuantity}
                  onChange={setStockQuantity}
                  placeholder="0"
                  type="number"
                />

                {/* BARCODE */}

                <div>
                  <label className="app-label">
                    Barcode *
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={barcode}
                      onChange={(e) =>
                        setBarcode(e.target.value)
                      }
                      placeholder="Enter barcode"
                      className="app-input min-w-0 flex-1"
                    />

                    <button
                      type="button"
                      onClick={startScanner}
                      className="flex h-[47px] w-[52px] shrink-0 items-center justify-center rounded-[14px] bg-[var(--green)] text-lg text-[var(--green-dark)] shadow-sm transition hover:bg-[#d5e8d9] hover:-translate-y-0.5"
                      title="Scan barcode"
                    >
                      📷
                    </button>
                  </div>

                  <p className="mt-2 text-[10px] leading-4 text-[var(--muted)]">
                    Enter the barcode manually or scan it
                    using your camera.
                  </p>
                </div>

                {/* DESCRIPTION */}

                <div className="sm:col-span-2">
                  <label className="app-label">
                    Description
                    <span className="ml-1 font-normal text-[var(--muted)]">
                      Optional
                    </span>
                  </label>

                  <textarea
                    value={description}
                    onChange={(e) =>
                      setDescription(e.target.value)
                    }
                    rows={4}
                    placeholder="Add product information, benefits, ingredients or other useful details..."
                    className="app-textarea"
                  />
                </div>
              </div>
            </section>

            {/* IMAGE */}

            <section className="app-card overflow-hidden">
              <div className="border-b border-[var(--border)] p-5 sm:p-7">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--rose)] text-xl text-[var(--rose-dark)]">
                    ♡
                  </div>

                  <div>
                    <p className="app-eyebrow">
                      Product image
                    </p>

                    <h2 className="mt-1 text-xl font-extrabold">
                      Add a photo
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                      A clear product image makes your
                      inventory easier to recognize.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-7">
                {imagePreview ? (
                  <>
                    <div className="relative overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--green-light)]">
                      <div className="flex min-h-[280px] items-center justify-center p-6">
                        <img
                          src={imagePreview}
                          alt="Product preview"
                          className="max-h-[420px] w-full object-contain"
                        />
                      </div>

                      <div className="absolute right-3 top-3">
                        <button
                          type="button"
                          onClick={removeImage}
                          className="rounded-xl border border-[var(--border)] bg-white/95 px-4 py-2 text-xs font-bold text-[var(--rose-dark)] shadow-md backdrop-blur transition hover:bg-[var(--rose-light)]"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <ImageButton
                        label="Take another photo"
                        capture
                        primary
                        onChange={handleImageChange}
                      />

                      <ImageButton
                        label="Choose another image"
                        onChange={handleImageChange}
                      />
                    </div>
                  </>
                ) : (
                  <div className="upload-box">
                    <div className="upload-icon">
                      📷
                    </div>

                    <h3 className="mt-5 text-base font-extrabold">
                      Add product photo
                    </h3>

                    <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[var(--muted)]">
                      Take a new picture with your phone or
                      choose an existing product image.
                    </p>

                    <div className="mx-auto mt-6 grid max-w-md gap-3 sm:grid-cols-2">
                      <ImageButton
                        label="Take photo"
                        capture
                        primary
                        onChange={handleImageChange}
                      />

                      <ImageButton
                        label="Choose image"
                        onChange={handleImageChange}
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* SAVE */}

            <section className="app-card overflow-hidden">
              <div className="bg-[linear-gradient(135deg,var(--green-light),var(--rose-light))] p-5 sm:p-7">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="app-eyebrow">
                      Almost done
                    </p>

                    <h2 className="mt-1 text-lg font-extrabold">
                      Ready to add this product?
                    </h2>

                    <p className="mt-1 max-w-md text-xs leading-5 text-[var(--muted)]">
                      The product will immediately become
                      part of your store inventory.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="app-button app-button-rose w-full shadow-sm sm:w-auto"
                  >
                    {saving ? (
                      <>
                        <span className="mr-2 inline-block animate-spin">
                          ◌
                        </span>
                        Adding...
                      </>
                    ) : (
                      <>
                        Add Product
                        <span className="ml-2">
                          →
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>
          </form>
        </div>

        {/* BARCODE SCANNER MODAL */}

        {scannerOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4 backdrop-blur-md">
            <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-[var(--border)] bg-white shadow-2xl">
              {/* MODAL HEADER */}

              <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--rose-light)] px-5 py-4">
                <div>
                  <p className="app-eyebrow">
                    Barcode scanner
                  </p>

                  <h2 className="mt-1 text-lg font-extrabold">
                    Scan product
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={stopScanner}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg text-[var(--rose-dark)] shadow-sm transition hover:bg-[var(--rose)]"
                >
                  ×
                </button>
              </div>

              {/* CAMERA */}

              <div className="p-5">
                <div className="overflow-hidden rounded-[22px] bg-[#26302a]">
                  <div
                    id={scannerId}
                    className="min-h-[280px] w-full"
                  />
                </div>

                {scannerLoading && (
                  <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[var(--green-light)] px-4 py-3 text-xs font-bold text-[var(--green-dark)]">
                    <span className="animate-pulse">
                      ●
                    </span>
                    Starting camera...
                  </div>
                )}

                {scannerError && (
                  <div className="app-error mt-4">
                    <p className="font-bold">
                      Camera unavailable
                    </p>

                    <p className="mt-1 leading-5">
                      {scannerError}
                    </p>

                    <p className="mt-2">
                      You can close this window and enter
                      the barcode manually.
                    </p>
                  </div>
                )}

                {!scannerError && !scannerLoading && (
                  <div className="mt-4 rounded-2xl bg-[var(--green-light)] p-4 text-center">
                    <p className="text-xs font-bold text-[var(--green-dark)]">
                      Point your camera at the barcode
                    </p>

                    <p className="mt-1 text-[10px] leading-4 text-[var(--muted)]">
                      The barcode will be entered
                      automatically when detected.
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={stopScanner}
                  className="app-button app-button-light mt-5 w-full"
                >
                  Enter manually
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </EmployeeGuard>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = "text",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="app-label">
        {label}
        {required && " *"}
      </label>

      <input
        type={type}
        min={type === "number" ? "0" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="app-input"
      />
    </div>
  );
}

function ImageButton({
  label,
  primary = false,
  capture = false,
  onChange,
}: {
  label: string;
  primary?: boolean;
  capture?: boolean;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center justify-center gap-2 rounded-[14px] px-5 py-3.5 text-sm font-bold transition hover:-translate-y-0.5 ${
        primary
          ? "bg-[var(--green)] text-[var(--green-dark)] shadow-sm hover:bg-[#d5e8d9]"
          : "border border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-[var(--rose-light)] hover:border-[#edd0d5]"
      }`}
    >
      <span>
        {capture ? "📷" : "🖼️"}
      </span>

      {label}

      <input
        type="file"
        accept="image/*"
        capture={capture ? "environment" : undefined}
        onChange={onChange}
        className="hidden"
      />
    </label>
  );
}