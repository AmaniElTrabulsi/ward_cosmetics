"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Admin = { name: string };
type Period = "day" | "week" | "month";
type Data = {
  counts?: { products: number; orders: number; sales: number; newOrders: number };
  overview?: { onlineRevenue: number; posRevenue: number; totalRevenue: number; onlineOrders: number; posTransactions: number; unitsSold: number; lowStockCount: number; outOfStockCount: number };
  soldItems?: Array<{ name: string; quantity: number; revenue: number }>;
  lowStock?: Array<{ id: string; name: string; brand?: string; stock_quantity: number | null }>;
  recentOrders?: Array<{ id: string; order_number?: string; customer_name?: string; total?: number; order_status?: string; created_at?: string }>;
  recentSales?: Array<{ id: string; sale_number?: string; total?: number; cashier_name?: string; created_at?: string }>;
  posSetupRequired?: boolean;
};
const money = (value: number) => `$${Number(value || 0).toFixed(2)}`;
const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const localMidnightIso = (key: string) => { const [year,month,day]=key.split("-").map(Number); return new Date(year,month-1,day).toISOString(); };
function rangeFor(anchor: Date, period: Period) {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  if (period === "week") start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  if (period === "month") start.setDate(1);
  const end = new Date(start);
  if (period === "day") end.setDate(end.getDate()+1);
  if (period === "week") end.setDate(end.getDate()+7);
  if (period === "month") end.setMonth(end.getMonth()+1);
  return { start: dateKey(start), end: dateKey(end), label: period === "day" ? start.toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long",year:"numeric"}) : period === "week" ? `${start.toLocaleDateString(undefined,{day:"numeric",month:"short"})} – ${new Date(end.getTime()-86400000).toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"})}` : start.toLocaleDateString(undefined,{month:"long",year:"numeric"}) };
}

export default function AdminDashboard({ user }: { user: Admin }) {
  const [period, setPeriod] = useState<Period>("day");
  const [anchor, setAnchor] = useState(() => new Date());
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const range = useMemo(() => rangeFor(anchor, period), [anchor, period]);
  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/stats?start=${range.start}&end=${range.end}&from=${encodeURIComponent(localMidnightIso(range.start))}&to=${encodeURIComponent(localMidnightIso(range.end))}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load dashboard.");
      setData(result); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not connect to the store database."); }
  }, [range.start, range.end]);
  useEffect(() => { void load(); const timer=window.setInterval(()=>void load(),20000); return ()=>window.clearInterval(timer); },[load]);

  function move(direction: -1 | 1) {
    setAnchor(current => {
      const next = new Date(current);
      if (period === "day") next.setDate(next.getDate()+direction);
      if (period === "week") next.setDate(next.getDate()+direction*7);
      if (period === "month") next.setMonth(next.getMonth()+direction);
      return next;
    });
  }
  async function logout(){await fetch("/api/logout",{method:"POST"});window.location.href="/login";}
  const overview = data?.overview;
  return (
    <main className="admin-simple">
      <style jsx>{`
        .admin-simple{min-height:100vh;background:#f4f6f8;color:#17212b;padding:24px max(15px,calc((100vw - 1180px)/2)) 55px;font-family:Arial,sans-serif}.admin-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:23px}.brand{font-size:20px;font-weight:900;color:#183b53}.brand span{color:#e65b76}.top-actions{display:flex;gap:8px;flex-wrap:wrap}.top-actions a,.top-actions button{border:1px solid #dce4e9;background:#fff;color:#27485f;text-decoration:none;border-radius:10px;padding:10px 13px;font-size:13px;font-weight:800}.admin-welcome{background:#173e5a;color:#fff;border-radius:18px;padding:25px 27px}.admin-welcome h1{font-size:29px;margin:0 0 7px;letter-spacing:-.8px}.admin-welcome p{color:#d8e5ed;margin:0}.date-tools{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;background:#fff;border:1px solid #e1e7ec;border-radius:13px;padding:12px 14px;margin:13px 0}.period-switch{display:flex;gap:5px}.period-switch button,.date-move button{border:1px solid #dce4e9;background:#f7f9fa;color:#27485f;border-radius:9px;padding:9px 13px;font-weight:800}.period-switch button.active{background:#173e5a;color:#fff;border-color:#173e5a}.date-move{display:flex;align-items:center;gap:8px}.date-move span{font-weight:800;font-size:13px;min-width:170px;text-align:center}.admin-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:14px 0 21px}.stat{background:#fff;border:1px solid #e1e7ec;border-radius:14px;padding:17px}.stat small{font-size:12px;color:#71808d;font-weight:800}.stat strong{display:block;font-size:27px;color:#183b53;margin-top:7px}.admin-title{font-size:20px;margin:25px 0 12px}.admin-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.admin-action{display:flex;align-items:center;gap:15px;background:#fff;border:1px solid #dfe6eb;border-radius:15px;padding:19px;text-decoration:none;color:#17212b;min-height:100px}.admin-action:hover{border-color:#9db8c9;background:#fbfdfe}.action-icon{width:50px;height:50px;border-radius:13px;background:#eaf1f6;color:#173e5a;display:grid;place-items:center;font-size:24px;flex:none}.action-copy{flex:1}.action-copy b{display:block;font-size:17px;margin-bottom:5px}.action-copy small{display:block;color:#71808d;font-size:12px;line-height:1.4}.chev{font-size:23px;color:#81909b}.alert{background:#fff2ed;border:1px solid #f0d4c9;color:#914d39;border-radius:11px;padding:12px;margin-top:12px;font-size:13px}.error{background:#fff1ee;color:#9d3d31;padding:12px;border-radius:10px;margin:12px 0;font-size:13px}
        @media(max-width:620px){.admin-simple{padding:15px 11px 35px}.admin-top{align-items:flex-start;flex-direction:column}.brand{font-size:18px}.top-actions{display:grid;grid-template-columns:repeat(3,1fr);width:100%}.top-actions a,.top-actions button{text-align:center;padding:10px 5px;font-size:12px}.admin-welcome{padding:20px 17px}.admin-welcome h1{font-size:24px}.admin-stats{gap:7px}.stat{padding:12px 9px}.stat small{font-size:10px}.stat strong{font-size:20px}.admin-actions{grid-template-columns:1fr;gap:9px}.admin-action{min-height:88px;padding:13px}.action-icon{width:44px;height:44px}.date-tools{align-items:stretch}.period-switch{width:100%}.period-switch button{flex:1;padding:8px 4px}.date-move{justify-content:space-between}.date-move span{min-width:0;flex:1;font-size:11px}}
      `}</style>
      <header className="admin-top"><div><div className="brand">WARD <span>COSMETICS</span></div><small style={{color:"#71808d"}}>Store owner area</small></div><nav className="top-actions"><Link href="/admin/products">Products</Link><Link href="/admin/orders">Orders</Link><Link href="/admin/employees">Employees</Link><Link href="/admin/reports">Reports</Link><Link href="/app/pos">POS</Link><button onClick={async()=>{await fetch("/api/logout",{method:"POST"});window.location.href="/login";}}>Log out</button></nav></header>
      <section className="admin-welcome"><h1>Hello, {user.name}</h1><p>Here is your store at a glance. Choose a task below to get started.</p></section>
      {data?.posSetupRequired&&<div className="alert">POS reporting needs setup. Run <b>supabase/pos-migration.sql</b> in the Supabase SQL Editor.</div>}
      <section className="date-tools"><div className="period-switch"><button className={period==="day"?"active":""} onClick={()=>setPeriod("day")}>Today</button><button className={period==="week"?"active":""} onClick={()=>setPeriod("week")}>This week</button><button className={period==="month"?"active":""} onClick={()=>setPeriod("month")}>This month</button></div><div className="date-move"><button aria-label="Previous period" onClick={()=>move(-1)}>←</button><span>{range.label}</span><button aria-label="Next period" onClick={()=>move(1)}>→</button><button onClick={()=>setAnchor(new Date())}>Now</button></div></section>
      {error&&<div className="error">{error}</div>}
      <section className="admin-stats"><div className="stat"><small>TOTAL SALES</small><strong>{money(overview?.totalRevenue||0)}</strong></div><div className="stat"><small>ITEMS SOLD</small><strong>{overview?.unitsSold??"—"}</strong></div><div className="stat"><small>NEW ORDERS</small><strong>{data?.counts?.newOrders??"—"}</strong></div></section>
      <h2 className="admin-title">What would you like to manage?</h2>
      <section className="admin-actions">
        <Link href="/admin/products" className="admin-action"><span className="action-icon">▦</span><span className="action-copy"><b>Products and stock</b><small>Add products, change prices, upload photos, and update quantities.</small></span><span className="chev">›</span></Link>
        <Link href="/admin/orders" className="admin-action"><span className="action-icon">▤</span><span className="action-copy"><b>Customer orders</b><small>Review new orders and update their status.</small></span><span className="chev">›</span></Link>
        <Link href="/admin/employees" className="admin-action"><span className="action-icon">♙</span><span className="action-copy"><b>Employees</b><small>Add staff members and manage their access.</small></span><span className="chev">›</span></Link>
        <Link href="/admin/reports" className="admin-action"><span className="action-icon">▥</span><span className="action-copy"><b>Sales reports</b><small>See sales, best sellers, and store performance.</small></span><span className="chev">›</span></Link>
        <Link href="/app/pos" className="admin-action"><span className="action-icon">＋</span><span className="action-copy"><b>Make an in-store sale</b><small>Open the simple checkout screen.</small></span><span className="chev">›</span></Link>
        <Link href="/shop" target="_blank" className="admin-action"><span className="action-icon">♡</span><span className="action-copy"><b>Open online shop</b><small>See what customers see when they shop.</small></span><span className="chev">›</span></Link>
      </section>
    </main>
  );
}
