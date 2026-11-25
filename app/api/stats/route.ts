import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash } from "crypto";
import { getSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";

function validDate(value: string | null): boolean {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`));
}
function validInstant(value: string | null): boolean {
  return !!value && !Number.isNaN(Date.parse(value));
}

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const url = new URL(request.url);
  const requestedStart = url.searchParams.get("start");
  const requestedEnd = url.searchParams.get("end");
  const requestedFrom = url.searchParams.get("from");
  const requestedTo = url.searchParams.get("to");
  const today = new Date().toISOString().slice(0, 10);
  const isAdmin = user.role === "admin";
  // Employees are always restricted to today's dashboard data, even if they
  // manually alter the API query string. Historical ranges are admin-only.
  const start = isAdmin && validDate(requestedStart) ? requestedStart! : today;
  const end = isAdmin && validDate(requestedEnd) ? requestedEnd! : new Date(Date.parse(`${start}T00:00:00.000Z`) + 86400000).toISOString().slice(0, 10);
  if (end <= start) return NextResponse.json({ error: "Invalid date range." }, { status: 400 });

  // Only admins may request historical periods. Employee dashboards are always today.
  const rangeStart = start;
  const rangeEnd = end;
  const from = isAdmin && validInstant(requestedFrom) ? new Date(requestedFrom!).toISOString() : `${rangeStart}T00:00:00.000Z`;
  const to = isAdmin && validInstant(requestedTo) ? new Date(requestedTo!).toISOString() : `${rangeEnd}T00:00:00.000Z`;
  if (Date.parse(to) <= Date.parse(from)) return NextResponse.json({ error: "Invalid date range." }, { status: 400 });

  const jar = await cookies();
  const sessionToken = jar.get("ward_session")?.value;
  if (!sessionToken) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const tokenHash = createHash("sha256").update(sessionToken).digest("hex");
  const [productsResult, ordersResult, posResult, productCountResult, orderCountResult] = await Promise.all([
    supabase.from("products").select("id,name,brand,stock_quantity,price").order("stock_quantity", { ascending: true }),
    supabase.from("orders").select("id,order_number,customer_name,total,order_status,payment_status,created_at,order_items(product_name,quantity,total)").gte("created_at", from).lt("created_at", to).neq("order_status", "cancelled").order("created_at", { ascending: false }),
    supabase.rpc("ward_pos_dashboard", { p_token_hash: tokenHash, p_from: from, p_to: to }),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
  ]);

  // Keep the dashboard usable before the POS migration is installed.
  const posSchemaMissing = !!posResult.error && (/ward_pos_dashboard|pos_sales|pos_sale_items/i.test(posResult.error.message) || posResult.error.code === "PGRST202" || posResult.error.code === "PGRST205");
  const error = productsResult.error || ordersResult.error || productCountResult.error || orderCountResult.error || (posSchemaMissing ? null : posResult.error);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const products = productsResult.data || [];
  const orders = ordersResult.data || [];
  const posPayload = posSchemaMissing ? null : (posResult.data as { sales?: Array<{ id:string; sale_number?:string; total?:number; payment_method?:string; cashier_name?:string; created_at?:string; pos_sale_items?:Array<{product_name?:string;quantity?:number;line_total?:number}> }>; count?:number } | null);
  const posSales = posPayload?.sales || [];
  const lowStock = products.filter((p) => p.stock_quantity !== null && Number(p.stock_quantity) <= 5);
  const outOfStock = products.filter((p) => p.stock_quantity !== null && Number(p.stock_quantity) <= 0);

  const onlineRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const posRevenue = posSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const soldItems: Record<string, { name: string; quantity: number; revenue: number }> = {};
  for (const order of orders) {
    for (const item of (order.order_items || []) as Array<{ product_name?: string; quantity?: number; total?: number }>) {
      const name = item.product_name || "Product";
      soldItems[name] ||= { name, quantity: 0, revenue: 0 };
      soldItems[name].quantity += Number(item.quantity || 0);
      soldItems[name].revenue += Number(item.total || 0);
    }
  }
  for (const sale of posSales) {
    for (const item of (sale.pos_sale_items || []) as Array<{ product_name?: string; quantity?: number; line_total?: number }>) {
      const name = item.product_name || "Product";
      soldItems[name] ||= { name, quantity: 0, revenue: 0 };
      soldItems[name].quantity += Number(item.quantity || 0);
      soldItems[name].revenue += Number(item.line_total || 0);
    }
  }

  return NextResponse.json({
    period: { start: rangeStart, end: rangeEnd },
    counts: {
      products: productCountResult.count || 0,
      orders: orderCountResult.count || 0,
      sales: posSchemaMissing ? 0 : (posPayload?.count || 0),
      newOrders: orders.filter((order) => order.order_status === "new").length,
    },
    posSetupRequired: posSchemaMissing,
    overview: {
      onlineRevenue,
      posRevenue,
      totalRevenue: onlineRevenue + posRevenue,
      onlineOrders: orders.length,
      posTransactions: posSales.length,
      unitsSold: Object.values(soldItems).reduce((sum, item) => sum + item.quantity, 0),
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
    },
    soldItems: Object.values(soldItems).sort((a, b) => b.quantity - a.quantity).slice(0, 10),
    lowStock: lowStock.slice(0, 12),
    recentOrders: orders.slice(0, 6),
    recentSales: posSales.slice(0, 6),
  });
}
