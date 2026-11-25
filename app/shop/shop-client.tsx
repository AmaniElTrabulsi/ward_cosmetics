
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Product = {
  id: string;
  brand: string;
  name: string;
  price: number;
  stock_quantity: number | null;
  image_url: string | null;
  description?: string | null;
  created_at?: string | null;
};

type Cart = Record<string, number>;

type ConfirmationItem = {
  name: string;
  brand: string;
  quantity: number;
  price: number;
  total: number;
};

type OrderConfirmation = {
  orderNumber: string;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  delivery: string;
  payment: string;
  paymentStatus: string;
  whishTransactionId: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  items: ConfirmationItem[];
  createdAt: string;
};

const WHISH_RECIPIENT = "Hadi Dabbous";
const WHISH_PHONE = "76180300";

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

function paymentLabel(method: string) {
  if (method === "whish") return "Whish";
  if (method === "cash_at_store") return "Cash at store";
  return "Cash on delivery";
}

function deliveryLabel(method: string) {
  return method === "pickup" ? "Store pickup" : "Home delivery";
}

function makeCanvasImage(order: OrderConfirmation): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1500;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not create the order confirmation image."));
      return;
    }

    const width = canvas.width;

    ctx.fillStyle = "#f3eee5";
    ctx.fillRect(0, 0, width, canvas.height);

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(55, 55, 970, 1390, 35);
    ctx.fill();

    ctx.fillStyle = "#171713";
    ctx.textAlign = "center";
    ctx.font = "bold 49px Arial";
    ctx.fillText("WARD COSMETICS", width / 2, 145);

    ctx.fillStyle = "#b18a54";
    ctx.font = "22px Arial";
    ctx.fillText("YOUR BEAUTY ORDER", width / 2, 190);

    ctx.strokeStyle = "#e7dfd2";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(115, 230);
    ctx.lineTo(965, 230);
    ctx.stroke();

    ctx.fillStyle = "#293f32";
    ctx.font = "bold 58px Arial";
    ctx.fillText("Thank you!", width / 2, 320);

    ctx.fillStyle = "#77736b";
    ctx.font = "25px Arial";
    ctx.fillText("Your order has been successfully placed.", width / 2, 370);

    ctx.fillStyle = "#f5f1e9";
    ctx.beginPath();
    ctx.roundRect(115, 420, 850, 185, 20);
    ctx.fill();

    ctx.fillStyle = "#77736b";
    ctx.font = "bold 22px Arial";
    ctx.fillText("YOUR ORDER NUMBER", width / 2, 470);

    ctx.fillStyle = "#171713";
    ctx.font = "bold 42px Arial";

    const orderText = order.orderNumber;
    const maxOrderWidth = 790;
    let orderFontSize = 42;

    while (
      ctx.measureText(orderText).width > maxOrderWidth &&
      orderFontSize > 22
    ) {
      orderFontSize -= 2;
      ctx.font = `bold ${orderFontSize}px Arial`;
    }

    ctx.fillText(orderText, width / 2, 540);

    let y = 685;

    ctx.textAlign = "left";
    ctx.fillStyle = "#171713";
    ctx.font = "bold 29px Arial";
    ctx.fillText("ORDER DETAILS", 125, y);

    y += 55;

    const detail = (label: string, value: string) => {
      ctx.fillStyle = "#77736b";
      ctx.font = "22px Arial";
      ctx.fillText(label, 125, y);

      ctx.fillStyle = "#171713";
      ctx.font = "bold 23px Arial";
      ctx.fillText(value || "-", 475, y);

      y += 43;
    };

    detail("Customer", order.customerName);
    detail("Phone", order.phone);
    detail("Receiving", deliveryLabel(order.delivery));

    if (order.delivery === "delivery") {
      detail("City", order.city);
      detail("Address", order.address);
    }

    detail("Payment", paymentLabel(order.payment));
    detail("Payment status", order.paymentStatus);

    if (order.payment === "whish") {
      detail("Whish number", WHISH_PHONE);
      detail("Transaction ID", order.whishTransactionId);
    }

    y += 15;

    ctx.strokeStyle = "#e7dfd2";
    ctx.beginPath();
    ctx.moveTo(125, y);
    ctx.lineTo(955, y);
    ctx.stroke();

    y += 55;

    ctx.fillStyle = "#171713";
    ctx.font = "bold 29px Arial";
    ctx.fillText("YOUR PRODUCTS", 125, y);

    y += 48;

    order.items.forEach((item) => {
      ctx.fillStyle = "#171713";
      ctx.font = "bold 21px Arial";

      const itemText = `${item.name} x ${item.quantity}`;
      ctx.fillText(itemText.slice(0, 42), 125, y);

      ctx.textAlign = "right";
      ctx.fillText(money(item.total), 955, y);
      ctx.textAlign = "left";

      y += 39;
    });

    y += 20;

    ctx.strokeStyle = "#e7dfd2";
    ctx.beginPath();
    ctx.moveTo(125, y);
    ctx.lineTo(955, y);
    ctx.stroke();

    y += 45;

    const amount = (label: string, value: string, bold = false) => {
      ctx.textAlign = "left";
      ctx.fillStyle = "#77736b";
      ctx.font = bold ? "bold 27px Arial" : "23px Arial";
      ctx.fillText(label, 125, y);

      ctx.textAlign = "right";
      ctx.fillStyle = "#171713";
      ctx.font = bold ? "bold 31px Arial" : "23px Arial";
      ctx.fillText(value, 955, y);

      ctx.textAlign = "left";
      y += bold ? 55 : 42;
    };

    amount("Subtotal", money(order.subtotal));
    amount("Delivery", money(order.deliveryFee));
    amount("TOTAL", money(order.total), true);

    ctx.textAlign = "center";
    ctx.fillStyle = "#77736b";
    ctx.font = "22px Arial";
    ctx.fillText(
      "Please keep this order confirmation.",
      width / 2,
      1360
    );

    ctx.fillText(
      "Show your order number at the store or to your delivery person.",
      width / 2,
      1400
    );

    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not generate the confirmation image."));
    }, "image/png");
  });
}

export default function ShopClient({
  products,
}: {
  products: Product[];
}) {
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("all");
  const [sort, setSort] = useState("newest");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);

  const [cart, setCart] = useState<Cart>({});
  const [delivery, setDelivery] = useState("delivery");
  const [payment, setPayment] = useState("cash_on_delivery");

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [whishTransactionId, setWhishTransactionId] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] =
    useState<OrderConfirmation | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageMessage, setImageMessage] = useState("");

  const brands = useMemo(
    () => [...new Set(products.map((p) => p.brand).filter(Boolean))].sort(),
    [products]
  );

  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      const search =
        `${p.name} ${p.brand} ${p.description || ""}`.toLowerCase();

      if (!search.includes(q.toLowerCase())) return false;
      if (brand !== "all" && p.brand !== brand) return false;
      if (maxPrice !== "" && Number(p.price) > Number(maxPrice)) return false;
      if (inStockOnly && p.stock_quantity !== null && p.stock_quantity <= 0)
        return false;

      return true;
    });

    result = [...result];

    if (sort === "price-low") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === "price-high") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sort === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      );
    }

    return result;
  }, [products, q, brand, maxPrice, inStockOnly, sort]);

  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartProducts = products.filter((p) => cart[p.id] > 0);

  const subtotal = cartProducts.reduce(
    (sum, p) => sum + Number(p.price) * cart[p.id],
    0
  );

  const deliveryFee = delivery === "delivery" ? 2 : 0;
  const total = subtotal + deliveryFee;

  function updateQuantity(id: string, amount: number) {
    setCart((current) => {
      const next = { ...current };
      const value = (next[id] || 0) + amount;

      if (value <= 0) delete next[id];
      else next[id] = value;

      return next;
    });
  }

  function changeDelivery(value: string) {
    setDelivery(value);

    if (value === "pickup") {
      setPayment("cash_at_store");
    } else if (payment === "cash_at_store") {
      setPayment("cash_on_delivery");
    }

    setMessage("");
  }

  async function saveConfirmationImage(share: boolean) {
    if (!confirmation) return;

    setImageBusy(true);
    setImageMessage("");

    try {
      const blob = await makeCanvasImage(confirmation);
      const file = new File(
        [blob],
        `${confirmation.orderNumber}-confirmation.png`,
        { type: "image/png" }
      );

      if (
        share &&
        navigator.share &&
        navigator.canShare?.({ files: [file] })
      ) {
        await navigator.share({
          title: `Ward Cosmetics - ${confirmation.orderNumber}`,
          text: `My Ward Cosmetics order confirmation: ${confirmation.orderNumber}`,
          files: [file],
        });

        setImageMessage("Your confirmation is ready to share.");
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `${confirmation.orderNumber}-confirmation.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();

        window.setTimeout(() => URL.revokeObjectURL(url), 10000);

        setImageMessage(
          "Your confirmation image has been prepared. On iPhone, open the image and use Share → Save Image if it does not save automatically."
        );
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setImageMessage("");
      } else {
        setImageMessage("Unable to create the image. Please try again.");
      }
    } finally {
      setImageBusy(false);
    }
  }

  async function placeOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setConfirmation(null);

    if (count === 0) {
      setMessage("Your shopping bag is empty.");
      return;
    }

    if (!customerName.trim() || !phone.trim()) {
      setMessage("Please enter your name and phone number.");
      return;
    }

    if (delivery === "delivery" && (!city.trim() || !address.trim())) {
      setMessage("Please enter your delivery city and address.");
      return;
    }

    if (payment === "whish" && !whishTransactionId.trim()) {
      setMessage("Please enter your Whish transaction number.");
      return;
    }

    setLoading(true);

    try {
      const itemsForConfirmation: ConfirmationItem[] = cartProducts.map(
        (p) => ({
          name: p.name,
          brand: p.brand,
          quantity: cart[p.id],
          price: Number(p.price),
          total: Number(p.price) * cart[p.id],
        })
      );

      const orderDetails = {
        customerName: customerName.trim(),
        phone: phone.trim(),
        city: delivery === "pickup" ? "Store pickup" : city.trim(),
        address: delivery === "pickup" ? "Store pickup" : address.trim(),
        delivery,
        payment,
        whishTransactionId:
          payment === "whish" ? whishTransactionId.trim() : "",
        subtotal,
        deliveryFee,
        total,
        items: itemsForConfirmation,
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: orderDetails.customerName,
          customer_phone: orderDetails.phone,
          customer_city: orderDetails.city,
          customer_address: orderDetails.address,
          notes: notes.trim(),
          delivery_type: delivery,
          payment_method: payment,
          whish_transaction_id: orderDetails.whishTransactionId || null,
          items: Object.entries(cart).map(([product_id, quantity]) => ({
            product_id,
            quantity,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to place your order.");
      }

      const reference =
        result.order_number || result.order_id || result.id;

      if (!reference) {
        throw new Error(
          "The order was created, but no order reference was returned. Please contact the store before placing another order."
        );
      }

      setConfirmation({
        ...orderDetails,
        orderNumber: String(reference),
        paymentStatus: "Pending verification",
        createdAt: new Date().toLocaleString(),
      });

      setMessage("Your order has been placed successfully!");
      setCart({});
      setCustomerName("");
      setPhone("");
      setCity("");
      setAddress("");
      setNotes("");
      setWhishTransactionId("");
      setImageMessage("");

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style jsx>{`
        .shop-products-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          align-items: stretch;
        }
        .shop-products-grid .product {
          min-width: 0;
          overflow: hidden;
        }
        .shop-products-grid .product img {
          display: block;
          width: 100%;
          aspect-ratio: 1 / 1;
          object-fit: cover;
        }
        .shop-products-grid .product-body {
          min-width: 0;
          padding: 12px;
        }
        .shop-products-grid .product-body strong {
          overflow-wrap: anywhere;
        }
        .shop-products-grid .product-body .row {
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }
        .shop-products-grid .product-body .btn {
          min-height: 40px;
          padding: 9px 11px;
        }
        .shop-controls {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          padding: 14px !important;
        }
        .shop-controls label {
          min-width: 0;
        }
        .shop-controls .field {
          width: 100%;
          min-width: 0;
        }
        .shop-search {
          width: min(100%, 360px);
        }
        @media (min-width: 700px) {
          .shop-products-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 18px;
          }
          .shop-controls {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)) !important;
            padding: 20px !important;
          }
        }
        @media (min-width: 1100px) {
          .shop-products-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }
        @media (max-width: 420px) {
          .shop-products-grid {
            gap: 9px;
          }
          .shop-products-grid .product-body {
            padding: 9px;
          }
          .shop-products-grid .product-body .price {
            font-size: 15px;
          }
          .shop-products-grid .product-body .btn {
            width: 100%;
          }
        }
      `}</style>
      <header className="topbar">
        <Link href="/" className="brand" style={{ textDecoration: "none" }}>
          WARD COSMETICS
        </Link>

        <nav className="navlinks">
          <Link href="/">Home</Link>
          <a href="#cart">
            Bag <span className="badge-count">{count}</span>
          </a>
          <Link href="/login">Staff</Link>
        </nav>
      </header>

      <main className="shell" style={{ paddingBottom: 36, overflowX: "hidden" }}>
        {confirmation && (
          <section
            className="panel"
            style={{
              marginTop: 24,
              marginBottom: 30,
              maxWidth: 720,
              marginInline: "auto",
              padding: 26,
              border: "1px solid #d8c9ae",
              background: "#fffdf9",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div className="eyebrow">WARD COSMETICS</div>
              <h1 className="section-title" style={{ marginTop: 12 }}>
                Thank you!
              </h1>
              <p className="muted">
                Your order has been successfully placed.
              </p>
            </div>

            <div
              style={{
                background: "#f3eee5",
                borderRadius: 14,
                padding: 22,
                marginTop: 22,
                textAlign: "center",
              }}
            >
              <div className="eyebrow">Your order number</div>
              <h2
                style={{
                  fontSize: 27,
                  overflowWrap: "anywhere",
                  margin: "12px 0",
                }}
              >
                {confirmation.orderNumber}
              </h2>
              <strong>Please keep your order number.</strong>
              <p className="muted small">
                Show it at the store or to your delivery person.
              </p>
            </div>

            <div style={{ marginTop: 24 }}>
              <h3>Order details</h3>
              <div className="stack" style={{ gap: 9, marginTop: 12 }}>
                <div className="row">
                  <span className="muted">Customer</span>
                  <strong>{confirmation.customerName}</strong>
                </div>
                <div className="row">
                  <span className="muted">Phone</span>
                  <strong>{confirmation.phone}</strong>
                </div>
                <div className="row">
                  <span className="muted">Receiving method</span>
                  <strong>{deliveryLabel(confirmation.delivery)}</strong>
                </div>

                {confirmation.delivery === "delivery" && (
                  <>
                    <div className="row">
                      <span className="muted">City</span>
                      <strong>{confirmation.city}</strong>
                    </div>
                    <div className="row">
                      <span className="muted">Address</span>
                      <strong>{confirmation.address}</strong>
                    </div>
                  </>
                )}

                <div className="row">
                  <span className="muted">Payment method</span>
                  <strong>{paymentLabel(confirmation.payment)}</strong>
                </div>
                <div className="row">
                  <span className="muted">Payment status</span>
                  <strong>{confirmation.paymentStatus}</strong>
                </div>
              </div>
            </div>

            {confirmation.payment === "whish" && (
              <div
                className="panel"
                style={{
                  marginTop: 20,
                  background: "#f8f4ed",
                  border: "1px solid #d8c9ae",
                }}
              >
                <h3>Whish payment details</h3>

                <p style={{ marginTop: 12 }}>
                  Recipient: <strong>{WHISH_RECIPIENT}</strong>
                </p>

                <p>
                  Send to Whish number:{" "}
                  <strong
                    style={{
                      fontSize: 22,
                      color: "#293f32",
                      letterSpacing: 1,
                    }}
                  >
                    {WHISH_PHONE}
                  </strong>
                </p>

                <p>
                  Amount: <strong>{money(confirmation.total)}</strong>
                </p>

                <p>
                  Your transaction number:{" "}
                  <strong>{confirmation.whishTransactionId}</strong>
                </p>

                <p className="muted small" style={{ marginTop: 12 }}>
                  Your payment will remain pending until Ward Cosmetics
                  verifies your transaction.
                </p>
              </div>
            )}

            <div style={{ marginTop: 22 }}>
              <h3>Products ordered</h3>

              {confirmation.items.map((item, index) => (
                <div
                  className="row"
                  key={`${item.name}-${index}`}
                  style={{
                    justifyContent: "space-between",
                    borderBottom: "1px solid #e7dfd2",
                    padding: "10px 0",
                    gap: 12,
                  }}
                >
                  <div>
                    <strong>{item.name}</strong>
                    <div className="muted small">
                      {item.brand} · Qty: {item.quantity}
                    </div>
                  </div>
                  <strong>{money(item.total)}</strong>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20 }}>
              <div className="row">
                <span>Subtotal</span>
                <strong>{money(confirmation.subtotal)}</strong>
              </div>
              <div className="row">
                <span>Delivery</span>
                <strong>{money(confirmation.deliveryFee)}</strong>
              </div>
              <div
                className="row"
                style={{
                  borderTop: "1px solid #ddd",
                  paddingTop: 14,
                  marginTop: 12,
                }}
              >
                <strong>Total</strong>
                <strong className="price">{money(confirmation.total)}</strong>
              </div>
            </div>

            <div className="stack" style={{ marginTop: 24, gap: 12 }}>
              <button
                type="button"
                className="btn"
                disabled={imageBusy}
                onClick={() => saveConfirmationImage(false)}
                style={{ width: "100%" }}
              >
                {imageBusy ? "Preparing image..." : "↓ Save confirmation as image"}
              </button>

              <button
                type="button"
                className="btn btn-light"
                disabled={imageBusy}
                onClick={() => saveConfirmationImage(true)}
                style={{ width: "100%" }}
              >
                Share confirmation
              </button>

              {imageMessage && (
                <p className="muted small" role="status">
                  {imageMessage}
                </p>
              )}
            </div>

            <p className="muted small" style={{ textAlign: "center", marginTop: 20 }}>
              Thank you for shopping with Ward Cosmetics.
            </p>
          </section>
        )}

        <div className="row" style={{ alignItems: "end", flexWrap: "wrap" }}>
          <div>
            <div className="eyebrow">Curated beauty</div>
            <h1 className="section-title" style={{ fontSize: 38 }}>
              The collection
            </h1>
            <p className="muted small">
              Discover your next beauty favourite.
            </p>
          </div>

          <input
            className="field shop-search"
            style={{ maxWidth: 360 }}
            placeholder="Search products or brands..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <section
          className="panel shop-controls"
          style={{
            marginTop: 22,
            marginBottom: 24,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
            gap: 14,
          }}
        >
          <label>
            <span className="eyebrow">Brand</span>
            <select
              className="field"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            >
              <option value="all">All brands</option>
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="eyebrow">Maximum price ($)</span>
            <input
              className="field"
              type="number"
              min="0"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </label>

          <label>
            <span className="eyebrow">Sort by</span>
            <select
              className="field"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="name">Name: A–Z</option>
            </select>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 22 }}>
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
            />
            In-stock products only
          </label>

          <button
            type="button"
            className="btn btn-light"
            onClick={() => {
              setQ("");
              setBrand("all");
              setSort("newest");
              setMinPrice("");
              setMaxPrice("");
              setInStockOnly(false);
            }}
          >
            Clear filters
          </button>
        </section>

        <div className="row" style={{ marginBottom: 14 }}>
          <span className="muted small">{filtered.length} products</span>
        </div>

        {filtered.length === 0 ? (
          <div className="panel">
            <p className="muted">No products match your filters.</p>
          </div>
        ) : (
          <div className="shop-products-grid">
            {filtered.map((p) => {
              const unavailable =
                p.stock_quantity !== null && p.stock_quantity <= 0;

              return (
                <article className="product" key={p.id}>
                  <img
                    src={
                      p.image_url ||
                      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600"
                    }
                    alt={p.name}
                    loading="lazy"
                  />

                  <div className="product-body">
                    <div className="eyebrow">{p.brand}</div>
                    <strong>{p.name}</strong>

                    {p.description && (
                      <p className="muted small">{p.description}</p>
                    )}

                    <div className="row">
                      <span className="price">
                        {money(Number(p.price))}
                      </span>
                      <button
                        className="btn"
                        disabled={unavailable}
                        onClick={() => updateQuantity(p.id, 1)}
                      >
                        {unavailable ? "Out of stock" : "Add to bag"}
                      </button>
                    </div>

                    {p.stock_quantity !== null && p.stock_quantity > 0 && (
                      <p className="muted small">
                        {p.stock_quantity} available
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <section
          id="cart"
          className="panel"
          style={{ marginTop: 32, scrollMarginTop: 90 }}
        >
          <div className="eyebrow">Your selection</div>
          <h2 className="section-title">Your bag ({count})</h2>

          {count === 0 ? (
            <p className="muted">
              Your bag is waiting for something lovely.
            </p>
          ) : (
            <>
              <div className="stack">
                {cartProducts.map((p) => (
                  <div
                    className="row"
                    key={p.id}
                    style={{
                      justifyContent: "space-between",
                      gap: 12,
                      borderBottom: "1px solid var(--line, #ddd)",
                      padding: "12px 0",
                    }}
                  >
                    <div>
                      <strong>{p.name}</strong>
                      <div className="muted small">{p.brand}</div>
                      <div className="muted small">
                        {money(Number(p.price))} each
                      </div>
                    </div>

                    <div className="row" style={{ gap: 8, alignItems: "center" }}>
                      <button
                        type="button"
                        className="btn btn-light"
                        onClick={() => updateQuantity(p.id, -1)}
                      >
                        −
                      </button>
                      <strong>{cart[p.id]}</strong>
                      <button
                        type="button"
                        className="btn btn-light"
                        disabled={
                          p.stock_quantity !== null &&
                          cart[p.id] >= p.stock_quantity
                        }
                        onClick={() => updateQuantity(p.id, 1)}
                      >
                        +
                      </button>
                      <strong>{money(Number(p.price) * cart[p.id])}</strong>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="btn btn-light"
                style={{ marginTop: 14 }}
                onClick={() => setCart({})}
              >
                Clear bag
              </button>

              <div style={{ marginTop: 26 }}>
                <div className="eyebrow">Delivery or collection</div>
                <h3>How would you like to receive your order?</h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                    gap: 12,
                    marginTop: 12,
                  }}
                >
                  <label className="panel">
                    <input
                      type="radio"
                      name="delivery"
                      checked={delivery === "delivery"}
                      onChange={() => changeDelivery("delivery")}
                    />{" "}
                    Home delivery
                    <p className="muted small">Delivery fee: $2</p>
                  </label>

                  <label className="panel">
                    <input
                      type="radio"
                      name="delivery"
                      checked={delivery === "pickup"}
                      onChange={() => changeDelivery("pickup")}
                    />{" "}
                    Pick up at store
                    <p className="muted small">Free collection</p>
                  </label>
                </div>
              </div>

              <form onSubmit={placeOrder} style={{ marginTop: 24 }}>
                <div className="eyebrow">Your details</div>
                <h3>Where should we send your order?</h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                    gap: 14,
                    marginTop: 14,
                  }}
                >
                  <label>
                    <span className="eyebrow">Full name</span>
                    <input
                      className="field"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your name"
                    />
                  </label>

                  <label>
                    <span className="eyebrow">Phone number</span>
                    <input
                      className="field"
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Your phone number"
                    />
                  </label>

                  {delivery === "delivery" && (
                    <>
                      <label>
                        <span className="eyebrow">City</span>
                        <input
                          className="field"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Your city"
                        />
                      </label>

                      <label>
                        <span className="eyebrow">Full address</span>
                        <input
                          className="field"
                          required
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Street, building, floor..."
                        />
                      </label>
                    </>
                  )}
                </div>

                <label style={{ display: "block", marginTop: 14 }}>
                  <span className="eyebrow">Additional notes (optional)</span>
                  <textarea
                    className="field"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special instructions?"
                  />
                </label>

                <div style={{ marginTop: 24 }}>
                  <div className="eyebrow">Payment</div>
                  <h3>Choose your payment method</h3>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                      gap: 12,
                      marginTop: 12,
                    }}
                  >
                    {delivery === "delivery" && (
                      <label className="panel">
                        <input
                          type="radio"
                          name="payment"
                          checked={payment === "cash_on_delivery"}
                          onChange={() => setPayment("cash_on_delivery")}
                        />{" "}
                        Cash on delivery
                      </label>
                    )}

                    {delivery === "pickup" && (
                      <label className="panel">
                        <input
                          type="radio"
                          name="payment"
                          checked={payment === "cash_at_store"}
                          onChange={() => setPayment("cash_at_store")}
                        />{" "}
                        Cash at store
                        <p className="muted small">Pay when collecting.</p>
                      </label>
                    )}

                    <label className="panel">
                      <input
                        type="radio"
                        name="payment"
                        checked={payment === "whish"}
                        onChange={() => {
                          setPayment("whish");
                          setMessage("");
                        }}
                      />{" "}
                      Whish
                      <p className="muted small">
                        Pay to {WHISH_RECIPIENT}
                      </p>
                    </label>
                  </div>

                  {payment === "whish" && (
                    <div
                      className="panel"
                      style={{
                        marginTop: 16,
                        background: "#f8f4ed",
                        border: "1px solid #d8c9ae",
                        maxWidth: 560,
                      }}
                    >
                      <div className="eyebrow">Whish payment</div>
                      <h3 style={{ marginTop: 8 }}>
                        Send your payment to:
                      </h3>

                      <div style={{ marginTop: 16 }}>
                        <span className="muted small">Recipient name</span>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>
                          {WHISH_RECIPIENT}
                        </div>
                      </div>

                      <div style={{ marginTop: 14 }}>
                        <span className="muted small">Whish phone number</span>
                        <div
                          style={{
                            fontSize: 30,
                            fontWeight: 800,
                            letterSpacing: 2,
                            color: "#293f32",
                          }}
                        >
                          {WHISH_PHONE}
                        </div>
                      </div>

                      <div style={{ marginTop: 14 }}>
                        <span className="muted small">Amount to send</span>
                        <div
                          className="price"
                          style={{ fontSize: 26, fontWeight: 800 }}
                        >
                          {money(total)}
                        </div>
                      </div>

                      <div
                        style={{
                          borderTop: "1px solid #d8c9ae",
                          marginTop: 18,
                          paddingTop: 16,
                        }}
                      >
                        <label>
                          <span className="eyebrow">
                            Whish transaction number *
                          </span>
                          <input
                            className="field"
                            type="text"
                            required
                            maxLength={120}
                            autoComplete="off"
                            value={whishTransactionId}
                            onChange={(e) =>
                              setWhishTransactionId(e.target.value)
                            }
                            placeholder="Enter your transaction number"
                            style={{ marginTop: 8 }}
                          />
                        </label>

                        <p className="muted small" style={{ marginTop: 9 }}>
                          After sending the payment, enter the transaction
                          number shown by Whish. Your payment will be checked
                          by our staff before it is marked as paid.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="panel" style={{ marginTop: 24, maxWidth: 480 }}>
                  <div className="row">
                    <span>Subtotal</span>
                    <strong>{money(subtotal)}</strong>
                  </div>

                  <div className="row">
                    <span>Delivery</span>
                    <strong>{money(deliveryFee)}</strong>
                  </div>

                  <div
                    className="row"
                    style={{
                      borderTop: "1px solid var(--line, #ddd)",
                      paddingTop: 14,
                      marginTop: 12,
                    }}
                  >
                    <strong>Total</strong>
                    <strong className="price">{money(total)}</strong>
                  </div>

                  <button
                    className="btn"
                    type="submit"
                    disabled={loading}
                    style={{ width: "100%", marginTop: 18 }}
                  >
                    {loading ? "Placing order..." : "Place order"}
                  </button>

                  {message && (
                    <p role="status" style={{ marginTop: 14 }} className="muted">
                      {message}
                    </p>
                  )}
                </div>
              </form>
            </>
          )}
        </section>
      </main>
    </>
  );
}
