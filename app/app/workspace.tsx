"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type User = { name: string; role: string };
type Stats = { overview?: { totalRevenue?: number; unitsSold?: number; lowStockCount?: number }; counts?: { newOrders?: number } };
const money = (v: number) => `$${Number(v || 0).toFixed(2)}`;

export default function Workspace({ user }: { user: User }) {
  const [stats, setStats] = useState<Stats>({});
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start); end.setDate(end.getDate() + 1);
      const date = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      const r = await fetch(`/api/stats?start=${date(start)}&end=${date(end)}&from=${encodeURIComponent(start.toISOString())}&to=${encodeURIComponent(end.toISOString())}`, { cache: "no-store" });
      const j = await r.json(); if (!r.ok) throw new Error(j.error || "Could not load store information.");
      setStats(j); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not connect to the store."); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const o = stats.overview;
  return <main className="simple-home">
    <style jsx>{`
      .simple-home{min-height:100vh;background:#f4f6f8;color:#17212b;padding:26px max(16px,calc((100vw - 1180px)/2)) 60px;font-family:Arial,sans-serif}
      .head{display:flex;justify-content:space-between;align-items:center;gap:15px;margin-bottom:26px}.brand{font-size:20px;font-weight:900;letter-spacing:-.5px;color:#183b53}.brand span{color:#e65b76}.hello{font-size:14px;color:#647382;margin-top:7px}.head-right{display:flex;gap:9px;align-items:center}.head-right a,.head-right button{border:1px solid #dce4e9;border-radius:11px;background:#fff;color:#27485f;padding:11px 14px;text-decoration:none;font-weight:800;font-size:13px}.welcome{background:#173e5a;color:#fff;border-radius:20px;padding:27px 30px;margin-bottom:20px}.welcome h1{font-size:30px;letter-spacing:-1px;margin:0 0 7px}.welcome p{color:#d7e4ec;margin:0;font-size:15px}.numbers{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}.number{background:#fff;border:1px solid #e1e7ec;border-radius:15px;padding:17px 19px}.number span{font-size:12px;color:#71808d;font-weight:800}.number strong{display:block;font-size:27px;color:#183b53;margin-top:8px}.actions-title{font-size:20px;margin:28px 0 13px;letter-spacing:-.4px}.actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.action{min-height:140px;display:flex;align-items:center;gap:18px;background:#fff;border:1px solid #dfe6eb;border-radius:17px;padding:23px;text-decoration:none;color:#17212b;box-shadow:0 3px 10px #1a2a3808}.action.primary{background:#e8f2f7;border-color:#cbdde8}.action-icon{width:62px;height:62px;border-radius:16px;display:grid;place-items:center;background:#edf2f5;color:#173e5a;font-size:30px;flex:none}.primary .action-icon{background:#173e5a;color:#fff}.action-copy{flex:1}.action-copy b{display:block;font-size:19px;margin-bottom:6px}.action-copy small{display:block;color:#687885;font-size:13px;line-height:1.4}.arrow{font-size:23px;color:#82909a}.help{margin-top:20px;background:#fff;border:1px solid #e1e7ec;border-radius:14px;padding:17px 19px;color:#657480;font-size:13px;line-height:1.5}.help b{color:#27485f}.error{background:#fff1ee;color:#9d3d31;padding:12px;border-radius:10px;margin-bottom:15px;font-size:13px}
      @media(max-width:650px){.simple-home{padding:16px 12px 35px}.head{align-items:flex-start}.brand{font-size:17px}.head-right a{padding:9px;font-size:12px}.welcome{padding:21px 18px}.welcome h1{font-size:25px}.numbers{gap:8px}.number{padding:13px 10px}.number span{font-size:10px}.number strong{font-size:21px}.actions{grid-template-columns:1fr;gap:10px}.action{min-height:105px;padding:15px;gap:13px}.action-icon{width:52px;height:52px;font-size:25px}.action-copy b{font-size:17px}.actions-title{margin-top:23px}}
    `}</style>
    <header className="head"><div><div className="brand">WARD <span>COSMETICS</span></div><div className="hello">Hello, {user.name}. What would you like to do?</div></div><div className="head-right"><Link href="/shop" target="_blank">Open shop ↗</Link><button onClick={() => void load()}>↻ Refresh</button><button onClick={async () => { await fetch("/api/logout", { method: "POST" }); window.location.href = "/login"; }}>Log out</button></div></header>
    {error && <div className="error">{error}</div>}
    <section className="welcome"><h1>Welcome to your store</h1><p>Choose what you want to do. Everything is right here.</p></section>
    <section className="numbers"><div className="number"><span>SALES TODAY</span><strong>{money(o?.totalRevenue || 0)}</strong></div><div className="number"><span>ITEMS SOLD TODAY</span><strong>{o?.unitsSold ?? "—"}</strong></div><div className="number"><span>NEW ORDERS</span><strong>{stats.counts?.newOrders ?? "—"}</strong></div></section>
    <h2 className="actions-title">What do you need?</h2>
    <section className="actions">
      <Link href="/app/pos" className="action primary"><span className="action-icon">＋</span><span className="action-copy"><b>Make a sale</b><small>Sell products to a customer in the shop</small></span><span className="arrow">›</span></Link>
      <Link href="/app/orders" className="action"><span className="action-icon">▤</span><span className="action-copy"><b>Customer orders</b><small>See orders and prepare them for delivery</small></span><span className="arrow">›</span></Link>
      <Link href="/app/products" className="action"><span className="action-icon">▦</span><span className="action-copy"><b>Products and stock</b><small>Add products, change prices, and update stock</small></span><span className="arrow">›</span></Link>
      {user.role === "admin" && <Link href="/admin" className="action"><span className="action-icon">⚙</span><span className="action-copy"><b>Store management</b><small>Employees, reports, and store settings</small></span><span className="arrow">›</span></Link>}
    </section>
    <div className="help"><b>Need help?</b> Start with the large buttons above. To sell something, choose <b>Make a sale</b>, tap the products, and press <b>Complete sale</b>.</div>
  </main>;
}
