"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Sale = {
  id: string;
  total: number | null;
  created_at: string;
};

type SaleItem = {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number | null;
  price: number | null;
};

type Product = {
  id: string;
  name: string;
  brand: string | null;
  price: number | null;
  stock_quantity: number | null;
  image_url: string | null;
};

export default function OwnerDashboard() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  useEffect(() => {
    const admin = localStorage.getItem("admin");

    if (!admin) {
      window.location.href = "/admin-login";
      return;
    }

    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    try {
      const [
        { data: salesData, error: salesError },
        { data: itemsData, error: itemsError },
        { data: productData, error: productsError },
      ] = await Promise.all([
        supabase.from("sales").select("*"),
        supabase.from("sale_items").select("*"),
        supabase.from("products").select("*"),
      ]);

      if (salesError) {
        console.error("SALES ERROR:", salesError);
      }

      if (itemsError) {
        console.error("SALE ITEMS ERROR:", itemsError);
      }

      if (productsError) {
        console.error("PRODUCTS ERROR:", productsError);
      }

      setSales((salesData || []) as Sale[]);
      setItems((itemsData || []) as SaleItem[]);
      setProducts((productData || []) as Product[]);
    } catch (error) {
      console.error("OWNER DASHBOARD ERROR:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const date = new Date(sale.created_at);

      const day = date.toISOString().split("T")[0];
      const month = date.toISOString().slice(0, 7);

      if (viewMode === "daily") {
        return day === selectedDate;
      }

      return month === selectedMonth;
    });
  }, [sales, viewMode, selectedDate, selectedMonth]);

  const saleIds = useMemo(
    () => new Set(filteredSales.map((sale) => sale.id)),
    [filteredSales]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => saleIds.has(item.sale_id));
  }, [items, saleIds]);

  const revenue = useMemo(() => {
    return filteredSales.reduce(
      (sum, sale) => sum + Number(sale.total || 0),
      0
    );
  }, [filteredSales]);

  const itemsSold = useMemo(() => {
    return filteredItems.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );
  }, [filteredItems]);

  const productStats = useMemo(() => {
    return products
      .map((product) => {
        const related = filteredItems.filter(
          (item) => item.product_id === product.id
        );

        const qtySold = related.reduce(
          (sum, item) => sum + Number(item.quantity || 0),
          0
        );

        const productRevenue = related.reduce(
          (sum, item) =>
            sum +
            Number(item.quantity || 0) * Number(item.price || 0),
          0
        );

        return {
          ...product,
          qtySold,
          revenue: productRevenue,
        };
      })
      .filter((product) => product.qtySold > 0)
      .sort((a, b) => b.qtySold - a.qtySold);
  }, [products, filteredItems]);

  const bestSellers = productStats.slice(0, 5);

  const lowStock = useMemo(() => {
    return products
      .filter((product) => Number(product.stock_quantity || 0) <= 5)
      .sort(
        (a, b) =>
          Number(a.stock_quantity || 0) -
          Number(b.stock_quantity || 0)
      );
  }, [products]);

  const stockOverview = useMemo(() => {
    const totalProducts = products.length;

    const totalUnits = products.reduce(
      (sum, product) =>
        sum + Number(product.stock_quantity || 0),
      0
    );

    const outOfStock = products.filter(
      (product) => Number(product.stock_quantity || 0) === 0
    ).length;

    const lowStockCount = products.filter((product) => {
      const stock = Number(product.stock_quantity || 0);
      return stock > 0 && stock <= 5;
    }).length;

    const healthyStock = products.filter(
      (product) => Number(product.stock_quantity || 0) > 5
    ).length;

    return {
      totalProducts,
      totalUnits,
      outOfStock,
      lowStockCount,
      healthyStock,
    };
  }, [products]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f5f3] px-4 py-8 text-[#292425] sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse">
            <div className="h-8 w-64 rounded-xl bg-[#eadedf]" />
            <div className="mt-3 h-4 w-80 max-w-full rounded bg-[#e9e3e1]" />

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-32 rounded-[26px] bg-white shadow-sm"
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f5f3] px-4 py-6 text-[#292425] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <header className="mb-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#f4e1e5] px-3.5 py-1.5">
                <span className="h-2 w-2 rounded-full bg-[#a45d6b]" />

                <span className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#8f4e5d]">
                  Owner Area
                </span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-[#292425] sm:text-4xl">
                Owner Dashboard
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#766b6d]">
                Keep an eye on your store performance, sales and
                inventory in one place.
              </p>
            </div>

            {/* FILTER */}

            <div className="rounded-[24px] border border-[#e8dedc] bg-white p-2 shadow-sm">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setViewMode("daily")}
                  className={`flex-1 rounded-[18px] px-4 py-2.5 text-xs font-extrabold transition sm:px-5 ${
                    viewMode === "daily"
                      ? "bg-[#a45d6b] text-white shadow-md"
                      : "text-[#6e6264] hover:bg-[#f8eeee]"
                  }`}
                >
                  Daily
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("monthly")}
                  className={`flex-1 rounded-[18px] px-4 py-2.5 text-xs font-extrabold transition sm:px-5 ${
                    viewMode === "monthly"
                      ? "bg-[#718b6d] text-white shadow-md"
                      : "text-[#6e6264] hover:bg-[#eef4eb]"
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* =====================================================
            DATE FILTER
        ===================================================== */}

        <section className="mb-6 rounded-[26px] border border-[#e8dedc] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#a45d6b]">
                Viewing
              </p>

              <p className="mt-1 text-sm font-extrabold text-[#3d3537]">
                {viewMode === "daily"
                  ? "Daily store performance"
                  : "Monthly store performance"}
              </p>
            </div>

            <input
              type={viewMode === "daily" ? "date" : "month"}
              value={
                viewMode === "daily"
                  ? selectedDate
                  : selectedMonth
              }
              onChange={(event) => {
                if (viewMode === "daily") {
                  setSelectedDate(event.target.value);
                } else {
                  setSelectedMonth(event.target.value);
                }
              }}
              className="w-full rounded-2xl border border-[#ded4d1] bg-[#fbf9f8] px-4 py-3 text-sm font-bold text-[#3d3537] outline-none transition focus:border-[#a45d6b] focus:bg-white focus:ring-4 focus:ring-[#f4e1e5] sm:w-auto"
            />
          </div>
        </section>

        {/* =====================================================
            SUMMARY CARDS
        ===================================================== */}

        <section className="mb-8 grid gap-4 sm:grid-cols-3">

          {/* REVENUE */}

          <div className="relative overflow-hidden rounded-[28px] border border-[#e2c9cf] bg-[#f1dfe3] p-5 shadow-sm sm:p-6">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/25" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8f4e5d]">
                  Revenue
                </span>

                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/60 text-lg text-[#8f4e5d]">
                  $
                </span>
              </div>

              <p className="mt-6 text-3xl font-extrabold text-[#7e4653]">
                ${revenue.toFixed(2)}
              </p>

              <p className="mt-1 text-xs font-medium text-[#94606b]">
                {viewMode === "daily"
                  ? "Selected day"
                  : "Selected month"}
              </p>
            </div>
          </div>

          {/* SALES */}

          <div className="relative overflow-hidden rounded-[28px] border border-[#cfdcc9] bg-[#e7f0e4] p-5 shadow-sm sm:p-6">
            <div className="absolute -bottom-10 -right-8 h-28 w-28 rounded-full bg-white/35" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#5d7359]">
                  Sales
                </span>

                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/65 text-lg text-[#5d7359]">
                  #
                </span>
              </div>

              <p className="mt-6 text-3xl font-extrabold text-[#53694f]">
                {filteredSales.length}
              </p>

              <p className="mt-1 text-xs font-medium text-[#6d8069]">
                Completed transactions
              </p>
            </div>
          </div>

          {/* ITEMS */}

          <div className="relative overflow-hidden rounded-[28px] border border-[#e4d8c8] bg-[#f4ecdf] p-5 shadow-sm sm:p-6">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/35" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#866f52]">
                  Items Sold
                </span>

                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/65 text-lg text-[#866f52]">
                  □
                </span>
              </div>

              <p className="mt-6 text-3xl font-extrabold text-[#765f44]">
                {itemsSold}
              </p>

              <p className="mt-1 text-xs font-medium text-[#8e7c63]">
                Products sold
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================
            BEST SELLERS
        ===================================================== */}

        <section className="mb-8">
          <SectionHeader
            eyebrow="Performance"
            title="Best Sellers"
            description="Your strongest-selling products for the selected period."
          />

          {bestSellers.length === 0 ? (
            <EmptyCard message="No product sales for this period." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {bestSellers.map((product, index) => (
                <div
                  key={product.id}
                  className="group overflow-hidden rounded-[26px] border border-[#e8dedc] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative flex h-36 items-center justify-center overflow-hidden bg-[#e8f0e5]">
                    <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-xl bg-white/85 text-xs font-extrabold text-[#637b5e] shadow-sm">
                      #{index + 1}
                    </span>

                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                        ◫
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="truncate text-sm font-extrabold text-[#342e30]">
                      {product.name}
                    </h3>

                    {product.brand && (
                      <p className="mt-1 truncate text-[11px] text-[#827678]">
                        {product.brand}
                      </p>
                    )}

                    <div className="mt-4 flex items-end justify-between gap-2">
                      <div>
                        <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#a09698]">
                          Sold
                        </p>

                        <p className="mt-1 text-lg font-extrabold text-[#60765b]">
                          {product.qtySold}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#a09698]">
                          Revenue
                        </p>

                        <p className="mt-1 text-sm font-extrabold text-[#8f4e5d]">
                          ${product.revenue.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* =====================================================
            ALL PRODUCT PERFORMANCE
        ===================================================== */}

        <section className="mb-8">
          <SectionHeader
            eyebrow="Sales"
            title="Product Performance"
            description="Detailed sales performance for products sold during this period."
          />

          {productStats.length === 0 ? (
            <EmptyCard message="No product performance data available." />
          ) : (
            <div className="overflow-hidden rounded-[28px] border border-[#e8dedc] bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left">
                  <thead className="bg-[#faf7f6]">
                    <tr>
                      <th className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8d8082]">
                        Product
                      </th>

                      <th className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8d8082]">
                        Sold
                      </th>

                      <th className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8d8082]">
                        Revenue
                      </th>

                      <th className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8d8082]">
                        Current Stock
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {productStats.map((product) => (
                      <tr
                        key={product.id}
                        className="border-t border-[#eee7e5]"
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-extrabold text-[#342e30]">
                            {product.name}
                          </p>

                          {product.brand && (
                            <p className="mt-0.5 text-xs text-[#877a7c]">
                              {product.brand}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-[#e7f0e4] px-3 py-1.5 text-xs font-extrabold text-[#5d7359]">
                            {product.qtySold}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm font-extrabold text-[#8f4e5d]">
                          ${product.revenue.toFixed(2)}
                        </td>

                        <td className="px-5 py-4">
                          <StockBadge
                            stock={Number(
                              product.stock_quantity || 0
                            )}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* =====================================================
            STOCK OVERVIEW
        ===================================================== */}

        <section className="mb-8">
          <SectionHeader
            eyebrow="Inventory"
            title="Stock Overview"
            description="A quick overview of your current inventory."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StockSummaryCard
              label="Products"
              value={stockOverview.totalProducts}
              description="Total products"
              variant="rose"
            />

            <StockSummaryCard
              label="Units"
              value={stockOverview.totalUnits}
              description="Units currently in stock"
              variant="green"
            />

            <StockSummaryCard
              label="Healthy"
              value={stockOverview.healthyStock}
              description="Products above low-stock level"
              variant="green"
            />

            <StockSummaryCard
              label="Out of Stock"
              value={stockOverview.outOfStock}
              description="Products needing attention"
              variant="danger"
            />
          </div>
        </section>

        {/* =====================================================
            LOW STOCK
        ===================================================== */}

        <section className="mb-8">
          <SectionHeader
            eyebrow="Attention"
            title="Low Stock"
            description="Products with five or fewer units remaining."
          />

          {lowStock.length === 0 ? (
            <div className="rounded-[28px] border border-[#cfdcc9] bg-[#e7f0e4] p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#5d7359] shadow-sm">
                  ✓
                </div>

                <div>
                  <p className="text-sm font-extrabold text-[#53694f]">
                    Inventory looks good
                  </p>

                  <p className="mt-1 text-xs text-[#6d8069]">
                    No products are currently low on stock.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lowStock.map((product) => {
                const stock = Number(
                  product.stock_quantity || 0
                );

                const out = stock === 0;

                return (
                  <div
                    key={product.id}
                    className={`relative overflow-hidden rounded-[26px] border p-5 shadow-sm ${
                      out
                        ? "border-[#e6c3c9] bg-[#f8e7e9]"
                        : "border-[#ead9bd] bg-[#f8efdf]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl ${
                          out
                            ? "bg-white"
                            : "bg-white/75"
                        }`}
                      >
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-full w-full object-contain p-2"
                          />
                        ) : (
                          <span className="text-xl">
                            ◫
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-[#3d3537]">
                          {product.name}
                        </p>

                        {product.brand && (
                          <p className="mt-0.5 truncate text-xs text-[#817477]">
                            {product.brand}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex items-end justify-between">
                      <div>
                        <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#968789]">
                          Remaining
                        </p>

                        <p
                          className={`mt-1 text-2xl font-extrabold ${
                            out
                              ? "text-[#a84454]"
                              : "text-[#9a6a25]"
                          }`}
                        >
                          {stock}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold ${
                          out
                            ? "bg-[#f2d3d8] text-[#a84454]"
                            : "bg-[#f1dfbd] text-[#9a6a25]"
                        }`}
                      >
                        {out ? "Out of stock" : "Low stock"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <footer className="border-t border-[#e6dcda] py-8 text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#a09698]">
            Ward Cosmetics
          </p>

          <p className="mt-1 text-[10px] text-[#a09698]">
            Owner Dashboard · Store Management
          </p>
        </footer>
      </div>
    </main>
  );
}

/* =============================================================
   SECTION HEADER
============================================================= */

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#a45d6b]">
        {eyebrow}
      </p>

      <h2 className="mt-1 text-xl font-extrabold text-[#342e30]">
        {title}
      </h2>

      <p className="mt-1 text-xs leading-5 text-[#827678]">
        {description}
      </p>
    </div>
  );
}

/* =============================================================
   EMPTY CARD
============================================================= */

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="rounded-[28px] border border-[#e8dedc] bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e7f0e4] text-xl text-[#60765b]">
        —
      </div>

      <p className="mt-4 text-sm font-extrabold text-[#4b4143]">
        {message}
      </p>

      <p className="mt-1 text-xs text-[#8a7d7f]">
        Try selecting another date or period.
      </p>
    </div>
  );
}

/* =============================================================
   STOCK SUMMARY CARD
============================================================= */

function StockSummaryCard({
  label,
  value,
  description,
  variant,
}: {
  label: string;
  value: number;
  description: string;
  variant: "rose" | "green" | "danger";
}) {
  const styles = {
    rose: {
      wrapper: "border-[#e4cdd2] bg-[#f4e4e7]",
      label: "text-[#8f4e5d]",
      value: "text-[#7e4653]",
      icon: "bg-white/65 text-[#8f4e5d]",
    },
    green: {
      wrapper: "border-[#d0ddcb] bg-[#e8f0e5]",
      label: "text-[#5d7359]",
      value: "text-[#53694f]",
      icon: "bg-white/65 text-[#5d7359]",
    },
    danger: {
      wrapper: "border-[#e7c8cd] bg-[#f8e8ea]",
      label: "text-[#a84454]",
      value: "text-[#943f4e]",
      icon: "bg-white/70 text-[#a84454]",
    },
  }[variant];

  return (
    <div
      className={`rounded-[26px] border p-5 shadow-sm ${styles.wrapper}`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-[10px] font-extrabold uppercase tracking-[0.13em] ${styles.label}`}
        >
          {label}
        </span>

        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-extrabold ${styles.icon}`}
        >
          {variant === "danger" ? "!" : "•"}
        </span>
      </div>

      <p
        className={`mt-5 text-2xl font-extrabold ${styles.value}`}
      >
        {value}
      </p>

      <p className="mt-1 text-[11px] text-[#817477]">
        {description}
      </p>
    </div>
  );
}

/* =============================================================
   STOCK BADGE
============================================================= */

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <span className="rounded-full bg-[#f5dce0] px-3 py-1.5 text-[10px] font-extrabold text-[#a84454]">
        Out of stock
      </span>
    );
  }

  if (stock <= 5) {
    return (
      <span className="rounded-full bg-[#f2e0c2] px-3 py-1.5 text-[10px] font-extrabold text-[#9a6a25]">
        {stock} left
      </span>
    );
  }

  return (
    <span className="rounded-full bg-[#e5eee2] px-3 py-1.5 text-[10px] font-extrabold text-[#5d7359]">
      {stock} in stock
    </span>
  );
}