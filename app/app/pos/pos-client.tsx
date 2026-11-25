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
    <div className="easy-pos">
      <style jsx>{`
        .easy-pos{min-height:100vh;background:#f4f6f8;color:#17212b;font-family:Arial,sans-serif}
        .easy-top{height:72px;background:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 28px;border-bottom:1px solid #e3e8ed;position:sticky;top:0;z-index:20}
        .easy-brand{font-size:21px;font-weight:900;letter-spacing:-.7px;color:#162b3b;text-decoration:none}.easy-brand span{color:#e65b76}
        .easy-nav{display:flex;gap:8px}.easy-nav a{color:#43515e;text-decoration:none;padding:12px 16px;border-radius:10px;font-weight:700;font-size:14px}.easy-nav a.active{background:#eaf1f7;color:#173e5a}
        .easy-main{max-width:1500px;margin:auto;padding:26px 28px 50px}.easy-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:20px}.easy-heading h1{font-size:30px;letter-spacing:-1px;margin:0 0 5px}.easy-heading p{margin:0;color:#647382;font-size:14px}.step-pill{background:#e7f4ed;color:#22734c;border-radius:30px;padding:10px 15px;font-weight:800;font-size:13px}
        .easy-layout{display:grid;grid-template-columns:minmax(0,1fr) 390px;gap:20px;align-items:start}.catalog-area{min-width:0}.search-wrap{display:flex;gap:10px;margin-bottom:16px}.search-wrap input{height:58px;border:2px solid #dce3e9;border-radius:13px;padding:0 18px;background:#fff;font-size:17px;min-width:0;flex:1;outline:none}.search-wrap input:focus{border-color:#2b789f}.scan-btn{border:0;border-radius:13px;background:#173e5a;color:white;padding:0 18px;font-weight:800;font-size:14px;min-height:58px}.scanner-area{background:#13212b;border-radius:14px;padding:12px;margin-bottom:14px}.scanner-area video{width:100%;max-height:230px;object-fit:cover;border-radius:9px}.scanner-area p{color:#fff;font-size:13px;margin:8px 2px 0}
        .catalog-head{display:flex;align-items:center;justify-content:space-between;margin:20px 0 12px}.catalog-head h2{font-size:19px;margin:0}.catalog-head span{font-size:13px;color:#71808d}.easy-products{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px}.easy-product{background:#fff;border:1px solid #e1e7ec;border-radius:15px;padding:12px;display:flex;flex-direction:column;gap:8px;min-width:0;box-shadow:0 2px 7px #1a2a3810}.easy-product img{width:100%;aspect-ratio:1/1;object-fit:contain;background:#f5f7f8;border-radius:10px}.easy-product .brand{font-size:11px;color:#87939d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.easy-product strong{font-size:14px;line-height:1.3;min-height:36px;overflow-wrap:anywhere}.easy-product .price-row{display:flex;justify-content:space-between;gap:6px;align-items:center}.easy-product .price{font-size:18px;color:#173e5a;font-weight:900}.easy-product .stock{font-size:11px;color:#7a8791}.add-btn{border:0;background:#e8f1f6;color:#174764;border-radius:10px;min-height:42px;font-weight:900;font-size:14px}.add-btn:disabled{opacity:.45}
        .basket{background:#fff;border:1px solid #dfe6eb;border-radius:17px;position:sticky;top:88px;overflow:hidden;box-shadow:0 5px 20px #1a2a3810}.basket-top{padding:19px 20px;background:#173e5a;color:white;display:flex;justify-content:space-between;align-items:center}.basket-top h2{font-size:20px;margin:0}.basket-count{background:#fff;color:#173e5a;border-radius:30px;min-width:30px;height:30px;display:grid;place-items:center;font-weight:900;padding:0 7px}.basket-content{padding:17px 19px}.basket-empty{text-align:center;padding:32px 10px;color:#7a8791}.basket-empty b{display:block;color:#334553;font-size:16px;margin-bottom:6px}.basket-empty span{font-size:13px}.basket-line{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;padding:12px 0;border-bottom:1px solid #edf0f2}.basket-line b{font-size:14px;display:block;line-height:1.3}.basket-line small{display:block;color:#7c8993;margin-top:4px}.basket-line-total{font-weight:900;color:#203b50}.quantity{display:flex;align-items:center;gap:10px;margin-top:9px}.quantity button{width:34px;height:34px;border:1px solid #dce3e9;background:#f7f9fa;border-radius:9px;font-size:19px;font-weight:900;color:#173e5a}.quantity span{font-weight:900;min-width:14px;text-align:center}.basket-bottom{padding:17px 19px 20px;background:#f7f9fa;border-top:1px solid #e5eaee}.basket-bottom label{display:block;font-size:12px;font-weight:800;color:#53616d;margin-bottom:7px}.basket-bottom select{width:100%;height:46px;border:1px solid #dce3e9;border-radius:10px;background:white;padding:0 12px;font-size:15px}.grand-total{display:flex;align-items:center;justify-content:space-between;margin:18px 0}.grand-total span{font-size:15px;color:#566674;font-weight:700}.grand-total strong{font-size:30px;color:#173e5a}.pay-btn{width:100%;min-height:58px;border:0;border-radius:12px;background:#16834d;color:white;font-size:17px;font-weight:900}.pay-btn:disabled{opacity:.45}.clear-btn{width:100%;min-height:42px;border:0;background:transparent;color:#8b4d55;font-weight:800;margin-top:5px}.status{margin:12px 0 0;padding:11px;border-radius:9px;background:#fff3e8;color:#8c4b20;font-size:13px}.receipt{padding:12px;border-radius:10px;background:#e8f5ed;color:#216b43;font-size:13px;margin-bottom:10px}.receipt b{display:block;margin-bottom:4px}
        @media(max-width:1100px){.easy-layout{grid-template-columns:minmax(0,1fr) 340px}.easy-products{grid-template-columns:repeat(3,minmax(0,1fr))}}
        @media(max-width:820px){.easy-layout{grid-template-columns:1fr}.basket{position:static}.easy-products{grid-template-columns:repeat(3,minmax(0,1fr))}.easy-main{padding:20px 16px 40px}}
        @media(max-width:560px){.easy-top{height:auto;min-height:64px;padding:10px 14px;gap:8px;flex-wrap:wrap}.easy-brand{font-size:18px}.easy-nav{width:100%;display:grid;grid-template-columns:repeat(3,1fr)}.easy-nav a{text-align:center;padding:9px 4px;font-size:12px}.easy-main{padding:15px 11px 30px}.easy-heading{align-items:flex-start;flex-direction:column}.easy-heading h1{font-size:25px}.search-wrap{gap:7px}.search-wrap input{height:54px;font-size:15px;padding:0 12px}.scan-btn{padding:0 12px;font-size:12px;min-height:54px}.easy-products{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.easy-product{padding:9px}.easy-product strong{font-size:13px}.easy-product .price{font-size:16px}.add-btn{min-height:44px}.basket-top{padding:15px}.basket-content,.basket-bottom{padding:14px}.grand-total strong{font-size:27px}}
      `}</style>
      <header className="easy-top">
        <Link href="/app" className="easy-brand">WARD <span>COSMETICS</span> · CHECKOUT</Link>
        <nav className="easy-nav"><Link href="/app">Home</Link><Link href="/app/products">Products</Link><Link href="/app/orders">Orders</Link></nav>
      </header>
      <main className="easy-main">
        <div className="easy-heading"><div><h1>Make a sale</h1><p>Scan a barcode or tap a product. It will appear in the basket.</p></div><span className="step-pill">STEP 1 · ADD PRODUCTS</span></div>
        <div className="easy-layout">
          <section className="catalog-area">
            <div className="search-wrap"><input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addByBarcode(query); } }} placeholder="Type product name or scan barcode" autoComplete="off" /><button className="scan-btn" type="button" onClick={() => { setMessage(""); setScannerOpen((v) => !v); }}>{scannerOpen ? "Close camera" : "▣ Scan barcode"}</button></div>
            {scannerOpen && <div className="scanner-area"><video ref={videoRef} autoPlay muted playsInline /><p>Hold the barcode in front of the camera. The product will be added automatically.</p></div>}
            <div className="catalog-head"><h2>Choose a product</h2><span>{filtered.length} products</span></div>
            <div className="easy-products">{filtered.map((product) => <article className="easy-product" key={product.id}><img src={product.image_url || "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=500"} alt={product.name} loading="lazy"/><span className="brand">{product.brand || "WARD COSMETICS"}</span><strong>{product.name}</strong><div className="price-row"><span className="price">{money(Number(product.price))}</span><span className="stock">{product.stock_quantity === null ? "" : `${product.stock_quantity} left`}</span></div><button className="add-btn" type="button" disabled={product.stock_quantity !== null && product.stock_quantity <= 0} onClick={() => addProduct(product)}>＋ Add</button></article>)}{filtered.length===0&&<div className="basket-empty" style={{gridColumn:"1/-1"}}><b>No products found</b><span>Try another name or scan the barcode.</span></div>}</div>
          </section>
          <aside className="basket"><div className="basket-top"><h2>Customer basket</h2><span className="basket-count">{itemCount}</span></div><div className="basket-content">{lastReceipt&&<div className="receipt"><b>Sale completed · {lastReceipt.sale_number}</b>Total paid: {money(lastReceipt.total)}</div>}{lines.length===0?<div className="basket-empty"><b>Your basket is empty</b><span>Tap any product to add it here.</span></div>:lines.map((line)=><div className="basket-line" key={line.product.id}><div><b>{line.product.name}</b><small>{money(Number(line.product.price))} each</small><div className="quantity"><button type="button" aria-label="Remove one" onClick={()=>changeQuantity(line.product.id,line.quantity-1)}>−</button><span>{line.quantity}</span><button type="button" aria-label="Add one" onClick={()=>changeQuantity(line.product.id,line.quantity+1)}>＋</button></div></div><strong className="basket-line-total">{money(Number(line.product.price)*line.quantity)}</strong></div>)}</div><div className="basket-bottom"><label>How is the customer paying?</label><select value={paymentMethod} onChange={(e)=>setPaymentMethod(e.target.value)}><option value="cash">Cash</option><option value="card">Card</option><option value="whish">Whish</option><option value="other">Other</option></select><div className="grand-total"><span>Amount to pay</span><strong>{money(total)}</strong></div><button className="pay-btn" type="button" disabled={!lines.length||busy} onClick={completeSale}>{busy?"Please wait…":"Complete sale ✓"}</button><button className="clear-btn" type="button" disabled={!lines.length||busy} onClick={()=>setCart({})}>Empty basket</button>{message&&<p className="status" role="status">{message}</p>}</div></aside>
        </div>
      </main>
    </div>
  );
}
