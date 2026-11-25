
import "./globals.css";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import StaffMenu from "./staff-menu";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ward Cosmetics",
  description: "Ward Cosmetics store and staff workspace.",
  applicationName: "Ward Cosmetics",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSession();

  return (
    <html lang="en">
      <body>
        {user?.role === "admin" || user?.role === "employee" ? (
          <StaffMenu role={user.role} name={user.name} />
        ) : null}
        {children}
      </body>
    </html>
  );
}
