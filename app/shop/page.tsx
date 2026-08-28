"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  brand: string;
  name: string;
  price: number;
  stock_quantity: number | null;
  image_url: string | null;
  created_at: string | null;
};

type SortOption =
  | "newest"
  | "name-asc"
  | "name-desc"
  | "price-low"
  | "price-high"
  | "stock-high"
  | "stock-low";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  const [sortBy, setSortBy] =
    useState<SortOption>("newest");

  // Selected product for the information window
  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("products")
      .select(
        "id, brand, name, price, stock_quantity, image_url, created_at"
      )
      .order("created_at", {
        ascending: false,
      });

    console.log("SHOP PRODUCTS:", data);
    console.log("SHOP ERROR:", error);

    if (error) {
      console.error("Shop products error:", error);
      setError(error.message);
      setProducts([]);
      setLoading(false);
      return;
    }

    setProducts((data as Product[]) || []);
    setLoading(false);
  }

  const brands = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((product) => product.brand)
          .filter(Boolean)
      )
    ).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    const query = search
      .trim()
      .toLowerCase();

    if (query) {
      result = result.filter((product) => {
        return (
          product.name
            ?.toLowerCase()
            .includes(query) ||
          product.brand
            ?.toLowerCase()
            .includes(query) 
        );
      });
    }

    if (brandFilter !== "all") {
      result = result.filter(
        (product) =>
          product.brand === brandFilter
      );
    }

    if (stockFilter === "available") {
      result = result.filter(
        (product) =>
          (product.stock_quantity ?? 0) > 0
      );
    }

    if (stockFilter === "out") {
      result = result.filter(
        (product) =>
          (product.stock_quantity ?? 0) <= 0
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);

        case "name-desc":
          return b.name.localeCompare(a.name);

        case "price-low":
          return (
            Number(a.price) -
            Number(b.price)
          );

        case "price-high":
          return (
            Number(b.price) -
            Number(a.price)
          );

        case "stock-high":
          return (
            (b.stock_quantity ?? 0) -
            (a.stock_quantity ?? 0)
          );

        case "stock-low":
          return (
            (a.stock_quantity ?? 0) -
            (b.stock_quantity ?? 0)
          );

        default:
          return (
            new Date(
              b.created_at ?? 0
            ).getTime() -
            new Date(
              a.created_at ?? 0
            ).getTime()
          );
      }
    });

    return result;
  }, [
    products,
    search,
    brandFilter,
    stockFilter,
    sortBy,
  ]);

  function clearFilters() {
    setSearch("");
    setBrandFilter("all");
    setStockFilter("all");
    setSortBy("newest");
  }

  const hasFilters =
    search.trim() !== "" ||
    brandFilter !== "all" ||
    stockFilter !== "all" ||
    sortBy !== "newest";

  // Close modal with Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedProduct(null);
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  // Prevent background scrolling while product window is open
  useEffect(() => {
    if (selectedProduct) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedProduct]);

  return (
    <main className="min-h-screen bg-[#fcf9f8] text-[#292425]">

      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-[#eadedf] bg-[#fcf9f8]/95 backdrop-blur">
        <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">

          <Link
            href="/shop"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e2eddd] text-[#4e6949]">
              <span className="text-lg">
                W
              </span>
            </div>

            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#a45d6b]">
                Ward
              </p>

              <p className="text-[15px] font-bold leading-none">
                Cosmetics
              </p>
            </div>
          </Link>

          <Link
            href="/app"
            className="rounded-full border border-[#e7dcdc] bg-white px-4 py-2 text-xs font-semibold text-[#665b5d] transition hover:bg-[#fff1f3]"
          >
            Exit Shop
          </Link>

        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-5 sm:px-6 sm:pt-8 lg:px-10">

        {/* HERO */}
        <section className="relative overflow-hidden rounded-[32px] bg-[#dfeadd]">

          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#eccbd2]" />

          <div className="absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-[#f1dfe1]" />

          <div className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-[#cbdcc6]" />

          <div className="relative px-6 py-12 sm:px-10 sm:py-14 lg:px-14">

            <div className="max-w-2xl">

              <span className="inline-flex items-center gap-2 rounded-full bg-white/75 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#52634e]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#a45d6b]" />
                Ward Cosmetics
              </span>

              <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-[#293429] sm:text-5xl lg:text-6xl">
                Your beauty.
                <br />
                <span className="text-[#a45d6b]">
                  Your way.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-6 text-[#5c6959] sm:text-base">
                Discover your favorite beauty
                products, explore new essentials,
                and find something made for you.
              </p>

              <a
                href="#products"
                className="mt-7 inline-flex items-center rounded-full bg-[#a45d6b] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#914f5c]"
              >
                Explore products
                <span className="ml-2">
                  →
                </span>
              </a>

            </div>
          </div>
        </section>

        {/* SEARCH */}
        <section className="mt-7">

          <div className="relative">

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
              <circle
                cx="11"
                cy="11"
                r="7"
              />
              <path d="m20 20-4-4" />
            </svg>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search products, brands..."
              className="w-full rounded-2xl border border-[#e8dcdc] bg-white py-4 pl-12 pr-4 text-sm shadow-sm outline-none transition placeholder:text-[#aaa0a2] focus:border-[#a45d6b] focus:shadow-md"
            />

          </div>

          {/* FILTERS */}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">

            <select
              value={brandFilter}
              onChange={(e) =>
                setBrandFilter(e.target.value)
              }
              className="rounded-2xl border border-[#e8dcdc] bg-white px-3 py-3 text-xs font-medium outline-none focus:border-[#a45d6b] sm:px-4 sm:text-sm"
            >
              <option value="all">
                All brands
              </option>

              {brands.map((brand) => (
                <option
                  key={brand}
                  value={brand}
                >
                  {brand}
                </option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(e) =>
                setStockFilter(e.target.value)
              }
              className="rounded-2xl border border-[#e8dcdc] bg-white px-3 py-3 text-xs font-medium outline-none focus:border-[#a45d6b] sm:px-4 sm:text-sm"
            >
              <option value="all">
                Availability
              </option>

              <option value="available">
                In stock
              </option>

              <option value="out">
                Out of stock
              </option>
            </select>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as SortOption
                )
              }
              className="col-span-2 rounded-2xl border border-[#e8dcdc] bg-white px-3 py-3 text-xs font-medium outline-none focus:border-[#a45d6b] sm:col-span-1 sm:px-4 sm:text-sm"
            >
              <option value="newest">
                Sort: Newest
              </option>

              <option value="name-asc">
                Name: A → Z
              </option>

              <option value="name-desc">
                Name: Z → A
              </option>

              <option value="price-low">
                Price: Low → High
              </option>

              <option value="price-high">
                Price: High → Low
              </option>

              <option value="stock-high">
                Stock: High → Low
              </option>

              <option value="stock-low">
                Stock: Low → High
              </option>
            </select>

          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 text-xs font-bold text-[#a45d6b] hover:underline"
            >
              Clear filters
            </button>
          )}

        </section>

        {/* PRODUCTS */}
        <section
          id="products"
          className="mt-10"
        >

          <div className="mb-5 flex items-end justify-between">

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a45d6b]">
                Collection
              </p>

              <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Shop our products
              </h2>
            </div>

            <p className="text-xs text-[#95898b]">
              {filteredProducts.length} items
            </p>

          </div>

          {/* LOADING */}
          {loading && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">

              {[1, 2, 3, 4].map(
                (item) => (
                  <div
                    key={item}
                    className="overflow-hidden rounded-[22px] border border-[#eadedf] bg-white"
                  >
                    <div className="aspect-square animate-pulse bg-[#f1ebeb]" />

                    <div className="space-y-3 p-3 sm:p-5">
                      <div className="h-2.5 w-16 animate-pulse rounded bg-[#f1ebeb]" />
                      <div className="h-4 w-24 animate-pulse rounded bg-[#f1ebeb]" />
                      <div className="h-4 w-14 animate-pulse rounded bg-[#f1ebeb]" />
                    </div>
                  </div>
                )
              )}

            </div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div className="rounded-[28px] border border-[#efd4d8] bg-[#fff4f5] p-8 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5e0e3] text-lg font-bold text-[#a45d6b]">
                !
              </div>

              <h3 className="mt-4 font-bold">
                We couldn't load the products
              </h3>

              <p className="mt-2 break-words text-sm text-[#8f777a]">
                {error}
              </p>

              <button
                type="button"
                onClick={loadProducts}
                className="mt-5 rounded-full bg-[#a45d6b] px-5 py-2.5 text-sm font-bold text-white"
              >
                Try again
              </button>

            </div>
          )}

          {/* EMPTY */}
          {!loading &&
            !error &&
            filteredProducts.length === 0 && (
              <div className="rounded-[28px] border border-[#eadedf] bg-white p-10 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#f4e3e6] text-2xl">
                  🔍
                </div>

                <h3 className="mt-5 text-lg font-bold">
                  No products found
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#918688]">
                  Try another search or clear
                  your filters.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-full bg-[#a45d6b] px-5 py-2.5 text-sm font-bold text-white"
                >
                  Show all products
                </button>

              </div>
            )}

          {/* PRODUCT GRID */}
          {!loading &&
            !error &&
            filteredProducts.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">

                {filteredProducts.map(
                  (product) => {
                    const stock =
                      product.stock_quantity ?? 0;

                    const available =
                      stock > 0;

                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() =>
                          setSelectedProduct(
                            product
                          )
                        }
                        className="group overflow-hidden rounded-[22px] border border-[#eadedf] bg-white text-left shadow-[0_4px_20px_rgba(80,50,50,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(80,50,50,0.11)] sm:rounded-[28px]"
                      >

                        {/* IMAGE */}
                        <div className="relative aspect-square overflow-hidden bg-[#f1eded]">

                          {product.image_url ? (
                            <img
                              src={
                                product.image_url
                              }
                              alt={
                                product.name
                              }
                              loading="lazy"
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e3eddf] text-2xl">
                                🧴
                              </div>
                            </div>
                          )}

                          {/* AVAILABILITY */}
                          <div className="absolute left-2 top-2 sm:left-3 sm:top-3">

                            {available ? (
                              <span className="rounded-full bg-[#e3efdf] px-2 py-1 text-[9px] font-bold text-[#4d6749] shadow-sm sm:px-3 sm:py-1.5 sm:text-xs">
                                In stock
                              </span>
                            ) : (
                              <span className="rounded-full bg-[#403a3b] px-2 py-1 text-[9px] font-bold text-white shadow-sm sm:px-3 sm:py-1.5 sm:text-xs">
                                Sold out
                              </span>
                            )}

                          </div>

                        </div>

                        {/* PRODUCT INFO */}
                        <div className="p-3 sm:p-5">

                          <p className="truncate text-[9px] font-bold uppercase tracking-[0.12em] text-[#a45d6b] sm:text-[11px]">
                            {product.brand}
                          </p>

                          <h3 className="mt-1 line-clamp-2 min-h-[36px] text-xs font-bold leading-5 sm:min-h-[48px] sm:text-base">
                            {product.name}
                          </h3>

                          <div className="mt-3 flex items-end justify-between gap-1 sm:mt-5 sm:gap-3">

                            <div className="min-w-0">

                              <p className="text-sm font-bold sm:text-lg">
                                $
                                {Number(
                                  product.price
                                ).toFixed(2)}
                              </p>

                              <p className="mt-0.5 truncate text-[9px] text-[#998e90] sm:text-xs">
                                {available
                                  ? `${stock} available`
                                  : "Unavailable"}
                              </p>

                            </div>

                            <span
                              className={`shrink-0 rounded-xl px-2.5 py-2 text-[9px] font-bold sm:px-4 sm:py-2.5 sm:text-xs ${
                                available
                                  ? "bg-[#a45d6b] text-white"
                                  : "bg-[#eee8e8] text-[#a49b9c]"
                              }`}
                            >
                              View
                            </span>

                          </div>

                        </div>

                      </button>
                    );
                  }
                )}

              </div>
            )}

        </section>

        {/* BENEFITS */}
        {!loading &&
          !error &&
          products.length > 0 && (
            <section className="mt-14 rounded-[28px] bg-[#e4eee0] p-5 sm:p-8">

              <div className="grid gap-3 sm:grid-cols-3 sm:gap-5">

                <div className="rounded-2xl bg-white/65 p-5">
                  <div className="text-xl">
                    🌿
                  </div>

                  <h3 className="mt-3 text-sm font-bold">
                    Beauty & care
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-[#687466]">
                    Products for your everyday
                    beauty routine.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/65 p-5">
                  <div className="text-xl">
                    💗
                  </div>

                  <h3 className="mt-3 text-sm font-bold">
                    Find your favorites
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-[#687466]">
                    Quickly search and discover
                    products you love.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/65 p-5">
                  <div className="text-xl">
                    ✨
                  </div>

                  <h3 className="mt-3 text-sm font-bold">
                    Shop with confidence
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-[#687466]">
                    See pricing and availability
                    before choosing.
                  </p>
                </div>

              </div>

            </section>
          )}

        {/* FOOTER */}
        <footer className="mt-14 border-t border-[#eadedf] py-7 text-center">

          <p className="text-xs font-bold text-[#8f8385]">
            Ward Cosmetics
          </p>

          <p className="mt-1 text-[10px] text-[#aaa0a2]">
            Beauty • Care • Confidence
          </p>

        </footer>

      </div>

      {/* ================================================= */}
      {/* PRODUCT INFORMATION MODAL */}
      {/* ================================================= */}

      {selectedProduct && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() =>
            setSelectedProduct(null)
          }
        >

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Product information"
            onClick={(e) =>
              e.stopPropagation()
            }
            className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[30px] bg-white shadow-2xl"
          >

            {/* CLOSE BUTTON */}
            <button
              type="button"
              onClick={() =>
                setSelectedProduct(null)
              }
              aria-label="Close"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-xl text-[#51484a] shadow-md transition hover:bg-[#fff0f2] hover:text-[#a45d6b]"
            >
              ×
            </button>

            <div className="grid sm:grid-cols-2">

              {/* PRODUCT IMAGE */}
              <div className="relative aspect-square bg-[#f2eeee] sm:aspect-auto sm:min-h-[420px]">

                {selectedProduct.image_url ? (
                  <img
                    src={
                      selectedProduct.image_url
                    }
                    alt={
                      selectedProduct.name
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full min-h-[320px] items-center justify-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-[#e3eddf] text-4xl">
                      🧴
                    </div>
                  </div>
                )}

                {/* STOCK BADGE */}
                <div className="absolute bottom-4 left-4">

                  {(selectedProduct.stock_quantity ??
                    0) > 0 ? (
                    <span className="rounded-full bg-[#e3efdf] px-4 py-2 text-xs font-bold text-[#4d6749] shadow-sm">
                      In stock
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#403a3b] px-4 py-2 text-xs font-bold text-white shadow-sm">
                      Sold out
                    </span>
                  )}

                </div>

              </div>

              {/* PRODUCT DETAILS */}
              <div className="flex flex-col p-6 sm:p-8">

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a45d6b]">
                    {selectedProduct.brand}
                  </p>

                  <h2 className="mt-2 text-2xl font-bold leading-tight text-[#292425] sm:text-3xl">
                    {selectedProduct.name}
                  </h2>

                  <p className="mt-5 text-2xl font-bold text-[#a45d6b] sm:text-3xl">
                    $
                    {Number(
                      selectedProduct.price
                    ).toFixed(2)}
                  </p>

                </div>

                {/* INFORMATION */}
                <div className="mt-7 space-y-3">

                  <div className="flex items-center justify-between rounded-2xl bg-[#f8f5f4] px-4 py-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#9a8d8f]">
                        Availability
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {(selectedProduct.stock_quantity ??
                          0) > 0
                          ? "Available"
                          : "Currently unavailable"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-[#52634e]">
                        {selectedProduct.stock_quantity ??
                          0}
                      </p>

                      <p className="text-[10px] text-[#9a8d8f]">
                        units
                      </p>
                    </div>
                  </div>

                 

                </div>

                {/* ACTION */}
                <div className="mt-auto pt-7">

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedProduct(null)
                    }
                    className="w-full rounded-2xl bg-[#a45d6b] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#914f5c]"
                  >
                    Continue browsing
                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}