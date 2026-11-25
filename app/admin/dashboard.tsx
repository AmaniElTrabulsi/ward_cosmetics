"use client";

import Link from "next/link";
import AppIconBadge from "../app-icon-badge";
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
    <div className="admin-page">
      <style jsx>{`
        .admin-page{min-height:100vh;background:#f7f4ef;color:#292323}.admin-header{align-items:center}.admin-nav{display:flex;align-items:center;gap:5px;flex-wrap:wrap;padding-right:55px}.admin-nav a{text-decoration:none;color:#65444b;padding:8px 10px;border-radius:999px;font-size:12px;font-weight:750;white-space:nowrap}.admin-nav a:hover{background:#efe4dc}.admin-main{width:min(1200px,100% - 36px);margin:auto;padding:26px 0 55px}.admin-welcome{padding:22px 26px;background:#593943;color:white;border-radius:19px}.admin-welcome .eyebrow{color:#d6bdb6}.admin-welcome .section-title{color:white;font:600 clamp(25px,3vw,34px) Georgia,serif}.admin-welcome .muted{color:#e3d5d0}.period-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:14px;padding:12px 14px;background:#fffdfa;border:1px solid #e9e0d7;border-radius:15px}.period-switch{display:flex;gap:5px;background:#f5eee8;padding:4px;border-radius:11px}.period-switch button{border:0;background:transparent;padding:9px 15px;border-radius:8px;color:#795b5e;font-weight:750;cursor:pointer}.period-switch button.active{background:#593943;color:white}.period-nav{display:flex;align-items:center;gap:8px}.period-nav button{border:1px solid #e9e0d7;background:white;border-radius:9px;padding:8px 12px;color:#65444b;font-weight:800;cursor:pointer}.period-label{min-width:180px;text-align:center;font-weight:750;color:#493039;font-size:13px}.stats-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;margin-top:14px}.stat-card{padding:17px;background:#fffdfa;border:1px solid #e9e0d7;border-radius:15px;min-width:0}.stat-card strong{display:block;font:600 28px Georgia,serif;color:#593943;margin:7px 0 4px;overflow-wrap:anywhere}.stat-card small{color:#96877e;font-size:11px}.stat-card.alert{background:#fff8f2;border-color:#ead0c0}.stat-card.alert strong{color:#b55d42}.two-col{display:grid;grid-template-columns:1.1fr .9fr;gap:13px;margin-top:14px}.panel{padding:19px;background:#fffdfa;border:1px solid #e9e0d7;border-radius:17px;min-width:0}.panel-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid #f0e9e2}.panel-row:last-child{border-bottom:0}.panel-row strong{display:block;color:#49383b;font-size:13px}.panel-row small{display:block;color:#9a8d85;font-size:11px;margin-top:4px}.low{color:#b55d42;font-weight:800}.empty{padding:20px 0;color:#9a8d85;font-size:13px}.admin-links{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}.admin-link{display:block;min-width:0;padding:17px;border:1px solid #e9e0d7;border-radius:15px;background:#fffdfa;color:#493039;text-decoration:none;transition:transform .15s,box-shadow .15s}.admin-link:hover{transform:translateY(-2px);box-shadow:0 8px 22px #4c30200d}.admin-link h2{font:600 19px Georgia,serif;color:#593943;margin:0 0 7px}.admin-link p{color:#94867e;font-size:12px;line-height:1.5;margin:0}.setup-banner{display:grid;gap:5px;margin-top:12px;padding:13px 16px;border-radius:12px;background:#fff7e9;border:1px solid #ecd9b7;color:#74552d;font-size:13px}.setup-banner span{line-height:1.5}.setup-banner code{background:#f2e6d1;padding:2px 5px;border-radius:4px}
        @media(max-width:850px){.stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.admin-links{grid-template-columns:repeat(2,minmax(0,1fr))}.two-col{grid-template-columns:1fr}}
        @media(max-width:620px){.admin-header{align-items:flex-start;flex-direction:column}.admin-nav{width:100%;flex-wrap:nowrap;overflow-x:auto;padding:0 54px 5px 0}.admin-main{width:calc(100% - 24px);padding-top:17px}.period-bar{align-items:stretch}.period-switch{justify-content:space-between}.period-switch button{flex:1;padding:8px 10px}.period-nav{justify-content:space-between}.period-label{min-width:0;flex:1;font-size:12px}.admin-links{gap:8px}.admin-link{padding:13px}.admin-link h2{font-size:17px}.stat-card{padding:13px}.stat-card strong{font-size:24px}.panel{padding:15px}}
      `}</style>
      <header className="topbar admin-header">
        <div><div className="brand">WARD COSMETICS</div><div className="eyebrow">Administrator dashboard</div></div>
        <nav className="admin-nav" aria-label="Admin navigation"><Link href="/admin">Dashboard</Link><Link href="/admin/products">Products</Link><Link href="/admin/orders">Orders {data?.counts?.newOrders ? <span className="badge-count">{data.counts.newOrders}</span> : null}</Link><Link href="/admin/employees">Employees</Link><Link href="/admin/reports">Reports</Link><Link href="/app/pos">POS</Link><AppIconBadge count={data?.counts?.newOrders||0}/><button className="btn btn-light" type="button" onClick={logout}>Log out</button></nav>
      </header>
      <main className="admin-main">
        <section className="admin-welcome"><div className="eyebrow">Store control centre</div><h1 className="section-title" style={{margin:"8px 0"}}>Welcome, {user.name}</h1><p className="muted" style={{margin:0}}>Your business overview, inventory health and sales performance.</p></section>
        {data?.posSetupRequired&&<div className="setup-banner"><b>POS reporting is not connected yet.</b><span>Run <code>supabase/pos-migration.sql</code> in Supabase SQL Editor to create the POS tables and enable in-store reporting. Online orders and stock data remain available.</span></div>}
        <section className="period-bar" aria-label="Dashboard date range">
          <div className="period-switch"><button className={period==="day"?"active":""} onClick={()=>setPeriod("day")}>Day</button><button className={period==="week"?"active":""} onClick={()=>setPeriod("week")}>Week</button><button className={period==="month"?"active":""} onClick={()=>setPeriod("month")}>Month</button></div>
          <div className="period-nav"><button aria-label="Previous period" onClick={()=>move(-1)}>←</button><span className="period-label">{range.label}</span><button aria-label="Next period" onClick={()=>move(1)}>→</button><button onClick={()=>setAnchor(new Date())}>Today</button></div>
        </section>
        {error && <p className="danger small">{error}</p>}
        <section className="stats-grid" aria-label="Sales overview">
          <Stat label="Total sales" value={money(overview?.totalRevenue||0)} detail="Online + in-store POS" />
          <Stat label="Items sold" value={String(overview?.unitsSold??"—")} detail="Units across all channels" />
          <Stat label="Online orders" value={String(overview?.onlineOrders??"—")} detail="Non-cancelled orders in period" />
          <Stat label="POS transactions" value={String(overview?.posTransactions??"—")} detail="Completed in-store sales" />
          <Stat label="Online revenue" value={money(overview?.onlineRevenue||0)} detail="Customer orders" />
          <Stat label="POS revenue" value={money(overview?.posRevenue||0)} detail="Counter sales" />
          <Stat label="Low stock" value={String(overview?.lowStockCount??"—")} detail={`${overview?.outOfStockCount??0} out of stock`} alert={(overview?.lowStockCount||0)>0} />
          <Stat label="Products" value={String(data?.counts?.products??"—")} detail={`${data?.counts?.newOrders??0} new orders waiting`} />
        </section>
        <section className="two-col">
          <div className="panel"><div className="row"><h2 className="section-title" style={{margin:0}}>Products sold</h2><span className="muted small">{range.label}</span></div>
            {(data?.soldItems||[]).length ? data!.soldItems!.map(item=><div className="panel-row" key={item.name}><div><strong>{item.name}</strong><small>{item.quantity} units</small></div><strong>{money(item.revenue)}</strong></div>) : <div className="empty">No sales recorded for this period.</div>}
          </div>
          <div className="panel"><div className="row"><h2 className="section-title" style={{margin:0}}>Stock alerts</h2><Link href="/admin/products">Manage products</Link></div>
            {(data?.lowStock||[]).length ? data!.lowStock!.map(item=><div className="panel-row" key={item.id}><div><strong>{item.name}</strong><small>{item.brand||"Product"}</small></div><span className="low">{item.stock_quantity??0} left</span></div>) : <div className="empty">No low-stock products. Inventory looks healthy.</div>}
          </div>
        </section>
        <section className="two-col">
          <div className="panel"><h2 className="section-title" style={{margin:"0 0 6px"}}>Recent online orders</h2>{(data?.recentOrders||[]).length ? data!.recentOrders!.map(o=><div className="panel-row" key={o.id}><div><strong>{o.customer_name||"Customer"}</strong><small>{o.order_number||new Date(o.created_at||"").toLocaleString()} · {o.order_status||"new"}</small></div><strong>{money(Number(o.total||0))}</strong></div>) : <div className="empty">No orders in this period.</div>}</div>
          <div className="panel"><h2 className="section-title" style={{margin:"0 0 6px"}}>Recent POS sales</h2>{(data?.recentSales||[]).length ? data!.recentSales!.map(s=><div className="panel-row" key={s.id}><div><strong>{s.sale_number||"POS sale"}</strong><small>{s.cashier_name||"Staff"} · {new Date(s.created_at||"").toLocaleString()}</small></div><strong>{money(Number(s.total||0))}</strong></div>) : <div className="empty">No POS sales in this period.</div>}</div>
        </section>
        <section className="admin-links"><Quick href="/admin/products" title="Product catalogue" description="Add, edit, remove products and update stock."/><Quick href="/admin/orders" title="Order management" description="Review orders and update fulfilment and payment."/><Quick href="/admin/employees" title="Team accounts" description="Create employee accounts and manage access."/><Quick href="/admin/reports" title="Reports" description="Review store activity and sales performance."/><Quick href="/app/pos" title="Point of sale" description="Scan items and complete counter sales."/><Quick href="/app" title="Employee home" description="Open the staff workspace."/></section>
      </main>
    </div>
  );
}
function Stat({label,value,detail,alert=false}:{label:string;value:string;detail:string;alert?:boolean}){return <div className={`stat-card ${alert?"alert":""}`}><small>{label}</small><strong style={alert?{color:"#a34b36"}:undefined}>{value}</strong><small>{detail}</small></div>}
function Quick({href,title,description}:{href:string;title:string;description:string}){return <Link href={href} className="admin-link"><h2>{title}</h2><p>{description}</p></Link>}
