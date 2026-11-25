"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

type Product = { id: string; brand: string; name: string; price: number; stock_quantity: number | null; barcode: string | null; image_url: string | null };
type CartLine = { product: Product; quantity: number };

const money = (amount: number) => `$${amount.toFixed(2)}`;

export default function PosClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [query, setQuery] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<{ sale_number: string; total: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadProducts = useCallback(async () => {
    const response = await fetch("/api/products", { cache: "no-store" });
    const data = await response.json();
    if (response.ok) setProducts(data.products || []);
    else setMessage(data.error || "Could not load products.");
  }, []);

  useEffect(() => { void loadProducts(); }, [loadProducts]);

  useEffect(() => {
    if (!scannerOpen) return;
    let active = true;
    let stop: (() => void) | undefined;
    const reader = new BrowserMultiFormatReader();
    async function start() {
      try {
        if (!videoRef.current) return;
        const controls = await reader.decodeFromConstraints({ audio: false, video: { facingMode: { ideal: "environment" } } }, videoRef.current, (result) => {
          if (!active || !result) return;
          addByBarcode(result.getText());
          setScannerOpen(false);
        });
        if (!active) controls.stop(); else stop = () => controls.stop();
      } catch (error) {
        if (active) { setMessage(error instanceof Error ? error.message : "Could not start camera scanner."); setScannerOpen(false); }
      }
    }
    void start();
    return () => { active = false; stop?.(); };
  // addByBarcode is stable via products/cart updater; scanner is deliberately restarted only when opened.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => `${p.name} ${p.brand} ${p.barcode || ""}`.toLowerCase().includes(q));
  }, [products, query]);
  const lines = Object.values(cart);
  const total = lines.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  function addProduct(product: Product) {
    if (product.stock_quantity !== null && product.stock_quantity <= 0) { setMessage(`${product.name} is out of stock.`); return; }
    setCart((current) => {
      const existing = current[product.id]?.quantity || 0;
      if (product.stock_quantity !== null && existing >= product.stock_quantity) { setMessage(`Only ${product.stock_quantity} available for ${product.name}.`); return current; }
      return { ...current, [product.id]: { product, quantity: existing + 1 } };
    });
    setMessage("");
  }

  function addByBarcode(raw: string) {
    const code = raw.trim();
    if (!code) return;
    const product = products.find((p) => String(p.barcode || "").trim() === code);
    if (!product) { setMessage(`No product found for barcode ${code}.`); setQuery(code); return; }
    addProduct(product);
    setQuery("");
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }

  function changeQuantity(id: string, next: number) {
    setCart((current) => {
      const line = current[id];
      if (!line) return current;
      if (next <= 0) { const copy = { ...current }; delete copy[id]; return copy; }
      if (line.product.stock_quantity !== null && next > line.product.stock_quantity) { setMessage(`Only ${line.product.stock_quantity} available.`); return current; }
      return { ...current, [id]: { ...line, quantity: next } };
    });
  }

  async function completeSale() {
    if (!lines.length || busy) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/pos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_method: paymentMethod, items: lines.map((line) => ({ product_id: line.product.id, quantity: line.quantity })) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not complete sale.");
      setLastReceipt({ sale_number: data.sale_number, total: Number(data.total) });
      setCart({});
      setQuery("");
      await loadProducts();
      setMessage("Sale completed and inventory updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not complete sale.");
    } finally { setBusy(false); }
  }

  return (
    <div className="pos-page">
      <style jsx>{`
        .pos-page { min-height:100vh; background:var(--cream); }
        .pos-main { width:min(1280px,100% - 36px); margin:auto; padding:26px 0 60px; }
        .pos-layout { display:grid; grid-template-columns:minmax(0,1.55fr) minmax(320px,.85fr); gap:18px; align-items:start; }
        .catalog-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-top:14px; }
        .catalog-item { min-width:0; padding:14px; border:1px solid var(--line); border-radius:16px; background:white; display:flex; flex-direction:column; gap:8px; }
        .catalog-item img { width:100%; aspect-ratio:1/1; object-fit:contain; border-radius:11px; background:#f6f1e9; }
        .catalog-item strong { overflow-wrap:anywhere; }
        .stock-note { color:var(--muted); font-size:11px; }
        .cart-panel { position:sticky; top:90px; }
        .cart-line { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:8px; padding:12px 0; border-bottom:1px solid var(--line); }
        .qty { display:flex; align-items:center; gap:8px; }
        .qty button { width:32px; height:32px; border:1px solid var(--line); border-radius:50%; background:white; color:var(--wine); font-weight:800; }
        .total-row { display:flex; align-items:center; justify-content:space-between; padding-top:15px; margin-top:10px; border-top:1px solid var(--line); }
        .scanner-box { margin-top:14px; }
        @media(max-width:850px) { .pos-layout { grid-template-columns:1fr; } .cart-panel { position:static; } .catalog-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
        @media(max-width:600px) { .pos-header { align-items:flex-start !important; flex-direction:column; } .pos-header nav { width:100%; overflow-x:auto; flex-wrap:nowrap; } .pos-header nav a { white-space:nowrap; } .pos-main { width:calc(100% - 22px); padding-top:16px; } .catalog-grid { gap:9px; } .catalog-item { padding:10px; } .catalog-item .btn { width:100%; padding:10px 8px; } .cart-panel { padding:14px; } }
      `}</style>
      <header className="topbar pos-header">
        <Link href="/app" className="brand" style={{ textDecoration: "none" }}>WARD COSMETICS <span className="pill">POS</span></Link>
        <nav className="navlinks"><Link href="/app">Dashboard</Link><Link href="/app/products">Products</Link><Link href="/app/orders">Orders</Link></nav>
      </header>
      <main className="pos-main">
        <div className="eyebrow">In-store checkout</div>
        <h1 className="section-title">Point of sale</h1>
        <div className="pos-layout">
          <section>
            <div className="panel">
              <div className="row" style={{ flexWrap: "wrap" }}><div><h2 className="section-title" style={{ margin: 0 }}>Scan or find a product</h2><p className="muted small" style={{ marginBottom: 0 }}>Use the camera, a USB/Bluetooth scanner, or search by name.</p></div><button className="btn" type="button" onClick={() => { setMessage(""); setScannerOpen((v) => !v); }}>{scannerOpen ? "Stop camera" : "Scan with camera"}</button></div>
              <div className="row" style={{ marginTop: 14 }}><input ref={inputRef} className="field" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addByBarcode(query); } }} placeholder="Scan barcode or search products…" autoComplete="off" /><button className="btn btn-light" type="button" onClick={() => setQuery("")}>Clear</button></div>
              {scannerOpen && <div className="scanner-box"><video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", maxHeight: 300, objectFit: "cover", background: "#171717", borderRadius: 14 }} /><p className="muted small">Point the rear camera at the product barcode. It will be added automatically.</p></div>}
            </div>
            <div className="catalog-grid">
              {filtered.map((product) => <article className="catalog-item" key={product.id}>
                <img src={product.image_url || "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600"} alt={product.name} loading="lazy" />
                <div className="eyebrow">{product.brand}</div><strong>{product.name}</strong>
                <div className="row"><span className="price">{money(Number(product.price))}</span><span className="stock-note">{product.stock_quantity === null ? "Stock n/a" : `${product.stock_quantity} left`}</span></div>
                <button className="btn" type="button" disabled={product.stock_quantity !== null && product.stock_quantity <= 0} onClick={() => addProduct(product)}>Add to sale</button>
              </article>)}
              {filtered.length === 0 && <div className="panel" style={{ gridColumn: "1 / -1" }}><p className="muted">No matching products.</p></div>}
            </div>
          </section>
          <aside className="panel cart-panel">
            <div className="row"><h2 className="section-title" style={{ margin: 0 }}>Current sale</h2><span className="pill">{itemCount} items</span></div>
            {lastReceipt && <div className="toast" style={{ marginTop: 14 }}><strong>Sale completed: {lastReceipt.sale_number}</strong><div>Total {money(lastReceipt.total)}</div></div>}
            {lines.length === 0 ? <p className="muted small" style={{ padding: "24px 0" }}>Scan or add products to start a sale.</p> : lines.map((line) => <div className="cart-line" key={line.product.id}>
              <div><strong>{line.product.name}</strong><div className="muted small">{money(Number(line.product.price))} each</div><div className="qty" style={{ marginTop: 8 }}><button type="button" aria-label="Decrease quantity" onClick={() => changeQuantity(line.product.id, line.quantity - 1)}>−</button><strong>{line.quantity}</strong><button type="button" aria-label="Increase quantity" onClick={() => changeQuantity(line.product.id, line.quantity + 1)}>+</button></div></div>
              <strong>{money(Number(line.product.price) * line.quantity)}</strong>
            </div>)}
            <label className="label" style={{ marginTop: 18 }}>Payment method<select className="field" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}><option value="cash">Cash</option><option value="card">Card</option><option value="whish">Whish</option><option value="other">Other</option></select></label>
            <div className="total-row"><span>Total</span><strong className="price" style={{ fontSize: 25 }}>{money(total)}</strong></div>
            <button className="btn" style={{ width: "100%", marginTop: 16, minHeight: 48 }} disabled={!lines.length || busy} onClick={completeSale}>{busy ? "Completing sale…" : "Complete sale"}</button>
            <button className="btn btn-light" style={{ width: "100%", marginTop: 8 }} type="button" disabled={!lines.length || busy} onClick={() => setCart({})}>Clear sale</button>
            {message && <p className="small" role="status" style={{ marginTop: 12 }}>{message}</p>}
          </aside>
        </div>
      </main>
    </div>
  );
}
