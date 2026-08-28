"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const [employee, setEmployee] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

  function signOut() {
    localStorage.removeItem("employee");
    router.replace("/employee-login");
  }

  if (!employee) {
    return null;
  }

  const menuItems = [
    {
      icon: "🔍",
      title: "Products",
      description: "Search products and scan barcodes",
      path: "/products",
      iconBackground: "#f5e4e8",
    },
    {
      icon: "🧾",
      title: "Register",
      description: "Sell products and process sales",
      path: "/register",
      iconBackground: "#e5f0e1",
    },
    {
      icon: "📦",
      title: "Add Product",
      description: "Add a new product to inventory",
      path: "/add-product",
      iconBackground: "#f9e8eb",
    },
    {
      icon: "📊",
      title: "Dashboard",
      description: "View today's store performance",
      path: "/dashboard",
      iconBackground: "#e8f0e5",
    },
  ];

  return (
    <main style={styles.page}>
      <div style={styles.topGlow} />
      <div style={styles.bottomGlow} />

      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.brandArea}>
          <div style={styles.logo}>
            🛍️
          </div>

          <div style={styles.brandTextArea}>
            <div style={styles.brand}>
              WARD COSMETICS
            </div>

            <div style={styles.storeText}>
              Store Management
            </div>
          </div>
        </div>

        {/* PROFILE */}
        <div style={styles.profileWrapper}>
          <button
            type="button"
            onClick={() =>
              setMenuOpen(!menuOpen)
            }
            style={styles.profileButton}
          >
            <div style={styles.avatar}>
              {(employee.username || "E")
                .charAt(0)
                .toUpperCase()}
            </div>

            <span style={styles.profileName}>
              {employee.username}
            </span>

            <span style={styles.chevron}>
              {menuOpen ? "▲" : "▼"}
            </span>
          </button>

          {menuOpen && (
            <div style={styles.menu}>
              <div style={styles.menuUser}>
                <div style={styles.menuUserName}>
                  {employee.username}
                </div>

                <div style={styles.menuUserRole}>
                  Employee
                </div>
              </div>

              <button
                type="button"
                onClick={signOut}
                style={styles.signOutButton}
              >
                <span>↪</span>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* HERO */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.welcomeBadge}>
            <span style={styles.badgeDot} />
            Store Workspace
          </div>

          <h1 style={styles.heroTitle}>
            Hello,{" "}
            <span style={styles.heroAccent}>
              {employee.username}
            </span>
            !
          </h1>

          <p style={styles.heroText}>
            Everything you need to manage Ward
            Cosmetics, all in one simple place.
          </p>
        </div>

        <div style={styles.heroDecoration}>
          <div style={styles.heroDecorationInner}>
            ✨
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section style={styles.actionsSection}>
        <div style={styles.sectionHeader}>
          <div>
            <div style={styles.sectionEyebrow}>
              WORKSPACE
            </div>

            <h2 style={styles.sectionTitle}>
              Quick Actions
            </h2>

            <p style={styles.sectionSubtitle}>
              Choose what you want to do
            </p>
          </div>
        </div>

        <div style={styles.grid}>
          {menuItems.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() =>
                router.push(item.path)
              }
              style={styles.actionCard}
            >
              <div
                style={{
                  ...styles.actionIcon,
                  background:
                    item.iconBackground,
                }}
              >
                {item.icon}
              </div>

              <div style={styles.actionContent}>
                <h3 style={styles.actionTitle}>
                  {item.title}
                </h3>

                <p style={styles.actionDescription}>
                  {item.description}
                </p>
              </div>

              <div style={styles.arrow}>
                →
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* INFO CARD */}
      <section style={styles.infoCard}>
        <div style={styles.infoIcon}>
          💡
        </div>

        <div style={styles.infoContent}>
          <h3 style={styles.infoTitle}>
            Keep your store moving
          </h3>

          <p style={styles.infoText}>
            Search products, scan barcodes, add new
            products, process sales, and monitor
            your store from one place.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <div style={styles.footerBrand}>
          WARD COSMETICS
        </div>

        <div style={styles.footerText}>
          Store Management System
        </div>
      </footer>
    </main>
  );
}

const styles: any = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(145deg, #fbf8f7 0%, #f4f7f1 50%, #faf1f3 100%)",
    padding: "20px 16px 32px",
    color: "#292425",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    position: "relative",
    overflow: "hidden",
  },

  topGlow: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: "50%",
    background:
      "rgba(164,93,107,0.08)",
    top: -220,
    right: -160,
    pointerEvents: "none",
  },

  bottomGlow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: "50%",
    background:
      "rgba(126,157,115,0.08)",
    bottom: -200,
    left: -160,
    pointerEvents: "none",
  },

  header: {
    width: "100%",
    maxWidth: 1050,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    position: "relative",
    zIndex: 20,
  },

  brandArea: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },

  logo: {
    width: 45,
    height: 45,
    minWidth: 45,
    borderRadius: 15,
    background:
      "linear-gradient(135deg, #a45d6b, #bd7b87)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 21,
    boxShadow:
      "0 8px 22px rgba(164,93,107,0.20)",
  },

  brandTextArea: {
    minWidth: 0,
  },

  brand: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.5,
    color: "#a45d6b",
    whiteSpace: "nowrap",
  },

  storeText: {
    fontSize: 11,
    color: "#8d8888",
    marginTop: 3,
  },

  profileWrapper: {
    position: "relative",
    flexShrink: 0,
  },

  profileButton: {
    border:
      "1px solid #e6dddd",
    background:
      "rgba(255,255,255,0.92)",
    borderRadius: 15,
    padding: "5px 8px 5px 5px",
    display: "flex",
    alignItems: "center",
    gap: 7,
    cursor: "pointer",
    boxShadow:
      "0 5px 18px rgba(60,40,40,0.06)",
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 11,
    background: "#536a4d",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
  },

  profileName: {
    fontSize: 12,
    fontWeight: 700,
    color: "#51484a",
    maxWidth: 100,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  chevron: {
    fontSize: 7,
    color: "#9b9192",
  },

  menu: {
    position: "absolute",
    top: 46,
    right: 0,
    width: 205,
    background: "white",
    borderRadius: 17,
    padding: 8,
    boxShadow:
      "0 18px 45px rgba(60,40,40,0.16)",
    border: "1px solid #eee5e5",
    zIndex: 50,
  },

  menuUser: {
    padding: "10px 11px",
    borderBottom:
      "1px solid #f0e9e9",
    marginBottom: 5,
  },

  menuUserName: {
    fontSize: 13,
    fontWeight: 700,
    color: "#292425",
  },

  menuUserRole: {
    fontSize: 11,
    color: "#9b9192",
    marginTop: 3,
  },

  signOutButton: {
    width: "100%",
    border: "none",
    background: "transparent",
    padding: 11,
    borderRadius: 10,
    display: "flex",
    gap: 9,
    alignItems: "center",
    cursor: "pointer",
    color: "#a45d6b",
    fontSize: 13,
    fontWeight: 600,
    textAlign: "left",
  },

  hero: {
    width: "100%",
    maxWidth: 1050,
    margin: "30px auto 35px",
    background:
      "linear-gradient(135deg, #3f5140 0%, #536a4d 55%, #647b5d 100%)",
    borderRadius: 28,
    padding: "30px 24px",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    boxShadow:
      "0 20px 45px rgba(65,85,65,0.18)",
    position: "relative",
    overflow: "hidden",
  },

  heroContent: {
    position: "relative",
    zIndex: 2,
    minWidth: 0,
  },

  welcomeBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "7px 11px",
    borderRadius: 20,
    background:
      "rgba(255,255,255,0.12)",
    color: "#e8efe5",
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 14,
  },

  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#d899a4",
  },

  heroTitle: {
    margin: 0,
    fontSize: 32,
    lineHeight: 1.12,
    fontWeight: 800,
    letterSpacing: -0.7,
  },

  heroAccent: {
    color: "#e7b5bd",
  },

  heroText: {
    color: "#dbe5d8",
    fontSize: 13,
    lineHeight: 1.6,
    maxWidth: 520,
    marginTop: 11,
    marginBottom: 0,
  },

  heroDecoration: {
    width: 82,
    height: 82,
    minWidth: 82,
    borderRadius: 27,
    background:
      "rgba(255,255,255,0.09)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  heroDecorationInner: {
    width: 58,
    height: 58,
    borderRadius: 20,
    background:
      "rgba(255,255,255,0.10)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 27,
  },

  actionsSection: {
    width: "100%",
    maxWidth: 1050,
    margin: "0 auto",
    position: "relative",
    zIndex: 2,
  },

  sectionHeader: {
    marginBottom: 14,
  },

  sectionEyebrow: {
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: 1.8,
    color: "#a45d6b",
    marginBottom: 4,
  },

  sectionTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 800,
    color: "#293129",
  },

  sectionSubtitle: {
    margin: "4px 0 0",
    fontSize: 12,
    color: "#8a8082",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },

  actionCard: {
    width: "100%",
    minWidth: 0,
    border:
      "1px solid #e8e0df",
    background:
      "rgba(255,255,255,0.92)",
    borderRadius: 21,
    padding: 15,
    display: "flex",
    alignItems: "center",
    gap: 11,
    cursor: "pointer",
    textAlign: "left",
    boxShadow:
      "0 8px 25px rgba(70,50,50,0.05)",
    transition:
      "transform 0.2s ease, box-shadow 0.2s ease",
  },

  actionIcon: {
    width: 48,
    height: 48,
    minWidth: 48,
    borderRadius: 15,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 21,
  },

  actionContent: {
    flex: 1,
    minWidth: 0,
  },

  actionTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 800,
    color: "#303031",
  },

  actionDescription: {
    margin: "4px 0 0",
    fontSize: 10.5,
    lineHeight: 1.4,
    color: "#817779",
  },

  arrow: {
    fontSize: 18,
    color: "#a45d6b",
    flexShrink: 0,
  },

  infoCard: {
    width: "100%",
    maxWidth: 1050,
    margin: "22px auto 0",
    padding: 16,
    borderRadius: 20,
    background:
      "rgba(228,238,224,0.78)",
    border:
      "1px solid #d8e5d3",
    display: "flex",
    alignItems: "center",
    gap: 12,
    position: "relative",
    zIndex: 2,
  },

  infoIcon: {
    width: 43,
    height: 43,
    minWidth: 43,
    borderRadius: 14,
    background: "#fff5f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 19,
  },

  infoContent: {
    minWidth: 0,
  },

  infoTitle: {
    margin: 0,
    fontSize: 13,
    fontWeight: 800,
    color: "#3e4d3c",
  },

  infoText: {
    margin: "4px 0 0",
    color: "#697566",
    fontSize: 11,
    lineHeight: 1.5,
  },

  footer: {
    width: "100%",
    maxWidth: 1050,
    margin: "28px auto 0",
    textAlign: "center",
    position: "relative",
    zIndex: 2,
  },

  footerBrand: {
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: 1.5,
    color: "#a45d6b",
  },

  footerText: {
    marginTop: 3,
    fontSize: 10,
    color: "#a09697",
  },
};