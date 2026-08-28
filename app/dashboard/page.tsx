"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import EmployeeGuard from "@/components/EmployeeGuard";

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
};

type Product = {
  id: string;
  name: string;
  brand: string | null;
  price: number | null;
  stock_quantity: number | null;
  image_url: string | null;
};

export default function DashboardPage() {
  const router = useRouter();

  const [sales, setSales] = useState<Sale[]>([]);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData(showRefresh = false) {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const [
      { data: salesData, error: salesError },
      { data: itemsData, error: itemsError },
      { data: productsData, error: productsError },
    ] = await Promise.all([
      supabase
        .from("sales")
        .select("id, total, created_at"),

      supabase
        .from("sale_items")
        .select("id, sale_id, product_id, quantity"),

      supabase
        .from("products")
        .select(
          "id, name, brand, price, stock_quantity, image_url"
        ),
    ]);

    if (salesError) {
      console.error("Sales error:", salesError);
    }

    if (itemsError) {
      console.error("Sale items error:", itemsError);
    }

    if (productsError) {
      console.error("Products error:", productsError);
    }

    setSales((salesData as Sale[]) || []);
    setItems((itemsData as SaleItem[]) || []);
    setProducts((productsData as Product[]) || []);

    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel("employee-dashboard")

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sales",
        },
        () => loadData()
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sale_items",
        },
        () => loadData()
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        () => loadData()
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const today = new Date().toDateString();

  const todaySales = sales.filter(
    (sale) =>
      new Date(sale.created_at).toDateString() === today
  );

  const todayRevenue = todaySales.reduce(
    (sum, sale) =>
      sum + Number(sale.total || 0),
    0
  );

  const todaySaleIds = todaySales.map(
    (sale) => sale.id
  );

  const todayItems = items.filter((item) =>
    todaySaleIds.includes(item.sale_id)
  );

  const itemsSold = todayItems.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0),
    0
  );

  const productsSold = products
    .map((product) => {
      const relatedItems = todayItems.filter(
        (item) =>
          item.product_id === product.id
      );

      const quantity = relatedItems.reduce(
        (sum, item) =>
          sum + Number(item.quantity || 0),
        0
      );

      return {
        ...product,
        quantity,
      };
    })
    .filter(
      (product) => product.quantity > 0
    )
    .sort(
      (a, b) =>
        b.quantity - a.quantity
    );

  const lowStock = products
    .filter(
      (product) =>
        Number(product.stock_quantity || 0) <= 5
    )
    .sort(
      (a, b) =>
        Number(a.stock_quantity || 0) -
        Number(b.stock_quantity || 0)
    );

  const outOfStock = products.filter(
    (product) =>
      Number(product.stock_quantity || 0) <= 0
  );

  const totalProducts = products.length;

  return (
    <EmployeeGuard>
      <main style={styles.page}>

        {/* BACKGROUND DECORATION */}
        <div style={styles.glowOne} />
        <div style={styles.glowTwo} />

        <div style={styles.container}>

          {/* HEADER */}
          <header style={styles.header}>

            <div>
              <div style={styles.eyebrow}>
                WARD COSMETICS
              </div>

              <h1 style={styles.title}>
                Dashboard
              </h1>

              <p style={styles.subtitle}>
                Your store at a glance
              </p>
            </div>

            <div style={styles.headerActions}>

              <button
                type="button"
                onClick={() =>
                  router.push("/home")
                }
                style={styles.homeButton}
              >
                <span>⌂</span>
                <span>Home</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  loadData(true)
                }
                disabled={refreshing}
                style={styles.refreshButton}
              >
                <span
                  style={{
                    display: "inline-block",
                    transform: refreshing
                      ? "rotate(360deg)"
                      : "none",
                    transition:
                      "transform 0.5s",
                  }}
                >
                  ↻
                </span>
              </button>

            </div>

          </header>

          {/* DATE / LIVE */}
          <div style={styles.statusRow}>

            <div style={styles.dateBox}>
              <span style={styles.dateIcon}>
                ◷
              </span>

              <div>
                <div style={styles.dateLabel}>
                  TODAY
                </div>

                <div style={styles.dateValue}>
                  {new Date().toLocaleDateString(
                    undefined,
                    {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </div>
              </div>
            </div>

            <div style={styles.liveBadge}>
              <span style={styles.liveDot} />
              Live
            </div>

          </div>

          {/* LOADING */}
          {loading ? (
            <div style={styles.loadingCard}>
              <div style={styles.loadingCircle}>
                ✨
              </div>

              <p>
                Loading your dashboard...
              </p>
            </div>
          ) : (
            <>
              {/* OVERVIEW */}
              <section style={styles.overviewGrid}>

                {/* REVENUE */}
                <div
                  style={{
                    ...styles.statCard,
                    ...styles.revenueCard,
                  }}
                >
                  <div style={styles.statTop}>
                    <div
                      style={{
                        ...styles.statIcon,
                        background:
                          "#f7e5e9",
                      }}
                    >
                      💰
                    </div>

                    <span
                      style={styles.statLabel}
                    >
                      TODAY
                    </span>
                  </div>

                  <div style={styles.statTitle}>
                    Revenue
                  </div>

                  <div style={styles.statNumber}>
                    $
                    {todayRevenue.toFixed(2)}
                  </div>

                  <div style={styles.statHint}>
                    Total sales today
                  </div>
                </div>

                {/* SALES */}
                <div style={styles.statCard}>
                  <div style={styles.statTop}>
                    <div
                      style={{
                        ...styles.statIcon,
                        background:
                          "#e4eee0",
                      }}
                    >
                      🧾
                    </div>

                    <span
                      style={styles.statLabel}
                    >
                      ORDERS
                    </span>
                  </div>

                  <div style={styles.statTitle}>
                    Sales
                  </div>

                  <div style={styles.statNumber}>
                    {todaySales.length}
                  </div>

                  <div style={styles.statHint}>
                    Transactions today
                  </div>
                </div>

                {/* ITEMS */}
                <div style={styles.statCard}>
                  <div style={styles.statTop}>
                    <div
                      style={{
                        ...styles.statIcon,
                        background:
                          "#e8edf4",
                      }}
                    >
                      📦
                    </div>

                    <span
                      style={styles.statLabel}
                    >
                      UNITS
                    </span>
                  </div>

                  <div style={styles.statTitle}>
                    Items Sold
                  </div>

                  <div style={styles.statNumber}>
                    {itemsSold}
                  </div>

                  <div style={styles.statHint}>
                    Products sold today
                  </div>
                </div>

                {/* PRODUCTS */}
                <div style={styles.statCard}>
                  <div style={styles.statTop}>
                    <div
                      style={{
                        ...styles.statIcon,
                        background:
                          "#f0e8f1",
                      }}
                    >
                      🛍️
                    </div>

                    <span
                      style={styles.statLabel}
                    >
                      CATALOG
                    </span>
                  </div>

                  <div style={styles.statTitle}>
                    Products
                  </div>

                  <div style={styles.statNumber}>
                    {totalProducts}
                  </div>

                  <div style={styles.statHint}>
                    Products in store
                  </div>
                </div>

              </section>

              {/* LOW STOCK ALERT */}
              {lowStock.length > 0 && (
                <section
                  style={styles.alertCard}
                >

                  <div
                    style={styles.alertIcon}
                  >
                    ⚠️
                  </div>

                  <div
                    style={styles.alertContent}
                  >
                    <div
                      style={
                        styles.alertTitle
                      }
                    >
                      Stock needs attention
                    </div>

                    <div
                      style={
                        styles.alertText
                      }
                    >
                      {outOfStock.length > 0
                        ? `${outOfStock.length} product${
                            outOfStock.length !==
                            1
                              ? "s are"
                              : " is"
                          } out of stock. `
                        : ""}
                      {lowStock.length} product
                      {lowStock.length !== 1
                        ? "s"
                        : ""}{" "}
                      have 5 or fewer units.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById(
                          "low-stock"
                        )
                        ?.scrollIntoView({
                          behavior: "smooth",
                        })
                    }
                    style={styles.alertButton}
                  >
                    View
                  </button>

                </section>
              )}

              {/* TODAY'S SALES */}
              <section style={styles.section}>

                <div style={styles.sectionHeader}>

                  <div>
                    <div
                      style={
                        styles.sectionEyebrow
                      }
                    >
                      SALES ACTIVITY
                    </div>

                    <h2
                      style={
                        styles.sectionTitle
                      }
                    >
                      Today's products
                    </h2>
                  </div>

                  <div
                    style={styles.countBadge}
                  >
                    {productsSold.length}
                  </div>

                </div>

                <div style={styles.listCard}>

                  {productsSold.length === 0 ? (
                    <div
                      style={
                        styles.emptyState
                      }
                    >
                      <div
                        style={
                          styles.emptyIcon
                        }
                      >
                        🛍️
                      </div>

                      <div
                        style={
                          styles.emptyTitle
                        }
                      >
                        No sales yet
                      </div>

                      <div
                        style={
                          styles.emptyText
                        }
                      >
                        Products sold today
                        will appear here.
                      </div>
                    </div>
                  ) : (
                    productsSold.map(
                      (product, index) => (
                        <div
                          key={product.id}
                          style={{
                            ...styles.productRow,
                            borderBottom:
                              index ===
                              productsSold.length -
                                1
                                ? "none"
                                : "1px solid #eee8e7",
                          }}
                        >

                          <div
                            style={
                              styles.productLeft
                            }
                          >

                            <div
                              style={
                                styles.productImage
                              }
                            >
                              {product.image_url ? (
                                <img
                                  src={
                                    product.image_url
                                  }
                                  alt={
                                    product.name
                                  }
                                  style={
                                    styles.image
                                  }
                                />
                              ) : (
                                "🧴"
                              )}
                            </div>

                            <div
                              style={
                                styles.productInfo
                              }
                            >
                              <strong
                                style={
                                  styles.productName
                                }
                              >
                                {product.name}
                              </strong>

                              <span
                                style={
                                  styles.productBrand
                                }
                              >
                                {product.brand ||
                                  "Ward Cosmetics"}
                              </span>
                            </div>

                          </div>

                          <div
                            style={
                              styles.quantityBadge
                            }
                          >
                            ×
                            {product.quantity}
                          </div>

                        </div>
                      )
                    )
                  )}

                </div>

              </section>

              {/* LOW STOCK */}
              <section
                id="low-stock"
                style={styles.section}
              >

                <div style={styles.sectionHeader}>

                  <div>
                    <div
                      style={
                        styles.sectionEyebrow
                      }
                    >
                      INVENTORY
                    </div>

                    <h2
                      style={
                        styles.sectionTitle
                      }
                    >
                      Stock alerts
                    </h2>
                  </div>

                  {lowStock.length > 0 && (
                    <div
                      style={
                        styles.warningCount
                      }
                    >
                      {lowStock.length} alerts
                    </div>
                  )}

                </div>

                <div style={styles.listCard}>

                  {lowStock.length === 0 ? (
                    <div
                      style={
                        styles.successState
                      }
                    >
                      <div
                        style={
                          styles.successIcon
                        }
                      >
                        ✓
                      </div>

                      <div>
                        <div
                          style={
                            styles.successTitle
                          }
                        >
                          Stock looks good
                        </div>

                        <div
                          style={
                            styles.successText
                          }
                        >
                          All products have
                          more than 5 units.
                        </div>
                      </div>
                    </div>
                  ) : (
                    lowStock.map(
                      (product, index) => {
                        const stock =
                          Number(
                            product.stock_quantity ||
                              0
                          );

                        const isOut =
                          stock <= 0;

                        return (
                          <div
                            key={product.id}
                            style={{
                              ...styles.productRow,
                              borderBottom:
                                index ===
                                lowStock.length -
                                  1
                                  ? "none"
                                  : "1px solid #eee8e7",
                            }}
                          >

                            <div
                              style={
                                styles.productLeft
                              }
                            >

                              <div
                                style={
                                  styles.productImage
                                }
                              >
                                {product.image_url ? (
                                  <img
                                    src={
                                      product.image_url
                                    }
                                    alt={
                                      product.name
                                    }
                                    style={
                                      styles.image
                                    }
                                  />
                                ) : (
                                  "🧴"
                                )}
                              </div>

                              <div
                                style={
                                  styles.productInfo
                                }
                              >
                                <strong
                                  style={
                                    styles.productName
                                  }
                                >
                                  {product.name}
                                </strong>

                                <span
                                  style={
                                    styles.productBrand
                                  }
                                >
                                  {product.brand ||
                                    "Ward Cosmetics"}
                                </span>
                              </div>

                            </div>

                            <div
                              style={{
                                ...styles.stockBadge,
                                ...(isOut
                                  ? styles.outBadge
                                  : styles.lowBadge),
                              }}
                            >
                              {isOut
                                ? "Out of stock"
                                : `${stock} left`}
                            </div>

                          </div>
                        );
                      }
                    )
                  )}

                </div>

              </section>

              {/* QUICK LINKS */}
              <section style={styles.quickSection}>

                <div
                  style={
                    styles.quickSectionTitle
                  }
                >
                  Quick access
                </div>

                <div style={styles.quickGrid}>

                  <button
                    type="button"
                    onClick={() =>
                      router.push("/products")
                    }
                    style={styles.quickCard}
                  >
                    <div
                      style={{
                        ...styles.quickIcon,
                        background:
                          "#e4eee0",
                      }}
                    >
                      📦
                    </div>

                    <div>
                      <strong
                        style={
                          styles.quickTitle
                        }
                      >
                        Products
                      </strong>

                      <span
                        style={
                          styles.quickText
                        }
                      >
                        Search & scan
                      </span>
                    </div>

                    <span
                      style={
                        styles.quickArrow
                      }
                    >
                      →
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        "/employee-add-product"
                      )
                    }
                    style={styles.quickCard}
                  >
                    <div
                      style={{
                        ...styles.quickIcon,
                        background:
                          "#f7e5e9",
                      }}
                    >
                      ＋
                    </div>

                    <div>
                      <strong
                        style={
                          styles.quickTitle
                        }
                      >
                        Add Product
                      </strong>

                      <span
                        style={
                          styles.quickText
                        }
                      >
                        Add to inventory
                      </span>
                    </div>

                    <span
                      style={
                        styles.quickArrow
                      }
                    >
                      →
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      router.push("/register")
                    }
                    style={styles.quickCard}
                  >
                    <div
                      style={{
                        ...styles.quickIcon,
                        background:
                          "#f2eee0",
                      }}
                    >
                      🧾
                    </div>

                    <div>
                      <strong
                        style={
                          styles.quickTitle
                        }
                      >
                        Register
                      </strong>

                      <span
                        style={
                          styles.quickText
                        }
                      >
                        Process a sale
                      </span>
                    </div>

                    <span
                      style={
                        styles.quickArrow
                      }
                    >
                      →
                    </span>
                  </button>

                </div>

              </section>

            </>
          )}

          {/* FOOTER */}
          <footer style={styles.footer}>
            <div style={styles.footerBrand}>
              WARD COSMETICS
            </div>

            <div style={styles.footerText}>
              Store Management System
            </div>
          </footer>

        </div>
      </main>
    </EmployeeGuard>
  );
}

const styles: any = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #f8faf7 0%, #fdf8f8 50%, #f6f3f5 100%)",
    color: "#292425",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    padding: "20px 14px 40px",
    position: "relative",
    overflow: "hidden",
  },

  container: {
    maxWidth: 1050,
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },

  glowOne: {
    position: "fixed",
    width: 300,
    height: 300,
    borderRadius: "50%",
    background:
      "rgba(164,93,107,0.08)",
    top: -180,
    right: -130,
    pointerEvents: "none",
  },

  glowTwo: {
    position: "fixed",
    width: 280,
    height: 280,
    borderRadius: "50%",
    background:
      "rgba(126,158,116,0.08)",
    bottom: -160,
    left: -130,
    pointerEvents: "none",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 15,
    marginBottom: 18,
  },

  eyebrow: {
    color: "#a45d6b",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 2,
  },

  title: {
    margin: "4px 0 0",
    fontSize: "clamp(28px, 7vw, 38px)",
    lineHeight: 1.05,
    fontWeight: 800,
    color: "#293429",
  },

  subtitle: {
    margin: "6px 0 0",
    color: "#8d8385",
    fontSize: 12,
  },

  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: 7,
  },

  homeButton: {
    border: "1px solid #e8dcdc",
    background: "white",
    color: "#665b5d",
    borderRadius: 13,
    padding: "9px 11px",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 5,
  },

  refreshButton: {
    width: 38,
    height: 38,
    border: "1px solid #e8dcdc",
    background: "white",
    color: "#a45d6b",
    borderRadius: 13,
    fontSize: 20,
    cursor: "pointer",
  },

  statusRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },

  dateBox: {
    display: "flex",
    alignItems: "center",
    gap: 9,
  },

  dateIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    background: "#e4eee0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#52634e",
    fontSize: 17,
  },

  dateLabel: {
    color: "#aaa0a2",
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: 1,
  },

  dateValue: {
    color: "#5f5758",
    fontSize: 11,
    fontWeight: 700,
    marginTop: 2,
  },

  liveBadge: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 20,
    background: "#e4eee0",
    color: "#52634e",
    fontSize: 10,
    fontWeight: 800,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#719167",
  },

  loadingCard: {
    background: "white",
    border: "1px solid #eadfdf",
    borderRadius: 24,
    padding: 45,
    textAlign: "center",
    color: "#8d8385",
    boxShadow:
      "0 10px 30px rgba(80,50,50,0.05)",
  },

  loadingCircle: {
    width: 55,
    height: 55,
    borderRadius: 18,
    background: "#e4eee0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 12px",
    fontSize: 23,
  },

  overviewGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: 12,
  },

  statCard: {
    background: "rgba(255,255,255,0.92)",
    border: "1px solid #eadfdf",
    borderRadius: 22,
    padding: 17,
    boxShadow:
      "0 8px 25px rgba(80,50,50,0.05)",
    minWidth: 0,
  },

  revenueCard: {
    background:
      "linear-gradient(145deg, #fffafa, #f9eeee)",
  },

  statTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
  },

  statLabel: {
    color: "#aaa0a2",
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: 1,
  },

  statTitle: {
    color: "#73696b",
    fontSize: 11,
    marginTop: 13,
  },

  statNumber: {
    color: "#292425",
    fontSize: 25,
    fontWeight: 800,
    marginTop: 2,
    whiteSpace: "nowrap",
  },

  statHint: {
    color: "#aaa0a2",
    fontSize: 9,
    marginTop: 5,
  },

  alertCard: {
    marginTop: 14,
    background: "#fff7f2",
    border: "1px solid #f0d9d4",
    borderRadius: 20,
    padding: 14,
    display: "flex",
    alignItems: "center",
    gap: 11,
  },

  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    background: "#f9e7e2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    flexShrink: 0,
  },

  alertContent: {
    flex: 1,
    minWidth: 0,
  },

  alertTitle: {
    fontSize: 12,
    fontWeight: 800,
    color: "#5b4948",
  },

  alertText: {
    marginTop: 3,
    color: "#927c7a",
    fontSize: 10,
    lineHeight: 1.45,
  },

  alertButton: {
    border: "none",
    background: "#a45d6b",
    color: "white",
    borderRadius: 11,
    padding: "8px 12px",
    fontSize: 10,
    fontWeight: 800,
    cursor: "pointer",
    flexShrink: 0,
  },

  section: {
    marginTop: 27,
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  sectionEyebrow: {
    color: "#a45d6b",
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: 1.5,
  },

  sectionTitle: {
    margin: "3px 0 0",
    fontSize: 19,
    fontWeight: 800,
    color: "#293429",
  },

  countBadge: {
    minWidth: 30,
    height: 30,
    padding: "0 9px",
    borderRadius: 10,
    background: "#e4eee0",
    color: "#52634e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 800,
  },

  warningCount: {
    padding: "6px 9px",
    borderRadius: 10,
    background: "#f7e5e9",
    color: "#a45d6b",
    fontSize: 9,
    fontWeight: 800,
  },

  listCard: {
    background: "rgba(255,255,255,0.95)",
    border: "1px solid #eadfdf",
    borderRadius: 20,
    padding: "3px 15px",
    boxShadow:
      "0 8px 25px rgba(80,50,50,0.04)",
  },

  productRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: "11px 0",
  },

  productLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },

  productImage: {
    width: 42,
    height: 42,
    borderRadius: 13,
    background: "#f3eeee",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
    fontSize: 18,
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  productInfo: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
  },

  productName: {
    color: "#342e30",
    fontSize: 12,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "55vw",
  },

  productBrand: {
    color: "#aaa0a2",
    fontSize: 9,
    marginTop: 3,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  quantityBadge: {
    background: "#e4eee0",
    color: "#52634e",
    padding: "7px 10px",
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 800,
    flexShrink: 0,
  },

  stockBadge: {
    padding: "7px 10px",
    borderRadius: 10,
    fontSize: 9,
    fontWeight: 800,
    flexShrink: 0,
  },

  lowBadge: {
    background: "#f7e5e9",
    color: "#a45d6b",
  },

  outBadge: {
    background: "#403a3b",
    color: "white",
  },

  emptyState: {
    textAlign: "center",
    padding: "35px 15px",
  },

  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    background: "#f7e5e9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 10px",
    fontSize: 21,
  },

  emptyTitle: {
    color: "#4a4243",
    fontSize: 13,
    fontWeight: 800,
  },

  emptyText: {
    color: "#aaa0a2",
    fontSize: 10,
    marginTop: 4,
  },

  successState: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "20px 4px",
  },

  successIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    background: "#e4eee0",
    color: "#52634e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: 800,
  },

  successTitle: {
    color: "#4a5946",
    fontSize: 12,
    fontWeight: 800,
  },

  successText: {
    color: "#8b9887",
    fontSize: 10,
    marginTop: 3,
  },

  quickSection: {
    marginTop: 28,
  },

  quickSectionTitle: {
    color: "#73696b",
    fontSize: 11,
    fontWeight: 800,
    marginBottom: 9,
  },

  quickGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: 10,
  },

  quickCard: {
    border: "1px solid #eadfdf",
    background: "white",
    borderRadius: 18,
    padding: 13,
    display: "flex",
    alignItems: "center",
    gap: 9,
    cursor: "pointer",
    textAlign: "left",
    boxShadow:
      "0 6px 20px rgba(80,50,50,0.04)",
    minWidth: 0,
  },

  quickIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 17,
    flexShrink: 0,
  },

  quickTitle: {
    display: "block",
    color: "#3b3435",
    fontSize: 11,
  },

  quickText: {
    display: "block",
    color: "#aaa0a2",
    fontSize: 8,
    marginTop: 3,
  },

  quickArrow: {
    marginLeft: "auto",
    color: "#a45d6b",
    fontSize: 17,
    flexShrink: 0,
  },

  footer: {
    textAlign: "center",
    marginTop: 35,
    paddingTop: 20,
    borderTop: "1px solid #eadfdf",
  },

  footerBrand: {
    color: "#a45d6b",
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: 1.5,
  },

  footerText: {
    color: "#aaa0a2",
    fontSize: 9,
    marginTop: 4,
  },
};