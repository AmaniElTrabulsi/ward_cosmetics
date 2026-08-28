"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Html5Qrcode } from "html5-qrcode";

type Product = {
  id: string;
  brand: string;
  name: string;
  price: number;
  stock_quantity: number | null;
  image_url: string | null;
  barcode: string | null;
  created_at: string | null;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  /*
   * LOAD PRODUCTS
   */
  useEffect(() => {
    loadProducts();

    return () => {
      stopScanner();
    };
  }, []);

  async function loadProducts() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("products")
      .select(
        "id, brand, name, price, stock_quantity, image_url, barcode, created_at"
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      setError(error.message);
      setProducts([]);
      setFilteredProducts([]);
      setLoading(false);
      return;
    }

    const loadedProducts = (data || []) as Product[];

    setProducts(loadedProducts);
    setFilteredProducts(loadedProducts);
    setLoading(false);
  }

  /*
   * SEARCH
   */
  useEffect(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      setFilteredProducts(products);
      return;
    }

    const results = products.filter((product) => {
      return (
        product.name?.toLowerCase().includes(query) ||
        product.brand?.toLowerCase().includes(query) ||
        product.barcode?.toLowerCase().includes(query)
      );
    });

    setFilteredProducts(results);
  }, [search, products]);

  /*
   * OPEN PRODUCT
   */
  function openProduct(product: Product) {
    setSelectedProduct(product);

    setImageFile(null);
    setImagePreview(product.image_url || null);
    setMessage("");
    setError("");
  }

  /*
   * CLOSE PRODUCT
   */
  function closeProduct() {
    setSelectedProduct(null);
    setImageFile(null);
    setImagePreview(null);
  }

  /*
   * IMAGE SELECT
   */
  function handleImageSelected(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setImageFile(file);

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  }

  /*
   * START BARCODE SCANNER
   */
  async function startScanner() {
    setScannerError("");
    setScannerOpen(true);

    setTimeout(async () => {
      try {
        const element = document.getElementById("barcode-reader");

        if (!element) {
          setScannerError("Scanner could not be initialized.");
          return;
        }

        await stopScanner();

        const scanner = new Html5Qrcode("barcode-reader");

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
          async (decodedText) => {
            await handleBarcodeScanned(decodedText);
          },
          () => {
            // Ignore normal scanning failures.
          }
        );
      } catch (err) {
        console.error("Scanner error:", err);

        setScannerError(
          "Unable to access the camera. Please make sure camera permission is allowed and that you are using HTTPS or localhost."
        );
      }
    }, 150);
  }

  /*
   * STOP BARCODE SCANNER
   */
  async function stopScanner() {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();

        if (state === 2) {
          await scannerRef.current.stop();
        }

        await scannerRef.current.clear();
      } catch (error) {
        console.log("Scanner already stopped.");
      }

      scannerRef.current = null;
    }
  }

  /*
   * CLOSE SCANNER
   */
  async function closeScanner() {
    await stopScanner();
    setScannerOpen(false);
    setScannerError("");
  }

  /*
   * BARCODE RESULT
   */
  async function handleBarcodeScanned(barcode: string) {
    await stopScanner();
    setScannerOpen(false);

    const cleanBarcode = barcode.trim();

    setSearch(cleanBarcode);

    const product = products.find(
      (item) =>
        item.barcode?.trim() === cleanBarcode
    );

    if (product) {
      openProduct(product);
      return;
    }

    setMessage(`No product found for barcode ${cleanBarcode}.`);
  }

  /*
   * SAVE PRODUCT
   */
  async function saveProduct() {
    if (!selectedProduct) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      let imageUrl = selectedProduct.image_url;

      /*
       * UPLOAD NEW IMAGE
       */
      if (imageFile) {
        const fileExtension =
          imageFile.name.split(".").pop() || "jpg";

        const fileName = `${selectedProduct.id}-${Date.now()}.${fileExtension}`;

        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(filePath, imageFile, {
            upsert: true,
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

        imageUrl = publicUrlData.publicUrl;
      }

      /*
       * UPDATE DATABASE
       */
      const { data, error: updateError } = await supabase
        .from("products")
        .update({
          brand: selectedProduct.brand,
          name: selectedProduct.name,
          price: Number(selectedProduct.price),
          stock_quantity:
            selectedProduct.stock_quantity === null
              ? 0
              : Number(selectedProduct.stock_quantity),
          barcode: selectedProduct.barcode,
          image_url: imageUrl,
        })
        .eq("id", selectedProduct.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      const updatedProduct = data as Product;

      setProducts((current) =>
        current.map((product) =>
          product.id === updatedProduct.id
            ? updatedProduct
            : product
        )
      );

      setSelectedProduct(updatedProduct);
      setImageFile(null);
      setImagePreview(updatedProduct.image_url);

      setMessage("Product updated successfully.");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * CHANGE PRODUCT FIELD
   */
  function updateSelectedProduct(
    field: keyof Product,
    value: string | number | null
  ) {
    if (!selectedProduct) return;

    setSelectedProduct({
      ...selectedProduct,
      [field]: value,
    });
  }

  return (
    <main className="min-h-screen bg-[#faf8f7] text-[#292425]">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-[#eadedf] bg-[#faf8f7]/95 backdrop-blur">
        <div className="mx-auto flex min-h-[70px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#dfeadd] text-xl">
              🛍️
            </div>

            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#a45d6b]">
                Ward Cosmetics
              </p>

              <h1 className="truncate text-base font-bold sm:text-lg">
                Products
              </h1>
            </div>
          </div>

          <div className="rounded-full bg-[#e4eee0] px-3 py-2 text-xs font-bold text-[#4e6949] sm:px-4">
            {products.length} products
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-10">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[30px] bg-[#dfeadd] p-6 sm:p-9">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#eccbd2]" />

          <div className="absolute -bottom-24 left-20 h-48 w-48 rounded-full bg-[#cbdcc6]" />

          <div className="relative">
            <span className="inline-flex rounded-full bg-white/75 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#52634e]">
              Employee workspace
            </span>

            <h2 className="mt-4 max-w-xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              Find a product.
              <br />
              <span className="text-[#a45d6b]">
                Scan it. Edit it.
              </span>
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-6 text-[#5c6959] sm:text-base">
              Search your product inventory or scan a barcode
              using your device camera.
            </p>
          </div>
        </section>

        {/* SEARCH + SCAN */}
        <section className="mt-7">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <svg
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a79b9d]"
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search product or brand..."
                className="w-full rounded-2xl border border-[#e7dcdc] bg-white py-4 pl-12 pr-4 text-sm shadow-sm outline-none transition focus:border-[#a45d6b] focus:ring-4 focus:ring-[#a45d6b]/10"
              />
            </div>

            <button
              type="button"
              onClick={startScanner}
              className="flex min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-[#a45d6b] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[#914f5c] active:scale-[0.98]"
            >
              <span className="text-lg">📷</span>
              Scan Barcode
            </button>
          </div>

          {message && (
            <div className="mt-3 rounded-2xl border border-[#dce8d8] bg-[#eef6eb] px-4 py-3 text-sm font-medium text-[#4e6949]">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-2xl border border-[#efd4d8] bg-[#fff3f4] px-4 py-3 text-sm font-medium text-[#a45d6b]">
              {error}
            </div>
          )}
        </section>

        {/* PRODUCTS */}
        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a45d6b]">
                Inventory
              </p>

              <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
                Products
              </h2>
            </div>

            <p className="text-xs text-[#95898b]">
              {filteredProducts.length} shown
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-[24px] border border-[#eadedf] bg-white"
                >
                  <div className="aspect-square animate-pulse bg-[#f0ebeb]" />

                  <div className="space-y-3 p-4">
                    <div className="h-3 w-16 animate-pulse rounded bg-[#eee8e8]" />
                    <div className="h-4 w-28 animate-pulse rounded bg-[#eee8e8]" />
                    <div className="h-4 w-16 animate-pulse rounded bg-[#eee8e8]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-[28px] border border-[#eadedf] bg-white p-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#f4e3e6] text-2xl">
                🔍
              </div>

              <h3 className="mt-5 text-lg font-bold">
                No products found
              </h3>

              <p className="mt-2 text-sm text-[#918688]">
                Try another product name, brand, or barcode.
              </p>

              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-5 rounded-full bg-[#a45d6b] px-5 py-2.5 text-sm font-bold text-white"
              >
                Show all products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {filteredProducts.map((product) => {
                const stock = product.stock_quantity ?? 0;
                const available = stock > 0;

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => openProduct(product)}
                    className="group overflow-hidden rounded-[22px] border border-[#eadedf] bg-white text-left shadow-[0_4px_20px_rgba(80,50,50,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(80,50,50,0.11)] sm:rounded-[28px]"
                  >
                    <div className="relative aspect-square overflow-hidden bg-[#f1eded]">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e3eddf] text-2xl">
                            🧴
                          </div>
                        </div>
                      )}

                      <div className="absolute left-2 top-2 sm:left-3 sm:top-3">
                        {available ? (
                          <span className="rounded-full bg-[#e3efdf] px-2 py-1 text-[9px] font-bold text-[#4d6749] shadow-sm sm:px-3 sm:py-1.5 sm:text-xs">
                            In stock
                          </span>
                        ) : (
                          <span className="rounded-full bg-[#403a3b] px-2 py-1 text-[9px] font-bold text-white">
                            Sold out
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 sm:p-5">
                      <p className="truncate text-[9px] font-bold uppercase tracking-[0.12em] text-[#a45d6b] sm:text-[11px]">
                        {product.brand}
                      </p>

                      <h3 className="mt-1 line-clamp-2 min-h-[36px] text-xs font-bold leading-5 sm:min-h-[48px] sm:text-base">
                        {product.name}
                      </h3>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold sm:text-lg">
                            ${Number(product.price).toFixed(2)}
                          </p>

                          <p className="text-[9px] text-[#998e90] sm:text-xs">
                            {available
                              ? `${stock} available`
                              : "Unavailable"}
                          </p>
                        </div>

                        <span className="rounded-xl bg-[#a45d6b] px-3 py-2 text-[9px] font-bold text-white sm:px-4 sm:text-xs">
                          Edit
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* FOOTER */}
        <footer className="mt-14 border-t border-[#eadedf] py-7 text-center">
          <p className="text-xs font-bold text-[#8f8385]">
            Ward Cosmetics · Employee Products
          </p>
        </footer>
      </div>

      {/* ================================================= */}
      {/* BARCODE SCANNER */}
      {/* ================================================= */}

      {scannerOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-[30px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#eee5e5] px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a45d6b]">
                  Barcode scanner
                </p>

                <h2 className="mt-1 text-lg font-bold">
                  Scan a product
                </h2>
              </div>

              <button
                type="button"
                onClick={closeScanner}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5eeee] text-xl text-[#5b5153]"
              >
                ×
              </button>
            </div>

            <div className="p-5">
              <div className="relative overflow-hidden rounded-[24px] bg-black">
                <div
                  id="barcode-reader"
                  className="min-h-[300px] w-full"
                />

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-[130px] w-[280px] rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
                </div>
              </div>

              {scannerError && (
                <div className="mt-4 rounded-2xl bg-[#fff3f4] p-4 text-sm leading-6 text-[#a45d6b]">
                  {scannerError}
                </div>
              )}

              <p className="mt-4 text-center text-xs leading-5 text-[#8f8385]">
                Point the camera at the product barcode.
                The product will open automatically when
                it is recognized.
              </p>

              <button
                type="button"
                onClick={closeScanner}
                className="mt-5 w-full rounded-2xl border border-[#e7dcdc] bg-white py-3.5 text-sm font-bold text-[#5d5556]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* EDIT PRODUCT MODAL */}
      {/* ================================================= */}

      {selectedProduct && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={closeProduct}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
            className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-[30px] bg-white shadow-2xl"
          >
            {/* MODAL HEADER */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#eee5e5] bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a45d6b]">
                  Product information
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  Edit product
                </h2>
              </div>

              <button
                type="button"
                onClick={closeProduct}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5eeee] text-xl text-[#5b5153]"
              >
                ×
              </button>
            </div>

            <div className="p-5 sm:p-7">
              {/* IMAGE */}
              <div className="overflow-hidden rounded-[26px] bg-[#f2eeee]">
                <div className="relative aspect-square max-h-[420px]">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt={selectedProduct.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-[#e3eddf] text-4xl">
                        🧴
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* IMAGE BUTTONS */}
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    cameraInputRef.current?.click()
                  }
                  className="rounded-2xl bg-[#a45d6b] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#914f5c]"
                >
                  📷 Take Photo
                </button>

                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="rounded-2xl border border-[#e7dcdc] bg-white px-4 py-3 text-sm font-bold text-[#5d5556]"
                >
                  🖼️ Choose Image
                </button>
              </div>

              {/* CAMERA INPUT */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageSelected}
              />

              {/* DEVICE IMAGE INPUT */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelected}
              />

              {/* FORM */}
              <div className="mt-7 space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#817577]">
                    Brand
                  </label>

                  <input
                    type="text"
                    value={selectedProduct.brand || ""}
                    onChange={(e) =>
                      updateSelectedProduct(
                        "brand",
                        e.target.value
                      )
                    }
                    className="w-full rounded-2xl border border-[#e7dcdc] bg-[#fcfaf9] px-4 py-3.5 text-sm font-medium outline-none focus:border-[#a45d6b] focus:ring-4 focus:ring-[#a45d6b]/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#817577]">
                    Product name
                  </label>

                  <input
                    type="text"
                    value={selectedProduct.name || ""}
                    onChange={(e) =>
                      updateSelectedProduct(
                        "name",
                        e.target.value
                      )
                    }
                    className="w-full rounded-2xl border border-[#e7dcdc] bg-[#fcfaf9] px-4 py-3.5 text-sm font-medium outline-none focus:border-[#a45d6b] focus:ring-4 focus:ring-[#a45d6b]/10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#817577]">
                      Price
                    </label>

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={selectedProduct.price}
                      onChange={(e) =>
                        updateSelectedProduct(
                          "price",
                          Number(e.target.value)
                        )
                      }
                      className="w-full rounded-2xl border border-[#e7dcdc] bg-[#fcfaf9] px-4 py-3.5 text-sm font-medium outline-none focus:border-[#a45d6b] focus:ring-4 focus:ring-[#a45d6b]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#817577]">
                      Stock
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={selectedProduct.stock_quantity ?? 0}
                      onChange={(e) =>
                        updateSelectedProduct(
                          "stock_quantity",
                          Number(e.target.value)
                        )
                      }
                      className="w-full rounded-2xl border border-[#e7dcdc] bg-[#fcfaf9] px-4 py-3.5 text-sm font-medium outline-none focus:border-[#a45d6b] focus:ring-4 focus:ring-[#a45d6b]/10"
                    />
                  </div>
                </div>

                {/* BARCODE */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#817577]">
                    Barcode
                  </label>

                  <input
                    type="text"
                    value={selectedProduct.barcode || ""}
                    onChange={(e) =>
                      updateSelectedProduct(
                        "barcode",
                        e.target.value
                      )
                    }
                    placeholder="Enter barcode"
                    className="w-full rounded-2xl border border-[#e7dcdc] bg-[#fcfaf9] px-4 py-3.5 text-sm font-medium outline-none focus:border-[#a45d6b] focus:ring-4 focus:ring-[#a45d6b]/10"
                  />

                  <p className="mt-2 text-[11px] text-[#9b9091]">
                    This barcode is used by the employee scanner.
                  </p>
                </div>
              </div>

              {/* SAVE MESSAGE */}
              {message && (
                <div className="mt-5 rounded-2xl bg-[#eef6eb] px-4 py-3 text-sm font-semibold text-[#4e6949]">
                  {message}
                </div>
              )}

              {error && (
                <div className="mt-5 rounded-2xl bg-[#fff3f4] px-4 py-3 text-sm font-semibold text-[#a45d6b]">
                  {error}
                </div>
              )}

              {/* ACTIONS */}
              <div className="mt-7 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={closeProduct}
                  disabled={saving}
                  className="rounded-2xl border border-[#e7dcdc] bg-white px-4 py-3.5 text-sm font-bold text-[#5d5556]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveProduct}
                  disabled={saving}
                  className="rounded-2xl bg-[#a45d6b] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#914f5c] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}