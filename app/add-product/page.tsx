"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AddProductPage() {
  const router = useRouter();

  const [employee, setEmployee] = useState<any>(null);

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
  const scannerContainerId = "add-product-barcode-scanner";

  /* =========================================================
     EMPLOYEE LOGIN CHECK
  ========================================================= */

  useEffect(() => {
    const stored = localStorage.getItem("employee");

    if (!stored) {
      router.replace("/employee-login");
      return;
    }

    try {
      setEmployee(JSON.parse(stored));
    } catch {
      localStorage.removeItem("employee");
      router.replace("/employee-login");
    }
  }, [router]);

  /* =========================================================
     CLEAN UP SCANNER
  ========================================================= */

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  /* =========================================================
     IMAGE HANDLING
  ========================================================= */

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    setError("");
    setImageFile(file);

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview("");
  }

  /* =========================================================
     BARCODE SCANNER
  ========================================================= */

  async function startScanner() {
    setScannerError("");
    setScannerLoading(true);
    setScannerOpen(true);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      // Small delay so the scanner container exists
      await new Promise((resolve) =>
        setTimeout(resolve, 150)
      );

      const scanner = new Html5Qrcode(
        scannerContainerId
      );

      scannerRef.current = scanner;

      const config = {
        fps: 10,
        qrbox: {
          width: 280,
          height: 140,
        },
        aspectRatio: 1.7777778,
      };

      await scanner.start(
        {
          facingMode: "environment",
        },
        config,
        (decodedText: string) => {
          setBarcode(decodedText);
          stopScanner();
        },
        () => {
          // Ignore normal scanning failures.
        }
      );

      setScannerLoading(false);
    } catch (err: any) {
      console.error("Barcode scanner error:", err);

      setScannerLoading(false);

      setScannerError(
        "Unable to access the camera. Please make sure camera permission is allowed and that you are using HTTPS or localhost."
      );
    }
  }

  async function stopScanner() {
    try {
      if (scannerRef.current) {
        const scanner = scannerRef.current;

        if (scanner.isScanning) {
          await scanner.stop();
        }

        await scanner.clear();
        scannerRef.current = null;
      }
    } catch (err) {
      console.error("Error stopping scanner:", err);
    }

    setScannerOpen(false);
    setScannerLoading(false);
  }

  /* =========================================================
     SAVE PRODUCT
  ========================================================= */

  async function handleSubmit(
    event: React.FormEvent
  ) {
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

    if (
      stockQuantity === "" ||
      Number(stockQuantity) < 0
    ) {
      setError("Please enter a valid stock quantity.");
      return;
    }

    setSaving(true);

    try {
      let imageUrl: string | null = null;

      /* ---------------------------------------------
         UPLOAD IMAGE
      --------------------------------------------- */

      if (imageFile) {
        const fileExtension =
          imageFile.name.split(".").pop() || "jpg";

        const fileName = `${crypto.randomUUID()}.${fileExtension}`;

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

        const { data: publicUrlData } =
          supabase.storage
            .from("products")
            .getPublicUrl(filePath);

        imageUrl =
          publicUrlData.publicUrl;
      }

      /* ---------------------------------------------
         INSERT PRODUCT
      --------------------------------------------- */

      const { error: insertError } =
        await supabase.from("products").insert({
          name: name.trim(),
          brand: brand.trim(),
          barcode: barcode.trim(),
          price: Number(price),
          stock_quantity: Number(stockQuantity),
          description:
            description.trim() || null,
          image_url: imageUrl,
        });

      if (insertError) {
        throw new Error(
          `Product could not be added: ${insertError.message}`
        );
      }

      setMessage(
        "Product added successfully!"
      );

      /* ---------------------------------------------
         CLEAR FORM
      --------------------------------------------- */

      setName("");
      setBrand("");
      setBarcode("");
      setPrice("");
      setStockQuantity("");
      setDescription("");
      setImageFile(null);
      setImagePreview("");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err: any) {
      console.error("Add product error:", err);

      setError(
        err?.message ||
          "Something went wrong while adding the product."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!employee) {
    return null;
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#fbf8f7] text-[#292425]">
      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-[#eadedf] bg-[#fbf8f7]/95 backdrop-blur">
        <div className="mx-auto flex min-h-[70px] max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#dfeadd] text-xl">
              🛍️
            </div>

            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold uppercase tracking-[0.2em] text-[#a45d6b]">
                Ward Cosmetics
              </p>

              <p className="truncate text-sm font-bold">
                Add Product
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/home")
            }
            className="shrink-0 rounded-full border border-[#e7dcdc] bg-white px-4 py-2 text-xs font-bold text-[#665b5d] transition hover:bg-[#fff0f2]"
          >
            ← Back
          </button>
        </div>
      </header>

      {/* CONTENT */}

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        {/* TITLE */}

        <div className="mb-7">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#e5efdf] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#52634e]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#a45d6b]" />
            Employee
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Add a new product
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-[#807476]">
            Add the product information, scan or enter
            its barcode, and upload a product image.
          </p>
        </div>

        {/* SUCCESS */}

        {message && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#cfe0c8] bg-[#edf6e9] p-4 text-sm text-[#4d6749]">
            <span className="text-lg">
              ✓
            </span>

            <div>
              <p className="font-bold">
                Product added
              </p>

              <p className="mt-0.5">
                {message}
              </p>
            </div>
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#efd4d8] bg-[#fff3f4] p-4 text-sm text-[#a45d6b]">
            <span className="font-bold">
              !
            </span>

            <p>{error}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* BASIC INFORMATION */}

          <section className="rounded-[28px] border border-[#eadedf] bg-white p-5 shadow-[0_8px_30px_rgba(80,50,50,0.05)] sm:p-7">
            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a45d6b]">
                Product information
              </p>

              <h2 className="mt-1 text-xl font-bold">
                Basic details
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* NAME */}

              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs font-bold text-[#51484a]">
                  Product name *
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="e.g. Hydrating Face Cream"
                  className="w-full rounded-2xl border border-[#e5dcdc] bg-[#fffdfc] px-4 py-3.5 text-sm outline-none transition placeholder:text-[#aaa0a2] focus:border-[#a45d6b] focus:ring-4 focus:ring-[#a45d6b]/10"
                />
              </div>

              {/* BRAND */}

              <div>
                <label className="mb-2 block text-xs font-bold text-[#51484a]">
                  Brand *
                </label>

                <input
                  type="text"
                  value={brand}
                  onChange={(e) =>
                    setBrand(e.target.value)
                  }
                  placeholder="e.g. CeraVe"
                  className="w-full rounded-2xl border border-[#e5dcdc] bg-[#fffdfc] px-4 py-3.5 text-sm outline-none transition placeholder:text-[#aaa0a2] focus:border-[#a45d6b] focus:ring-4 focus:ring-[#a45d6b]/10"
                />
              </div>

              {/* PRICE */}

              <div>
                <label className="mb-2 block text-xs font-bold text-[#51484a]">
                  Price *
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#8f8385]">
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
                    className="w-full rounded-2xl border border-[#e5dcdc] bg-[#fffdfc] py-3.5 pl-9 pr-4 text-sm outline-none transition placeholder:text-[#aaa0a2] focus:border-[#a45d6b] focus:ring-4 focus:ring-[#a45d6b]/10"
                  />
                </div>
              </div>

              {/* STOCK */}

              <div>
                <label className="mb-2 block text-xs font-bold text-[#51484a]">
                  Stock quantity *
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={stockQuantity}
                  onChange={(e) =>
                    setStockQuantity(e.target.value)
                  }
                  placeholder="0"
                  className="w-full rounded-2xl border border-[#e5dcdc] bg-[#fffdfc] px-4 py-3.5 text-sm outline-none transition placeholder:text-[#aaa0a2] focus:border-[#a45d6b] focus:ring-4 focus:ring-[#a45d6b]/10"
                />
              </div>

              {/* BARCODE */}

              <div>
                <label className="mb-2 block text-xs font-bold text-[#51484a]">
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
                    className="min-w-0 flex-1 rounded-2xl border border-[#e5dcdc] bg-[#fffdfc] px-4 py-3.5 text-sm outline-none transition placeholder:text-[#aaa0a2] focus:border-[#a45d6b] focus:ring-4 focus:ring-[#a45d6b]/10"
                  />

                  <button
                    type="button"
                    onClick={startScanner}
                    className="flex shrink-0 items-center justify-center rounded-2xl bg-[#e4eee0] px-4 text-lg text-[#52634e] transition hover:bg-[#d8e7d2]"
                    aria-label="Scan barcode"
                    title="Scan barcode"
                  >
                    📷
                  </button>
                </div>

                <p className="mt-2 text-[10px] leading-4 text-[#9a8d8f]">
                  Enter the barcode manually or use the
                  camera scanner.
                </p>
              </div>

              {/* DESCRIPTION */}

              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs font-bold text-[#51484a]">
                  Description
                  <span className="ml-1 font-normal text-[#aaa0a2]">
                    (optional)
                  </span>
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Add product details..."
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-[#e5dcdc] bg-[#fffdfc] px-4 py-3.5 text-sm outline-none transition placeholder:text-[#aaa0a2] focus:border-[#a45d6b] focus:ring-4 focus:ring-[#a45d6b]/10"
                />
              </div>
            </div>
          </section>

          {/* IMAGE */}

          <section className="rounded-[28px] border border-[#eadedf] bg-white p-5 shadow-[0_8px_30px_rgba(80,50,50,0.05)] sm:p-7">
            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a45d6b]">
                Product image
              </p>

              <h2 className="mt-1 text-xl font-bold">
                Add a photo
              </h2>

              <p className="mt-1 text-xs text-[#918688]">
                Take a new photo or choose one from your
                device.
              </p>
            </div>

            {imagePreview ? (
              <div className="relative overflow-hidden rounded-[24px] border border-[#eadedf] bg-[#f5f1f0]">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="max-h-[420px] w-full object-contain"
                />

                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute right-3 top-3 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#a45d6b] shadow-lg transition hover:bg-[#fff0f2]"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="rounded-[24px] border-2 border-dashed border-[#dfd3d4] bg-[#fcfaf9] p-6 text-center sm:p-10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#e4eee0] text-2xl">
                  📷
                </div>

                <h3 className="mt-4 text-sm font-bold">
                  Add product photo
                </h3>

                <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[#938789]">
                  Use your camera to take a new photo or
                  select an existing image.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:max-w-md sm:mx-auto">
                  {/* CAMERA */}

                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#a45d6b] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#914f5c]">
                    📷
                    Take photo

                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>

                  {/* GALLERY */}

                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#e5dcdc] bg-white px-5 py-3.5 text-sm font-bold text-[#51484a] transition hover:bg-[#fff4f5]"
                  >
                    🖼️
                    Choose image

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Change image buttons */}

            {imagePreview && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#e5dcdc] bg-white px-5 py-3 text-xs font-bold text-[#51484a] transition hover:bg-[#fff4f5]">
                  📷
                  Take another photo

                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#e5dcdc] bg-white px-5 py-3 text-xs font-bold text-[#51484a] transition hover:bg-[#fff4f5]">
                  🖼️
                  Choose another image

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </section>

          {/* SUBMIT */}

          <div className="rounded-[28px] border border-[#eadedf] bg-white p-5 shadow-[0_8px_30px_rgba(80,50,50,0.05)] sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold">
                  Ready to add this product?
                </p>

                <p className="mt-1 text-xs text-[#938789]">
                  The product will be added to your store
                  inventory.
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-[#a45d6b] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#a45d6b]/20 transition hover:bg-[#914f5c] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {saving
                  ? "Adding product..."
                  : "Add Product"}
              </button>
            </div>
          </div>
        </form>

        <footer className="py-8 text-center">
          <p className="text-[10px] font-bold text-[#9a8d8f]">
            Ward Cosmetics · Store Management
          </p>
        </footer>
      </div>

      {/* =========================================================
          BARCODE SCANNER MODAL
      ========================================================= */}

      {scannerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[30px] bg-white shadow-2xl">
            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-[#eee5e5] px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a45d6b]">
                  Barcode
                </p>

                <h2 className="mt-0.5 text-lg font-bold">
                  Scan product
                </h2>
              </div>

              <button
                type="button"
                onClick={stopScanner}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f6f1f1] text-lg text-[#655b5d] transition hover:bg-[#fff0f2]"
              >
                ×
              </button>
            </div>

            {/* SCANNER */}

            <div className="p-4">
              <div className="overflow-hidden rounded-[22px] bg-black">
                <div
                  id={scannerContainerId}
                  className="min-h-[280px] w-full"
                />
              </div>

              {scannerLoading && (
                <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-[#766b6d]">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#d9cacc] border-t-[#a45d6b]" />
                  Starting camera...
                </div>
              )}

              {scannerError && (
                <div className="mt-4 rounded-2xl border border-[#efd4d8] bg-[#fff3f4] p-4 text-xs leading-5 text-[#a45d6b]">
                  <p className="font-bold">
                    Camera unavailable
                  </p>

                  <p className="mt-1">
                    {scannerError}
                  </p>

                  <p className="mt-2">
                    You can close this window and enter
                    the barcode manually instead.
                  </p>
                </div>
              )}

              {!scannerError && (
                <p className="mt-4 text-center text-xs leading-5 text-[#8f8385]">
                  Point the camera at the product barcode.
                  The barcode will be entered automatically
                  when detected.
                </p>
              )}

              <button
                type="button"
                onClick={stopScanner}
                className="mt-5 w-full rounded-2xl border border-[#e5dcdc] bg-white px-5 py-3 text-sm font-bold text-[#51484a] transition hover:bg-[#fff4f5]"
              >
                Enter barcode manually
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}