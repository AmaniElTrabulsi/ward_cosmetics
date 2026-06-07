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
}: {
  children: React.ReactNode;
}) {
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
        {/* GLOBAL BURGER SIDEBAR */}
        <Sidebar />

        {/* PAGE CONTENT */}
        <main
          style={{
            minHeight: "100vh",
            padding: 20,
            boxSizing: "border-box",
          }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}