"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Props = { role: "admin" | "employee"; name: string };

export default function StaffMenu({ role, name }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  const admin = role === "admin";
  const links = admin
    ? [["Dashboard", "/admin"], ["Products", "/admin/products"], ["Orders", "/admin/orders"], ["Employees", "/admin/employees"], ["Reports", "/admin/reports"], ["Point of sale", "/app/pos"], ["Online shop", "/shop"]]
    : [["Home", "/app"], ["Products", "/app/products"], ["Orders", "/app/orders"], ["Point of sale", "/app/pos"], ["Online shop", "/shop"]];
  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }
  return <>
    <button className="ward-menu-trigger" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)}><span></span><span></span><span></span></button>
    {open && <div className="ward-menu-backdrop" onClick={() => setOpen(false)}>
      <aside className="ward-menu-panel" onClick={(e) => e.stopPropagation()}>
        <div className="ward-menu-head"><div><b>WARD COSMETICS</b><small>{admin ? "ADMINISTRATION" : "STAFF WORKSPACE"} · {name}</small></div><button aria-label="Close menu" onClick={() => setOpen(false)}>×</button></div>
        <nav>{links.map(([label, href]) => <Link key={href} href={href} className={pathname === href ? "selected" : ""}>{label}<span>›</span></Link>)}</nav>
        <button className="ward-menu-logout" onClick={logout}>Log out</button>
      </aside>
    </div>}
    <style jsx global>{`
      .ward-menu-trigger{position:fixed;z-index:80;top:82px;right:14px;width:46px;height:46px;border:1px solid #e7dcd0;border-radius:15px;background:#fffdf9;box-shadow:0 5px 20px #24140d18;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:5px;cursor:pointer}
      .ward-menu-trigger span{width:19px;height:2px;border-radius:3px;background:#633a43}
      .ward-menu-backdrop{position:fixed;inset:0;z-index:100;background:#17100d75;backdrop-filter:blur(3px);display:flex;justify-content:flex-end}
      .ward-menu-panel{width:min(340px,88vw);height:100%;background:#fffdf9;padding:24px 20px;box-shadow:-15px 0 45px #0002;display:flex;flex-direction:column;gap:24px}
      .ward-menu-head{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:18px;border-bottom:1px solid #eadfd4;color:#633a43;letter-spacing:.08em;font-size:13px}
      .ward-menu-head small{display:block;color:#9a8179;font-size:10px;letter-spacing:.12em;margin-top:7px}
      .ward-menu-head button{border:0;background:#f4ece4;border-radius:10px;width:34px;height:34px;font-size:23px;color:#633a43;cursor:pointer}
      .ward-menu-panel nav{display:grid;gap:6px}.ward-menu-panel nav a{display:flex;justify-content:space-between;align-items:center;text-decoration:none;color:#35292a;padding:14px 13px;border-radius:12px;font-size:15px;font-weight:650}.ward-menu-panel nav a.selected,.ward-menu-panel nav a:hover{background:#f4eae0;color:#633a43}.ward-menu-panel nav a span{font-size:22px;color:#b18c83}
      .ward-menu-logout{margin-top:auto;padding:14px;border:1px solid #eadfd4;background:white;border-radius:12px;color:#633a43;font-weight:700;cursor:pointer}
      @media(min-width:900px){.ward-menu-trigger{top:82px;right:22px}}
    `}</style>
  </>;
}
