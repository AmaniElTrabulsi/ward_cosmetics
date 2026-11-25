import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import ProductManager from "@/app/shared/product-manager";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/app");
  return <ProductManager />;
}
