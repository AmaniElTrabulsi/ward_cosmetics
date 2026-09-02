import type { Metadata } from "next";
import "./globals.css";
import PushNotificationSetup from "@/components/PushNotificationSetup";

export const metadata: Metadata = {
  title: "Ward Cosmetics",
  description: "Ward Cosmetics Store Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PushNotificationSetup />
        {children}
      </body>
    </html>
  );
}