import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Ward Cosmetics", description: "A considered beauty experience." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
