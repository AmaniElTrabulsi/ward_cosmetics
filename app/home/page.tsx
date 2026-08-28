"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Employee = {
  username?: string;
};

export default function HomePage() {
  const router = useRouter();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("employee");

    if (!stored) {
      router.replace("/employee-login");
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      setEmployee(parsed);
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

  const username = employee.username || "Employee";

  const menuItems = [
    {
      icon: "🔍",
      title: "Search & Scan Products",
      description: "Search products or scan a barcode",
      path: "/products",
      background: "#e8f0e5",
    },
    {
      icon: "➕",
      title: "Add Product",
      description: "Add a new product to the store",
      path: "/add-product",
      background: "#f5e5e8",
    },
    {
      icon: "🧾",
      title: "Register",
      description: "Sell products at the register",
      path: "/register",
      background: "#e8f0e5",
    },
    {
      icon: "📊",
      title: "Dashboard",
      description: "View store performance and activity",
      path: "/dashboard",
      background: "#f5e5e8",
    },
  ];

  return (
    <main style={styles.page}>
      {/* DECORATION */}
      <div style={styles.topGlow} />
      <div style={styles.bottomGlow} />

      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.brandArea}>
          <div style={styles.logo}>🛍️</div>

          <div style={styles.brandTextArea}>
            <div style={styles.brand}>WARD COSMETICS</div>
            <div style={styles.storeText}>
              Store Management
            </div>
          </div>
        </div>

        {/* PROFILE */}
        <div style={styles.profileWrapper}>
          <button
            type="button"
            onClick={() => setMenuOpen((previous) => !previous)}
            style={styles.profileButton}
          >
            <div style={styles.avatar}>
              {username.charAt(0).toUpperCase()}
            </div>

            <span style={styles.profileName}>
              {username}
            </span>

            <span style={styles.chevron}>
              {menuOpen ? "▲" : "▼"}
            </span>
          </button>

          {menuOpen && (
            <div style={styles.menu}>
              <div style={styles.menuUser}>
                <div style={styles.menuUserName}>
                  {username}
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
              {username}
            </span>
            !
          </h1>

          <p style={styles.heroText}>
            Everything you need to manage Ward Cosmetics,
            all in one place.
          </p>
        </div>

        <div style={styles.heroIcon}>✨</div>
      </section>

      {/* QUICK ACTIONS */}
      <section style={styles.actionsSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>
            Quick Actions
          </h2>

          <p style={styles.sectionSubtitle}>
            Choose what you want to do
          </p>
        </div>

        <div style={styles.actionList}>
          {menuItems.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => router.push(item.path)}
              style={styles.actionCard}
            >
              <div
                style={{
                  ...styles.actionIcon,
                  background: item.background,
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

              <div style={styles.arrow}>→</div>
            </button>
          ))}
        </div>
      </section>

      {/* INFO CARD */}
      <section style={styles.infoCard}>
        <div style={styles.infoIcon}>💡</div>

        <div style={styles.infoContent}>
          <h3 style={styles.infoTitle}>
            Keep your store moving
          </h3>

          <p style={styles.infoText}>
            Search or scan products, add new products,
            process sales, and monitor your store from
            one simple workspace.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={styles.footer}>
        Ward Cosmetics · Store Management System
      </footer>
    </main>
  );
}

const styles: any = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #faf9f7 0%, #edf4ea 52%, #faf0f2 100%)",
    padding: "18px 14px 30px",
    color: "#29332b",
    fontFamily: "Arial, sans-serif",
    position: "relative",
    overflow: "hidden",
  },

  topGlow: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: "50%",
    background: "rgba(164,93,107,0.07)",
    top: -250,
    right: -170,
    pointerEvents: "none",
  },

  bottomGlow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: "50%",
    background: "rgba(102,131,95,0.06)",
    bottom: -220,
    left: -180,
    pointerEvents: "none",
  },

  header: {
    width: "100%",
    maxWidth: 1050,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    position: "relative",
    zIndex: 10,
  },

  brandArea: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },

  logo: {
    width: 44,
    height: 44,
    minWidth: 44,
    borderRadius: 14,
    background:
      "linear-gradient(135deg, #66835f, #a45d6b)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 21,
    boxShadow: "0 8px 20px rgba(82,105,76,0.18)",
  },

  brandTextArea: {
    minWidth: 0,
  },

  brand: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.4,
    color: "#526b4c",
    whiteSpace: "nowrap",
  },

  storeText: {
    fontSize: 11,
    color: "#9a9091",
    marginTop: 3,
  },

  profileWrapper: {
    position: "relative",
    flexShrink: 0,
  },

  profileButton: {
    border: "1px solid #e2dcda",
    background: "rgba(255,255,255,0.94)",
    borderRadius: 14,
    padding: "5px 8px 5px 5px",
    display: "flex",
    alignItems: "center",
    gap: 7,
    cursor: "pointer",
    boxShadow: "0 5px 18px rgba(55,45,45,0.06)",
  },

  avatar: {
    width: 30,
    height: 30,
    borderRadius: 9,
    background: "#a45d6b",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
  },

  profileName: {
    fontSize: 12,
    fontWeight: 700,
    color: "#4b4445",
    maxWidth: 90,
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
    width: 200,
    background: "white",
    borderRadius: 16,
    padding: 8,
    boxShadow: "0 15px 40px rgba(55,45,45,0.16)",
    border: "1px solid #eee6e5",
    zIndex: 30,
  },

  menuUser: {
    padding: "10px 11px",
    borderBottom: "1px solid #f0ebea",
    marginBottom: 5,
  },

  menuUserName: {
    fontSize: 13,
    fontWeight: 700,
    color: "#29302b",
  },

  menuUserRole: {
    fontSize: 11,
    color: "#9a9091",
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
    margin: "32px auto 34px",
    background:
      "linear-gradient(135deg, #354a35 0%, #647d5c 58%, #a45d6b 150%)",
    borderRadius: 27,
    padding: "28px 22px",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    boxShadow: "0 20px 45px rgba(67,83,62,0.18)",
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
  },

  heroContent: {
    minWidth: 0,
  },

  welcomeBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "7px 11px",
    borderRadius: 20,
    background: "rgba(255,255,255,0.12)",
    color: "#edf5ea",
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 13,
  },

  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#e8b9c2",
  },

  heroTitle: {
    margin: 0,
    fontSize: "clamp(27px, 8vw, 40px)",
    lineHeight: 1.12,
    fontWeight: 800,
  },

  heroAccent: {
    color: "#f0c8cf",
  },

  heroText: {
    color: "#e4ebe2",
    fontSize: 13,
    lineHeight: 1.6,
    maxWidth: 540,
    marginTop: 11,
    marginBottom: 0,
  },

  heroIcon: {
    width: 68,
    height: 68,
    minWidth: 68,
    borderRadius: 22,
    background: "rgba(255,255,255,0.11)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
  },

  actionsSection: {
    width: "100%",
    maxWidth: 1050,
    margin: "0 auto",
  },

  sectionHeader: {
    marginBottom: 14,
  },

  sectionTitle: {
    margin: 0,
    fontSize: 21,
    fontWeight: 800,
    color: "#303830",
  },

  sectionSubtitle: {
    margin: "5px 0 0",
    fontSize: 12,
    color: "#817778",
  },

  /*
   * IMPORTANT:
   * The actions stay underneath each other.
   * This makes the employee home page much
   * easier to use on a phone.
   */
  actionList: {
    display: "flex",
    flexDirection: "column",
    gap: 11,
  },

  actionCard: {
    width: "100%",
    border: "1px solid #e7e1df",
    background: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 14,
    display: "flex",
    alignItems: "center",
    gap: 12,
    cursor: "pointer",
    textAlign: "left",
    boxShadow: "0 8px 25px rgba(65,55,55,0.05)",
    boxSizing: "border-box",
    minHeight: 76,
  },

  actionIcon: {
    width: 50,
    height: 50,
    minWidth: 50,
    borderRadius: 15,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
  },

  actionContent: {
    flex: 1,
    minWidth: 0,
  },

  actionTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 800,
    color: "#303630",
  },

  actionDescription: {
    margin: "5px 0 0",
    fontSize: 11,
    lineHeight: 1.4,
    color: "#7b7374",
  },

  arrow: {
    fontSize: 20,
    color: "#a45d6b",
    flexShrink: 0,
  },

  infoCard: {
    width: "100%",
    maxWidth: 1050,
    margin: "22px auto 0",
    padding: 16,
    borderRadius: 19,
    background: "rgba(255,255,255,0.74)",
    border: "1px solid #e7e1df",
    display: "flex",
    alignItems: "center",
    gap: 12,
    boxSizing: "border-box",
  },

  infoIcon: {
    width: 42,
    height: 42,
    minWidth: 42,
    borderRadius: 13,
    background: "#f5e6e9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
  },

  infoContent: {
    minWidth: 0,
  },

  infoTitle: {
    margin: 0,
    fontSize: 13,
    fontWeight: 800,
    color: "#303630",
  },

  infoText: {
    margin: "4px 0 0",
    color: "#777071",
    fontSize: 11,
    lineHeight: 1.5,
  },

  footer: {
    width: "100%",
    maxWidth: 1050,
    margin: "30px auto 0",
    textAlign: "center",
    fontSize: 10,
    color: "#9b9091",
  },
};