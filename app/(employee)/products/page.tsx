"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import EmployeeGuard from "@/components/EmployeeGuard";
import { supabase } from "@/lib/supabase";
import { Html5Qrcode } from "html5-qrcode";

type Product = {
  id: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  price: number | null;
  stock_quantity: number | null;
  image_url: string | null;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // EDIT PRODUCT
  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [editName, setEditName] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editBarcode, setEditBarcode] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // BARCODE SCANNER
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [scannerLoading, setScannerLoading] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);

  // ============================================================
  // LOAD PRODUCTS
  // ============================================================

  async function loadProducts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("LOAD PRODUCTS ERROR:", error);
      setProducts([]);
    } else {
      setProducts((data || []) as Product[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadProducts();

    const channel = supabase
      .channel("products-page")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        () => {
          loadProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ============================================================
  // SEARCH
  // ============================================================

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return products;

    return products.filter((product) => {
      return (
        product.name?.toLowerCase().includes(query) ||
        product.brand?.toLowerCase().includes(query) ||
        product.barcode?.toLowerCase().includes(query)
      );
    });
  }, [products, search]);

  // ============================================================
  // OPEN EDITOR
  // ============================================================

  function openEditor(product: Product) {
    setSelectedProduct(product);

    setEditName(product.name || "");
    setEditBrand(product.brand || "");
    setEditBarcode(product.barcode || "");

    setEditPrice(
      product.price !== null && product.price !== undefined
        ? String(product.price)
        : ""
    );

    setEditStock(
      product.stock_quantity !== null &&
        product.stock_quantity !== undefined
        ? String(product.stock_quantity)
        : ""
    );

    setEditImageUrl(product.image_url || "");

    setMessage("");
    setErrorMessage("");

    document.body.style.overflow = "hidden";
  }

  function closeEditor() {
    if (saving || deleting) return;

    setSelectedProduct(null);
    setMessage("");
    setErrorMessage("");

    document.body.style.overflow = "";
  }

  // ============================================================
  // BARCODE SCANNER
  // ============================================================

  async function stopScanner() {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();

        if (state === 2) {
          await scannerRef.current.stop();
        }

        await scannerRef.current.clear();
      }
    } catch (error) {
      console.error("STOP SCANNER ERROR:", error);
    }

    scannerRef.current = null;
  }

  async function closeScanner() {
    await stopScanner();

    setScannerOpen(false);
    setScannerError("");
    setScannerLoading(false);

    document.body.style.overflow = "";
  }

  async function startScanner() {
    setScannerError("");
    setScannerLoading(true);

    await stopScanner();

    try {
      const scanner = new Html5Qrcode("products-barcode-reader");

      scannerRef.current = scanner;

      await scanner.start(
        {
          facingMode: "environment",
        },
        {
          fps: 10,
          qrbox: {
            width: 280,
            height: 160,
          },
          aspectRatio: 1.777,
        },
        async (decodedText) => {
          const barcode = decodedText.trim();

          if (!barcode) return;

          setSearch(barcode);

          await stopScanner();

          setScannerOpen(false);
          setScannerLoading(false);

          document.body.style.overflow = "";

          // Find exact barcode
          const product = products.find(
            (item) =>
              item.barcode?.trim().toLowerCase() ===
              barcode.toLowerCase()
          );

          if (product) {
            openEditor(product);
            return;
          }

          // If local list didn't contain it, check Supabase
          const { data, error } = await supabase
            .from("products")
            .select("*")
            .eq("barcode", barcode)
            .maybeSingle();

          if (error) {
            console.error(
              "BARCODE PRODUCT SEARCH ERROR:",
              error
            );

            setScannerError(
              "The product could not be searched. Please try again."
            );

            return;
          }

          if (data) {
            openEditor(data as Product);
          } else {
            setSearch(barcode);

            window.setTimeout(() => {
              alert(
                `No product was found with barcode "${barcode}".`
              );
            }, 100);
          }
        },
        () => {
          // Ignore normal scanner frame errors.
        }
      );

      setScannerLoading(false);
    } catch (error: any) {
      console.error("START SCANNER ERROR:", error);

      setScannerLoading(false);

      setScannerError(
        error?.message ||
          "Could not access the camera. Please allow camera access and try again."
      );
    }
  }

  function openScanner() {
    setScannerError("");
    setScannerOpen(true);
    setScannerLoading(true);

    document.body.style.overflow = "hidden";

    setTimeout(() => {
      startScanner();
    }, 150);
  }

  // ============================================================
  // SAVE PRODUCT
  // ============================================================

  async function saveProduct() {
    if (!selectedProduct) return;

    setMessage("");
    setErrorMessage("");

    const cleanName = editName.trim();
    const cleanBrand = editBrand.trim();
    const cleanBarcode = editBarcode.trim();

    if (!cleanName) {
      setErrorMessage("Please enter a product name.");
      return;
    }

    if (!cleanBrand) {
      setErrorMessage("Please enter a brand.");
      return;
    }

    if (!cleanBarcode) {
      setErrorMessage("Please enter a barcode.");
      return;
    }

    if (
      editPrice === "" ||
      Number.isNaN(Number(editPrice)) ||
      Number(editPrice) < 0
    ) {
      setErrorMessage("Please enter a valid price.");
      return;
    }

    if (
      editStock === "" ||
      Number.isNaN(Number(editStock)) ||
      Number(editStock) < 0
    ) {
      setErrorMessage("Please enter a valid stock quantity.");
      return;
    }

    setSaving(true);

    try {
      const updateData = {
        name: cleanName,
        brand: cleanBrand,
        barcode: cleanBarcode,
        price: Number(editPrice),
        stock_quantity: Number(editStock),
        image_url: editImageUrl.trim() || null,
      };

      console.log(
        "Updating product:",
        selectedProduct.id
      );

      console.log("Update data:", updateData);

      const { data, error } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", selectedProduct.id)
        .select()
        .single();

      if (error) {
        console.error(
          "SUPABASE UPDATE ERROR:",
          error
        );

        console.error(
          "Supabase error details:",
          JSON.stringify(error, null, 2)
        );

        throw new Error(error.message);
      }

      if (!data) {
        throw new Error(
          "The product could not be updated."
        );
      }

      const updatedProduct = data as Product;

      setProducts((previous) =>
        previous
          .map((product) =>
            product.id === updatedProduct.id
              ? updatedProduct
              : product
          )
          .sort((a, b) =>
            a.name.localeCompare(b.name)
          )
      );

      setSelectedProduct(updatedProduct);

      setMessage(
        "Product updated successfully."
      );

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (error: any) {
      console.error(
        "SAVE PRODUCT ERROR:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Something went wrong while saving the product."
      );
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // DELETE PRODUCT
  // ============================================================

  async function deleteProduct() {
    if (!selectedProduct) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${selectedProduct.name}"?`
    );

    if (!confirmed) return;

    setDeleting(true);
    setErrorMessage("");
    setMessage("");

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", selectedProduct.id);

      if (error) {
        console.error(
          "SUPABASE DELETE ERROR:",
          error
        );

        throw new Error(error.message);
      }

      setProducts((previous) =>
        previous.filter(
          (product) =>
            product.id !== selectedProduct.id
        )
      );

      setSelectedProduct(null);
      document.body.style.overflow = "";
    } catch (error: any) {
      console.error(
        "DELETE PRODUCT ERROR:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Something went wrong while deleting the product."
      );
    } finally {
      setDeleting(false);
    }
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <EmployeeGuard>
      <main className="employee-page min-h-screen px-4 py-7 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">

          {/* HEADER */}

          <div className="mb-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--rose-light)] px-3 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-[var(--rose)]" />

                  <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--rose-dark)]">
                    Inventory
                  </span>
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)] sm:text-4xl">
                  Products
                </h1>

                <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-muted)]">
                  Search your inventory, scan a barcode,
                  or select a product to view and edit
                  its details.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  window.location.href =
                    "/add-product";
                }}
                className="group flex items-center justify-center gap-2 rounded-2xl bg-[var(--rose)] px-5 py-3.5 text-sm font-extrabold text-[var(--rose-dark)] shadow-lg shadow-rose-200/50 transition hover:-translate-y-0.5 hover:bg-[var(--rose-dark)] hover:text-white"
              >
                <span className="text-lg transition group-hover:rotate-90">
                  +
                </span>

                Add Product
              </button>
            </div>
          </div>

          {/* SEARCH + SCAN */}

          <section className="mb-6 rounded-[26px] border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row">

              {/* SEARCH */}

              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[var(--rose-dark)]">
                  ⌕
                </span>

                <input
                  type="search"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search by name, brand or barcode..."
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] py-3.5 pl-11 pr-4 text-sm font-medium text-[var(--text)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--rose)] focus:bg-white focus:ring-4 focus:ring-rose-100"
                />
              </div>

              {/* SCAN */}

              <button
                type="button"
                onClick={openScanner}
                className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-[var(--green)] px-5 text-sm font-extrabold text-[var(--green-dark)] shadow-sm transition hover:bg-[var(--green-dark)] hover:text-white sm:min-w-[170px]"
              >
                <span className="text-lg">
                  ▦
                </span>

                Scan Barcode
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2 px-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--green-dark)]" />

              <p className="text-[11px] font-medium text-[var(--text-muted)]">
                Scan a product barcode to open its
                details instantly.
              </p>
            </div>
          </section>

          {/* SUMMARY */}

          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-extrabold text-[var(--text)]">
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1
                  ? "product"
                  : "products"}
              </p>

              {search && (
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  Results for "{search}"
                </p>
              )}
            </div>

            {loading && (
              <div className="flex items-center gap-2 rounded-full bg-[var(--green-light)] px-3 py-1.5">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--green-dark)]" />

                <span className="text-xs font-bold text-[var(--green-dark)]">
                  Updating
                </span>
              </div>
            )}
          </div>

          {/* PRODUCTS */}

          {filteredProducts.length === 0 ? (
            <div className="rounded-[28px] border border-[var(--border)] bg-white px-5 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-[var(--green-light)] text-3xl">
                {search ? "⌕" : "🛍️"}
              </div>

              <h2 className="mt-5 text-lg font-extrabold text-[var(--text)]">
                {search
                  ? "No products found"
                  : "No products yet"}
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--text-muted)]">
                {search
                  ? "Try another product name, brand or barcode."
                  : "Add your first product to start building your inventory."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={() => {
                    window.location.href =
                      "/add-product";
                  }}
                  className="mt-6 rounded-2xl bg-[var(--rose)] px-5 py-3 text-sm font-extrabold text-[var(--rose-dark)] transition hover:bg-[var(--rose-dark)] hover:text-white"
                >
                  + Add your first product
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => {
                const stock = Number(
                  product.stock_quantity || 0
                );

                const low =
                  stock > 0 && stock <= 5;

                const out = stock === 0;

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() =>
                      openEditor(product)
                    }
                    className="group overflow-hidden rounded-[28px] border border-[var(--border)] bg-white text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[var(--rose)] hover:shadow-xl hover:shadow-rose-100/50 focus:outline-none focus:ring-4 focus:ring-rose-100"
                  >
                    {/* IMAGE */}

                    <div className="relative flex h-52 items-center justify-center overflow-hidden bg-[var(--green-light)]">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-[var(--rose-light)] opacity-70" />

                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="relative h-full w-full object-contain p-5 transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="relative flex h-20 w-20 items-center justify-center rounded-[26px] bg-white/80 text-3xl shadow-sm">
                          🛍️
                        </div>
                      )}

                      <span
                        className={`absolute right-4 top-4 rounded-full px-3 py-1.5 text-[10px] font-extrabold shadow-sm ${
                          out
                            ? "bg-[#f9e1e5] text-[#a84454]"
                            : low
                            ? "bg-[#fff0d4] text-[#a56a18]"
                            : "bg-white/90 text-[var(--green-dark)]"
                        }`}
                      >
                        {out
                          ? "Out of stock"
                          : low
                          ? "Low stock"
                          : "In stock"}
                      </span>
                    </div>

                    {/* INFORMATION */}

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-base font-extrabold text-[var(--text)]">
                            {product.name}
                          </h2>

                          {product.brand && (
                            <p className="mt-1 truncate text-xs font-medium text-[var(--text-muted)]">
                              {product.brand}
                            </p>
                          )}
                        </div>

                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--rose-light)] text-[var(--rose-dark)] transition group-hover:bg-[var(--rose)]">
                          ✎
                        </span>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-[var(--background)] p-3">
                          <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                            Price
                          </p>

                          <p className="mt-1 text-lg font-extrabold text-[var(--rose-dark)]">
                            $
                            {Number(
                              product.price || 0
                            ).toFixed(2)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-[var(--green-light)] p-3">
                          <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                            Stock
                          </p>

                          <p className="mt-1 text-lg font-extrabold text-[var(--green-dark)]">
                            {stock}
                          </p>
                        </div>
                      </div>

                      {product.barcode && (
                        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] px-3.5 py-3">
                          <div className="min-w-0">
                            <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--text-muted)]">
                              Barcode
                            </p>

                            <p className="mt-0.5 truncate text-xs font-semibold text-[var(--text)]">
                              {product.barcode}
                            </p>
                          </div>

                          <span className="text-[var(--rose-dark)]">
                            →
                          </span>
                        </div>
                      )}

                      <p className="mt-4 text-center text-[10px] font-bold text-[var(--text-muted)]">
                        Click to view & edit
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ======================================================
            BARCODE SCANNER MODAL
        ====================================================== */}

        {scannerOpen && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center bg-[#241d1f]/70 p-4 backdrop-blur-md">
            <div className="w-full max-w-md overflow-hidden rounded-[30px] bg-white shadow-2xl">

              {/* HEADER */}

              <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-5">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[var(--green-light)] px-3 py-1.5">
                    <span className="text-[var(--green-dark)]">
                      ▦
                    </span>

                    <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--green-dark)]">
                      Barcode scanner
                    </span>
                  </div>

                  <h2 className="mt-2 text-xl font-extrabold text-[var(--text)]">
                    Scan product
                  </h2>

                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Point your camera at the product barcode.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeScanner}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--green-light)] text-xl text-[var(--green-dark)] transition hover:bg-[var(--green)]"
                >
                  ×
                </button>
              </div>

              {/* CAMERA */}

              <div className="p-5">
                <div className="relative overflow-hidden rounded-[24px] bg-[#171315]">
                  <div
                    id="products-barcode-reader"
                    className="min-h-[280px] w-full overflow-hidden"
                  />

                  {/* SCAN LINE */}

                  <div className="pointer-events-none absolute left-8 right-8 top-1/2 h-px bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.8)]" />

                  <div className="pointer-events-none absolute left-8 right-8 top-1/2 -mt-20 h-40 rounded-2xl border-2 border-white/70" />
                </div>

                {scannerLoading && (
                  <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[var(--green-light)] px-4 py-3">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--green-dark)]" />

                    <span className="text-xs font-bold text-[var(--green-dark)]">
                      Starting camera...
                    </span>
                  </div>
                )}

                {scannerError && (
                  <div className="mt-4 rounded-2xl border border-[#edd0d5] bg-[var(--rose-light)] p-4">
                    <p className="text-sm font-extrabold text-[var(--rose-dark)]">
                      Camera unavailable
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                      {scannerError}
                    </p>
                  </div>
                )}

                <div className="mt-5 rounded-2xl bg-[var(--background)] p-4">
                  <p className="text-xs font-extrabold text-[var(--text)]">
                    How it works
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                    Once the barcode is recognized, the
                    matching product will open automatically
                    so you can view or edit its details.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeScanner}
                  className="mt-4 w-full rounded-2xl border border-[var(--border)] bg-white px-5 py-3.5 text-sm font-bold text-[var(--text-muted)] transition hover:bg-[var(--background)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================
            EDIT PRODUCT MODAL
        ====================================================== */}

        {selectedProduct && (
          <div
            className="fixed inset-0 z-[300] flex items-center justify-center bg-[#241d1f]/60 p-4 backdrop-blur-md"
            onClick={closeEditor}
          >
            <div
              className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[30px] bg-white shadow-2xl"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              {/* HEADER */}

              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-white/95 px-5 py-5 backdrop-blur-xl sm:px-7">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[var(--rose-light)] px-3 py-1.5">
                    <span className="text-[var(--rose-dark)]">
                      ✎
                    </span>

                    <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--rose-dark)]">
                      Product details
                    </span>
                  </div>

                  <h2 className="mt-2 text-xl font-extrabold text-[var(--text)]">
                    View & edit product
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeEditor}
                  disabled={saving || deleting}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--green-light)] text-xl font-medium text-[var(--green-dark)] transition hover:bg-[var(--green)] disabled:opacity-50"
                >
                  ×
                </button>
              </div>

              <div className="p-5 sm:p-7">

                {/* IMAGE */}

                <div className="mb-6 overflow-hidden rounded-[26px] bg-[var(--green-light)]">
                  <div className="flex h-56 items-center justify-center">
                    {editImageUrl ? (
                      <img
                        src={editImageUrl}
                        alt={editName}
                        className="h-full w-full object-contain p-5"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-white text-3xl shadow-sm">
                        🛍️
                      </div>
                    )}
                  </div>
                </div>

                {/* FIELDS */}

                <div className="space-y-5">
                  <EditField
                    label="Product name"
                    value={editName}
                    onChange={setEditName}
                    placeholder="Product name"
                  />

                  <EditField
                    label="Brand"
                    value={editBrand}
                    onChange={setEditBrand}
                    placeholder="Brand"
                  />

                  <EditField
                    label="Barcode"
                    value={editBarcode}
                    onChange={setEditBarcode}
                    placeholder="Barcode"
                    inputMode="numeric"
                  />

                  <div className="grid gap-5 sm:grid-cols-2">

                    <div>
                      <label className="mb-2 block text-xs font-extrabold text-[var(--text)]">
                        Price
                      </label>

                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-extrabold text-[var(--rose-dark)]">
                          $
                        </span>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editPrice}
                          onChange={(e) =>
                            setEditPrice(
                              e.target.value
                            )
                          }
                          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] py-3.5 pl-9 pr-4 text-sm font-semibold text-[var(--text)] outline-none transition focus:border-[var(--rose)] focus:bg-white focus:ring-4 focus:ring-rose-100"
                        />
                      </div>
                    </div>

                    <EditField
                      label="Stock quantity"
                      value={editStock}
                      onChange={setEditStock}
                      placeholder="0"
                      type="number"
                    />
                  </div>

                  <EditField
                    label="Image URL"
                    value={editImageUrl}
                    onChange={setEditImageUrl}
                    placeholder="https://..."
                    inputMode="url"
                  />
                </div>

                {/* SUCCESS */}

                {message && (
                  <div className="mt-5 rounded-2xl border border-[#cfe1ca] bg-[var(--green-light)] p-4">
                    <p className="text-sm font-extrabold text-[var(--green-dark)]">
                      ✓ {message}
                    </p>
                  </div>
                )}

                {/* ERROR */}

                {errorMessage && (
                  <div className="mt-5 rounded-2xl border border-[#edd0d5] bg-[var(--rose-light)] p-4">
                    <p className="text-sm font-extrabold text-[var(--rose-dark)]">
                      Could not save product
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                      {errorMessage}
                    </p>
                  </div>
                )}

                {/* ACTIONS */}

                <div className="mt-7 flex flex-col gap-3">

                  <button
                    type="button"
                    onClick={saveProduct}
                    disabled={saving || deleting}
                    className="w-full rounded-2xl bg-[var(--rose)] px-5 py-4 text-sm font-extrabold text-[var(--rose-dark)] shadow-lg shadow-rose-200/40 transition hover:bg-[var(--rose-dark)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving changes..."
                      : "Save Changes"}
                  </button>

                  <button
                    type="button"
                    onClick={deleteProduct}
                    disabled={saving || deleting}
                    className="w-full rounded-2xl border border-[#edd0d5] bg-[var(--rose-light)] px-5 py-3.5 text-sm font-extrabold text-[var(--rose-dark)] transition hover:bg-[#f4dce0] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deleting
                      ? "Deleting..."
                      : "Delete Product"}
                  </button>

                  <button
                    type="button"
                    onClick={closeEditor}
                    disabled={saving || deleting}
                    className="w-full rounded-2xl border border-[var(--border)] bg-white px-5 py-3.5 text-sm font-bold text-[var(--text-muted)] transition hover:bg-[var(--background)] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </EmployeeGuard>
  );
}


/* =============================================================
   EDIT FIELD
============================================================= */

function EditField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  inputMode?:
    | "text"
    | "numeric"
    | "decimal"
    | "tel"
    | "email"
    | "url"
    | "search"
    | "none";
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-extrabold text-[var(--text)]">
        {label}
      </label>

      <input
        type={type}
        min={type === "number" ? "0" : undefined}
        step={
          label === "Price"
            ? "0.01"
            : undefined
        }
        inputMode={inputMode}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3.5 text-sm font-semibold text-[var(--text)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--rose)] focus:bg-white focus:ring-4 focus:ring-rose-100"
      />
    </div>
  );
}