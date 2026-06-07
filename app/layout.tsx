import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Ward Cosmetics POS",
  description: "Inventory & POS System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={styles.body}>
        <Sidebar />

        <main style={styles.main}>{children}</main>
      </body>
    </html>
  );
}

const styles: any = {
  body: {
    margin: 0,
    fontFamily: "Inter, Arial, sans-serif",
    background: "#0b1220",
    color: "#e5e7eb",
  },

  main: {
    marginLeft: 70,
    padding: 24,
    minHeight: "100vh",
  },
};