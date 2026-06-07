import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ward Cosmetics POS",
  description: "Inventory & POS system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          backgroundColor: "#0f0f10",
          color: "white",
        }}
      >
        <div style={{ display: "flex", minHeight: "100vh" }}>
          {/* SIDEBAR (GLOBAL NAVIGATION) */}
          <Sidebar />

          {/* PAGE CONTENT */}
          <main style={{ flex: 1, padding: 20 }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}