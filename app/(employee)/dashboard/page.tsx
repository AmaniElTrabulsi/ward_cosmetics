"use client";

import { useEffect, useMemo, useState } from "react";
import EmployeeGuard from "@/components/EmployeeGuard";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  brand?: string | null;
  price: number | null;
  stock_quantity: number | null;
  image_url?: string | null;
};

type Sale = {
  id: string;
  total: number | null;
  created_at: string;
};

type SaleItem = {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  price: number;
};

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    setLoading(true);

    try {
      const [
        { data: productData, error: productError },
        { data: salesData, error: salesError },
        { data: saleItemsData, error: saleItemsError },
      ] = await Promise.all([
        supabase
          .from("products")
          .select(
            "id, name, brand, price, stock_quantity, image_url"
          )
          .order("name", { ascending: true }),

        supabase
          .from("sales")
          .select("id, total, created_at")
          .order("created_at", { ascending: false })
          .limit(100),

        supabase
          .from("sale_items")
          .select(
            "id, sale_id, product_id, quantity, price"
          ),
      ]);

      if (productError) {
        console.error("PRODUCT ERROR:", productError);
      }

      if (salesError) {
        console.error("SALES ERROR:", salesError);
      }

      if (saleItemsError) {
        console.error(
          "SALE ITEMS ERROR:",
          saleItemsError
        );
      }

      setProducts(productData || []);
      setSales(salesData || []);
      setSaleItems(saleItemsData || []);
    } catch (error) {
      console.error(
        "DASHBOARD LOAD ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();

    const productsChannel = supabase
      .channel("dashboard-products")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        () => {
          loadDashboard();
        }
      )
      .subscribe();

    const salesChannel = supabase
      .channel("dashboard-sales")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sales",
        },
        () => {
          loadDashboard();
        }
      )
      .subscribe();

    const saleItemsChannel = supabase
      .channel("dashboard-sale-items")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sale_items",
        },
        () => {
          loadDashboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(salesChannel);
      supabase.removeChannel(saleItemsChannel);
    };
  }, []);

  const totalProducts = products.length;

  const totalUnits = products.reduce(
    (sum, product) =>
      sum + Number(product.stock_quantity || 0),
    0
  );

  const lowStockProducts = products.filter((product) => {
    const stock = Number(
      product.stock_quantity || 0
    );

    return stock > 0 && stock <= 5;
  });

  const outOfStockProducts = products.filter(
    (product) =>
      Number(product.stock_quantity || 0) === 0
  );

  const totalRevenue = sales.reduce(
    (sum, sale) =>
      sum + Number(sale.total || 0),
    0
  );

  const todayRevenue = useMemo(() => {
    const today = new Date();

    return sales
      .filter((sale) => {
        const date = new Date(sale.created_at);

        return (
          date.getFullYear() === today.getFullYear() &&
          date.getMonth() === today.getMonth() &&
          date.getDate() === today.getDate()
        );
      })
      .reduce(
        (sum, sale) =>
          sum + Number(sale.total || 0),
        0
      );
  }, [sales]);

  const productMap = useMemo(() => {
    const map = new Map<string, Product>();

    products.forEach((product) => {
      map.set(product.id, product);
    });

    return map;
  }, [products]);

  const bestSellers = useMemo(() => {
    const quantities = new Map<
      string,
      number
    >();

    saleItems.forEach((item) => {
      quantities.set(
        item.product_id,
        (quantities.get(item.product_id) || 0) +
          Number(item.quantity || 0)
      );
    });

    return Array.from(quantities.entries())
      .map(([productId, quantity]) => ({
        product: productMap.get(productId),
        quantity,
      }))
      .filter((item) => item.product)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [saleItems, productMap]);

  const recentSales = sales.slice(0, 5);

  const stockOverview = useMemo(() => {
    const inStock = products.filter(
      (product) =>
        Number(product.stock_quantity || 0) > 5
    ).length;

    const lowStock = lowStockProducts.length;

    const outOfStock = outOfStockProducts.length;

    return {
      inStock,
      lowStock,
      outOfStock,
    };
  }, [
    products,
    lowStockProducts,
    outOfStockProducts,
  ]);

  return (
    <EmployeeGuard>
      <main className="min-h-screen bg-[#fbf8f7] px-4 py-7 text-[#332c2e] sm:px-6 sm:py-10">
        <div className="mx-auto max-w-7xl">

          {/* ================================================= */}
          {/* HEADER */}
          {/* ================================================= */}

          <header className="mb-7 sm:mb-9">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#f5dfe4] px-3 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#c66b7a]" />

                  <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9d4f60]">
                    Ward Cosmetics
                  </span>
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight text-[#332c2e] sm:text-4xl">
                  Dashboard
                </h1>

                <p className="mt-2 max-w-xl text-sm leading-6 text-[#817477]">
                  A calm overview of your store,
                  sales and inventory.
                </p>
              </div>

              <div className="rounded-2xl border border-[#dbe8d6] bg-[#eef5eb] px-4 py-3 sm:min-w-[150px]">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#66805d]">
                  Today
                </p>

                <p className="mt-1 text-xl font-extrabold text-[#4f6948]">
                  ${todayRevenue.toFixed(2)}
                </p>

                <p className="mt-0.5 text-[10px] font-medium text-[#81957b]">
                  Today's revenue
                </p>
              </div>
            </div>
          </header>

          {/* ================================================= */}
          {/* SUMMARY CARDS */}
          {/* ================================================= */}

          <section className="mb-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <SummaryCard
              label="Products"
              value={totalProducts}
              description="In your inventory"
              icon="▤"
              tone="rose"
            />

            <SummaryCard
              label="Stock units"
              value={totalUnits}
              description="Items available"
              icon="▥"
              tone="green"
            />

            <SummaryCard
              label="Sales"
              value={sales.length}
              description="Recorded sales"
              icon="▣"
              tone="rose"
            />

            <SummaryCard
              label="Revenue"
              value={`$${totalRevenue.toFixed(2)}`}
              description="Total recorded"
              icon="$"
              tone="green"
            />
          </section>

          {/* ================================================= */}
          {/* RECENT SALES */}
          {/* ================================================= */}

          <section className="mb-6 overflow-hidden rounded-[28px] border border-[#eadfe0] bg-white shadow-[0_8px_30px_rgba(82,57,61,0.05)]">
            <SectionHeader
              eyebrow="Sales activity"
              title="Recent Sales"
              description="Your latest completed transactions."
              icon="▣"
              tone="rose"
            />

            {recentSales.length === 0 ? (
              <EmptyState
                icon="▣"
                title="No sales yet"
                description="Completed sales will appear here."
                tone="rose"
              />
            ) : (
              <div className="divide-y divide-[#f0e8e8]">
                {recentSales.map((sale, index) => (
                  <div
                    key={sale.id}
                    className="flex items-center gap-3 px-4 py-4 sm:px-6"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f8e8eb] text-sm font-extrabold text-[#a85566]">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#3d3436]">
                        Sale #{sale.id.slice(0, 8)}
                      </p>

                      <p className="mt-0.5 text-xs text-[#918487]">
                        {formatDate(
                          sale.created_at
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#eef5eb] px-3 py-2 text-right">
                      <p className="text-sm font-extrabold text-[#55704d]">
                        $
                        {Number(
                          sale.total || 0
                        ).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ================================================= */}
          {/* BEST SELLERS */}
          {/* ================================================= */}

          <section className="mb-6 overflow-hidden rounded-[28px] border border-[#dfe9db] bg-white shadow-[0_8px_30px_rgba(82,100,75,0.05)]">
            <SectionHeader
              eyebrow="Product performance"
              title="Best Sellers"
              description="Products that have sold the most."
              icon="★"
              tone="green"
            />

            {bestSellers.length === 0 ? (
              <EmptyState
                icon="★"
                title="No sales data yet"
                description="Best sellers will appear after products are sold."
                tone="green"
              />
            ) : (
              <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3 xl:grid-cols-5">
                {bestSellers.map(
                  ({ product, quantity }, index) => (
                    <div
                      key={product!.id}
                      className="rounded-[22px] border border-[#e2ebdf] bg-[#f7faf5] p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#dcebd6] text-xs font-extrabold text-[#55704d]">
                          #{index + 1}
                        </div>

                        <span className="rounded-full bg-[#eaf3e6] px-2.5 py-1 text-[10px] font-bold text-[#66805d]">
                          {quantity} sold
                        </span>
                      </div>

                      <div className="mt-4">
                        <p className="truncate text-sm font-extrabold text-[#3d3436]">
                          {product!.name}
                        </p>

                        {product!.brand && (
                          <p className="mt-1 truncate text-xs text-[#8a9585]">
                            {product!.brand}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-[#e3ebe0] pt-3">
                        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#899685]">
                          Price
                        </span>

                        <span className="text-sm font-extrabold text-[#55704d]">
                          $
                          {Number(
                            product!.price || 0
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </section>

          {/* ================================================= */}
          {/* STOCK OVERVIEW */}
          {/* ================================================= */}

          <section className="mb-6 rounded-[28px] border border-[#eadfe0] bg-white p-5 shadow-[0_8px_30px_rgba(82,57,61,0.05)] sm:p-6">
            <SectionHeader
              eyebrow="Inventory health"
              title="Stock Overview"
              description="A quick look at your current inventory levels."
              icon="▥"
              tone="rose"
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <StockCard
                label="In Stock"
                value={stockOverview.inStock}
                description="Healthy stock levels"
                icon="✓"
                className="bg-[#eef5eb] border-[#dbe8d6] text-[#55704d]"
              />

              <StockCard
                label="Low Stock"
                value={stockOverview.lowStock}
                description="Needs attention soon"
                icon="!"
                className="bg-[#fff4e5] border-[#f1dfc1] text-[#9a7540]"
              />

              <StockCard
                label="Out of Stock"
                value={stockOverview.outOfStock}
                description="Currently unavailable"
                icon="×"
                className="bg-[#f8e8eb] border-[#ead0d5] text-[#a85566]"
              />
            </div>
          </section>

          {/* ================================================= */}
          {/* LOW STOCK */}
          {/* ================================================= */}

          <section className="overflow-hidden rounded-[28px] border border-[#eadfe0] bg-white shadow-[0_8px_30px_rgba(82,57,61,0.05)]">
            <SectionHeader
              eyebrow="Needs attention"
              title="Low Stock"
              description="Products that are running low or completely out."
              icon="!"
              tone="rose"
            />

            {lowStockProducts.length === 0 &&
            outOfStockProducts.length === 0 ? (
              <div className="px-5 py-12 text-center sm:py-14">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef5eb] text-xl font-bold text-[#55704d]">
                  ✓
                </div>

                <h3 className="mt-4 text-sm font-extrabold text-[#3d3436]">
                  Everything looks good
                </h3>

                <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#8b8183]">
                  No products are currently low
                  or out of stock.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#f0e8e8]">
                {[
                  ...outOfStockProducts,
                  ...lowStockProducts,
                ].map((product) => {
                  const stock = Number(
                    product.stock_quantity || 0
                  );

                  const out = stock === 0;

                  return (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 px-4 py-4 sm:px-6"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f7f3f2]">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <span className="text-lg">
                            🛍️
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-[#3d3436]">
                          {product.name}
                        </p>

                        {product.brand && (
                          <p className="mt-0.5 truncate text-xs text-[#918487]">
                            {product.brand}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-flex rounded-xl px-3 py-1.5 text-[10px] font-extrabold ${
                            out
                              ? "bg-[#f8e8eb] text-[#a85566]"
                              : "bg-[#fff4e5] text-[#9a7540]"
                          }`}
                        >
                          {out
                            ? "Out of stock"
                            : "Low stock"}
                        </span>

                        <p className="mt-1.5 text-xs font-bold text-[#817477]">
                          {stock}{" "}
                          {stock === 1
                            ? "unit"
                            : "units"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* LOADING */}

          {loading && (
            <div className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-[#8b8183]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#c66b7a]" />
              Updating dashboard...
            </div>
          )}
        </div>
      </main>
    </EmployeeGuard>
  );
}

/* ========================================================= */
/* SUMMARY CARD */
/* ========================================================= */

function SummaryCard({
  label,
  value,
  description,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  description: string;
  icon: string;
  tone: "rose" | "green";
}) {
  const rose = tone === "rose";

  return (
    <div
      className={`rounded-[24px] border p-4 shadow-[0_8px_25px_rgba(82,57,61,0.04)] sm:p-5 ${
        rose
          ? "border-[#ead6da] bg-[#fff9fa]"
          : "border-[#dbe8d6] bg-[#f7fbf5]"
      }`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-extrabold ${
          rose
            ? "bg-[#f5dfe4] text-[#a85566]"
            : "bg-[#dfeeda] text-[#55704d]"
        }`}
      >
        {icon}
      </div>

      <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#918487]">
        {label}
      </p>

      <p
        className={`mt-1 text-2xl font-extrabold sm:text-3xl ${
          rose
            ? "text-[#9d4f60]"
            : "text-[#55704d]"
        }`}
      >
        {value}
      </p>

      <p className="mt-1 text-[10px] leading-4 text-[#968a8d]">
        {description}
      </p>
    </div>
  );
}

/* ========================================================= */
/* SECTION HEADER */
/* ========================================================= */

function SectionHeader({
  eyebrow,
  title,
  description,
  icon,
  tone,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
  tone: "rose" | "green";
}) {
  const rose = tone === "rose";

  return (
    <div className="flex items-start gap-3 border-b border-[#eee7e7] px-5 py-5 sm:px-6">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold ${
          rose
            ? "bg-[#f5dfe4] text-[#a85566]"
            : "bg-[#dfeeda] text-[#55704d]"
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p
          className={`text-[10px] font-extrabold uppercase tracking-[0.14em] ${
            rose
              ? "text-[#a85566]"
              : "text-[#66805d]"
          }`}
        >
          {eyebrow}
        </p>

        <h2 className="mt-1 text-lg font-extrabold text-[#3d3436] sm:text-xl">
          {title}
        </h2>

        <p className="mt-1 text-xs leading-5 text-[#918487]">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ========================================================= */
/* STOCK CARD */
/* ========================================================= */

function StockCard({
  label,
  value,
  description,
  icon,
  className,
}: {
  label: string;
  value: number;
  description: string;
  icon: string;
  className: string;
}) {
  return (
    <div
      className={`rounded-[22px] border p-5 ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold">
          {label}
        </span>

        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 text-sm font-extrabold">
          {icon}
        </span>
      </div>

      <p className="mt-4 text-3xl font-extrabold">
        {value}
      </p>

      <p className="mt-1 text-[10px] font-medium opacity-75">
        {description}
      </p>
    </div>
  );
}

/* ========================================================= */
/* EMPTY STATE */
/* ========================================================= */

function EmptyState({
  icon,
  title,
  description,
  tone,
}: {
  icon: string;
  title: string;
  description: string;
  tone: "rose" | "green";
}) {
  const rose = tone === "rose";

  return (
    <div className="px-5 py-12 text-center sm:py-14">
      <div
        className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-extrabold ${
          rose
            ? "bg-[#f8e8eb] text-[#a85566]"
            : "bg-[#eaf3e6] text-[#55704d]"
        }`}
      >
        {icon}
      </div>

      <h3 className="mt-4 text-sm font-extrabold text-[#3d3436]">
        {title}
      </h3>

      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#8b8183]">
        {description}
      </p>
    </div>
  );
}

/* ========================================================= */
/* DATE FORMAT */
/* ========================================================= */

function formatDate(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}