import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import OrdersManager from "@/app/shared/orders-manager";

export const dynamic = "force-dynamic";

export default async function EmployeeOrdersPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  return <OrdersManager />;
}
