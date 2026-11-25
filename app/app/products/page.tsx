import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import ProductManager from "@/app/shared/product-manager";

export const dynamic = "force-dynamic";

export default async function EmployeeProductsPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  return <ProductManager />;
}
