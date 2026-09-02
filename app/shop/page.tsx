"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

// ============================================================
// STORE SETTINGS
// ============================================================

const WHISH_NAME = "Hadi Dabbous";
const WHISH_PHONE = "76 180 300";

const DELIVERY_FEE = 2;

// ============================================================
// TYPES
// ============================================================

type Product = {
  id: string;
  brand: string | null;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  image_url: string | null;
  barcode: string | null;
  created_at: string;
};

type CartItem = {
  product: Product;
  quantity: number;
};

type PaymentMethod =
  | "cash_on_delivery"
  | "whish"
  | "cash_at_store";

// ============================================================
// PAGE
// ============================================================

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search / filtering / sorting
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("featured");

  // Cart
  const [cartOpen, setCartOpen] = useState(false);

  // Product details
  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  // Checkout
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cash_on_delivery");

  const [whishReference, setWhishReference] = useState("");

  // ============================================================
  // LOAD PRODUCTS
  // ============================================================

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const { data, error: productsError } = await supabase
        .from("products")
        .select(
          "id, brand, name, description, price, stock_quantity, image_url, barcode, created_at"
        )
        .order("created_at", {
          ascending: false,
        });

      if (productsError) {
        console.error(
          "Error loading products:",
          productsError
        );

        setError("Unable to load products.");
        return;
      }

      setProducts((data || []) as Product[]);
    } catch (err) {
      console.error(
        "Error loading products:",
        err
      );

      setError(
        "Something went wrong while loading products."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // CATEGORIES
  // ============================================================

  const categories = useMemo(() => {
    const unique = new Set<string>();

    products.forEach((product) => {
      if (product.brand?.trim()) {
        unique.add(product.brand.trim());
      }
    });

    return Array.from(unique).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [products]);

  // ============================================================
  // FILTER / SEARCH / SORT
  // ============================================================

  const displayedProducts = useMemo(() => {
    let result = [...products];

    const searchValue =
      search.trim().toLowerCase();

    if (searchValue) {
      result = result.filter((product) => {
        const name =
          product.name?.toLowerCase() || "";

        const brand =
          product.brand?.toLowerCase() || "";

        const barcode =
          product.barcode?.toLowerCase() || "";

        const description =
          product.description?.toLowerCase() || "";

        return (
          name.includes(searchValue) ||
          brand.includes(searchValue) ||
          barcode.includes(searchValue) ||
          description.includes(searchValue)
        );
      });
    }

    if (category !== "all") {
      result = result.filter(
        (product) =>
          product.brand === category
      );
    }

    switch (sort) {
      case "price_low":
        result.sort(
          (a, b) => a.price - b.price
        );
        break;

      case "price_high":
        result.sort(
          (a, b) => b.price - a.price
        );
        break;

      case "name_az":
        result.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        break;

      case "name_za":
        result.sort((a, b) =>
          b.name.localeCompare(a.name)
        );
        break;

      case "in_stock":
        result.sort((a, b) => {
          const aStock =
            a.stock_quantity > 0 ? 1 : 0;

          const bStock =
            b.stock_quantity > 0 ? 1 : 0;

          return bStock - aStock;
        });
        break;

      case "out_of_stock":
        result.sort((a, b) => {
          const aStock =
            a.stock_quantity > 0 ? 1 : 0;

          const bStock =
            b.stock_quantity > 0 ? 1 : 0;

          return aStock - bStock;
        });
        break;

      case "stock":
        result.sort(
          (a, b) =>
            b.stock_quantity -
            a.stock_quantity
        );
        break;

      case "featured":
      default:
        result.sort(
          (a, b) =>
            new Date(
              b.created_at
            ).getTime() -
            new Date(
              a.created_at
            ).getTime()
        );
        break;
    }

    return result;
  }, [
    products,
    search,
    category,
    sort,
  ]);

  // ============================================================
  // CART TOTALS
  // ============================================================

  const cartCount = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );
  }, [cart]);

  const subtotal = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum +
        Number(item.product.price) *
          item.quantity,
      0
    );
  }, [cart]);

  const deliveryFee =
    paymentMethod === "cash_at_store"
      ? 0
      : DELIVERY_FEE;

  const total =
    subtotal + deliveryFee;

  // ============================================================
  // ADD TO CART
  // ============================================================

  function addToCart(product: Product) {
    setError("");
    setSuccess("");

    if (product.stock_quantity <= 0) {
      setError(
        `${product.name} is currently out of stock.`
      );

      return;
    }

    setCart((current) => {
      const existing = current.find(
        (item) =>
          item.product.id === product.id
      );

      if (existing) {
        if (
          existing.quantity >=
          product.stock_quantity
        ) {
          return current;
        }

        return current.map((item) =>
          item.product.id ===
          product.id
            ? {
                ...item,
                quantity:
                  item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...current,
        {
          product,
          quantity: 1,
        },
      ];
    });
  }

  // ============================================================
  // CHANGE CART QUANTITY
  // ============================================================

  function increaseQuantity(
    productId: string
  ) {
    setCart((current) =>
      current.map((item) => {
        if (
          item.product.id !==
          productId
        ) {
          return item;
        }

        if (
          item.quantity >=
          item.product.stock_quantity
        ) {
          return item;
        }

        return {
          ...item,
          quantity:
            item.quantity + 1,
        };
      })
    );
  }

  function decreaseQuantity(
    productId: string
  ) {
    setCart((current) =>
      current
        .map((item) => {
          if (
            item.product.id !==
            productId
          ) {
            return item;
          }

          return {
            ...item,
            quantity:
              item.quantity - 1,
          };
        })
        .filter(
          (item) => item.quantity > 0
        )
    );
  }

  function removeFromCart(
    productId: string
  ) {
    setCart((current) =>
      current.filter(
        (item) =>
          item.product.id !==
          productId
      )
    );
  }

  // ============================================================
  // CHECKOUT
  // ============================================================

  function openCheckout() {
    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setError("");
    setCartOpen(false);
    setCheckoutOpen(true);
  }

  // ============================================================
  // PAYMENT METHOD
  // ============================================================

  function changePaymentMethod(
    method: PaymentMethod
  ) {
    setPaymentMethod(method);
    setError("");

    if (method !== "whish") {
      setWhishReference("");
    }
  }

  // ============================================================
  // PLACE ORDER
  // ============================================================

  async function placeOrder(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!customerName.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!customerPhone.trim()) {
      setError(
        "Please enter your phone number."
      );
      return;
    }

    if (!customerCity.trim()) {
      setError("Please enter your city.");
      return;
    }

    if (
      paymentMethod !==
        "cash_at_store" &&
      !customerAddress.trim()
    ) {
      setError(
        "Please enter your delivery address."
      );
      return;
    }

    if (
      paymentMethod === "whish" &&
      !whishReference.trim()
    ) {
      setError(
        "Please enter your Whish transaction/reference number."
      );
      return;
    }

    setPlacingOrder(true);

    try {
      // ========================================================
      // VERIFY CURRENT STOCK
      // ========================================================

      const productIds = cart.map(
        (item) => item.product.id
      );

      const {
        data: currentProducts,
        error: stockError,
      } = await supabase
        .from("products")
        .select(
          "id, name, price, stock_quantity"
        )
        .in("id", productIds);

      if (stockError) {
        console.error(
          "Stock verification error:",
          stockError
        );

        setError(
          "Unable to verify product availability."
        );

        return;
      }

      for (const item of cart) {
        const currentProduct =
          currentProducts?.find(
            (product) =>
              product.id ===
              item.product.id
          );

        if (!currentProduct) {
          setError(
            `${item.product.name} is no longer available.`
          );

          return;
        }

        if (
          currentProduct.stock_quantity <
          item.quantity
        ) {
          setError(
            `The selected quantity of ${item.product.name} is no longer available.`
          );

          return;
        }
      }

      // ========================================================
      // PREPARE ORDER ITEMS
      // ========================================================

      const items = cart.map((item) => ({
        product_id:
          item.product.id,

        product_name:
          item.product.name,

        quantity:
          item.quantity,

        unit_price:
          Number(item.product.price),

        total:
          Number(item.product.price) *
          item.quantity,
      }));

      const paymentMethodValue =
        paymentMethod;

      let finalNotes =
        notes.trim();

      if (
        paymentMethod === "whish"
      ) {
        const whishText =
          `Whish transaction/reference: ${whishReference.trim()}`;

        finalNotes = finalNotes
          ? `${finalNotes}\n${whishText}`
          : whishText;
      }

      if (
        paymentMethod ===
        "cash_at_store"
      ) {
        const pickupText =
          "Customer will collect the order at the store and pay cash.";

        finalNotes = finalNotes
          ? `${finalNotes}\n${pickupText}`
          : pickupText;
      }

      const finalAddress =
        paymentMethod ===
        "cash_at_store"
          ? customerAddress.trim() ||
            null
          : customerAddress.trim();

      // ========================================================
      // CREATE ORDER
      // ========================================================

      const {
        data,
        error: orderError,
      } = await supabase.rpc(
        "create_cosmetics_order",
        {
          p_customer_name:
            customerName.trim(),

          p_customer_phone:
            customerPhone.trim(),

          p_customer_city:
            customerCity.trim(),

          p_customer_address:
            finalAddress,

          p_notes:
            finalNotes || null,

          p_payment_method:
            paymentMethodValue,

          p_subtotal:
            subtotal,

          p_delivery_fee:
            deliveryFee,

          p_total:
            total,

          p_items:
            items,
        }
      );

      // ========================================================
      // ORDER CREATION FAILED
      // ========================================================

      if (orderError) {
        console.error(
          "Create order error:",
          orderError
        );

        throw new Error(
          orderError.message ||
            "Unable to create order."
        );
      }

      console.log(
        "Order created:",
        data
      );

      // ========================================================
      // GET CREATED ORDER ID
      // ========================================================

      let createdOrderId = "";

      if (
        typeof data === "string"
      ) {
        createdOrderId = data;
      } else if (
        Array.isArray(data)
      ) {
        const firstRow = data[0];

        if (
          firstRow &&
          typeof firstRow ===
            "object" &&
          "id" in firstRow
        ) {
          createdOrderId =
            String(
              (
                firstRow as {
                  id: unknown;
                }
              ).id
            );
        }

        if (
          !createdOrderId &&
          firstRow &&
          typeof firstRow ===
            "object" &&
          "order_id" in firstRow
        ) {
          createdOrderId =
            String(
              (
                firstRow as {
                  order_id: unknown;
                }
              ).order_id
            );
        }
      } else if (
        data &&
        typeof data ===
          "object"
      ) {
        if ("id" in data) {
          createdOrderId =
            String(
              (
                data as {
                  id: unknown;
                }
              ).id
            );
        } else if (
          "order_id" in data
        ) {
          createdOrderId =
            String(
              (
                data as {
                  order_id: unknown;
                }
              ).order_id
            );
        }
      }

      console.log(
        "Created order ID:",
        createdOrderId
      );

      // ========================================================
      // SEND PUSH NOTIFICATION
      // ========================================================
      //
      // IMPORTANT:
      // The order has already been created.
      // If push notification fails, the order
      // remains successful.
      // ========================================================

      try {
        const {
          data: notificationData,
          error: notificationError,
        } = await supabase.functions.invoke(
          "send-order-notification",
          {
            body: {
              customerName:
                customerName.trim(),

              orderId:
                createdOrderId,
            },
          }
        );

        if (notificationError) {
          console.error(
            "Push notification error:",
            notificationError
          );
        } else {
          console.log(
            "Order notification sent:",
            notificationData
          );
        }
      } catch (
        notificationError
      ) {
        console.error(
          "Push notification failed:",
          notificationError
        );
      }

      // ========================================================
      // CLEAR CART / CHECKOUT
      // ========================================================

      setCart([]);
      setCheckoutOpen(false);
      setCartOpen(false);

      setCustomerName("");
      setCustomerPhone("");
      setCustomerCity("");
      setCustomerAddress("");
      setNotes("");
      setWhishReference("");

      setPaymentMethod(
        "cash_on_delivery"
      );

      // ========================================================
      // SUCCESS
      // ========================================================

      setSuccess(
        "Your order has been placed successfully!"
      );

      // ========================================================
      // REFRESH PRODUCTS
      // ========================================================

      await loadProducts();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error(
        "Order failed:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to place your order."
      );
    } finally {
      setPlacingOrder(false);
    }
  }

  // ============================================================
  // FORMAT PRICE
  // ============================================================

  function formatPrice(
    value: number
  ) {
    return `$${Number(value).toFixed(
      2
    )}`;
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fbf8f7] px-5 py-12 text-[#342d2f]">
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center">
          <div className="text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#f5dfe4] text-2xl shadow-sm">
              🛍️
            </div>

            <p className="mt-5 text-sm font-extrabold">
              Loading Ward Cosmetics
            </p>

            <p className="mt-1 text-xs text-[#887c80]">
              Preparing the shop...
            </p>

            <div className="mx-auto mt-5 h-1.5 w-24 overflow-hidden rounded-full bg-[#dfeeda]">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-[#b96070]" />
            </div>

          </div>
        </div>
      </main>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <main className="min-h-screen bg-[#fbf8f7] text-[#342d2f]">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="sticky top-0 z-40 border-b border-[#eadfe0] bg-[#fbf8f7]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

          <div>

            <div className="inline-flex items-center gap-2 rounded-full bg-[#f5dfe4] px-3 py-1.5">

              <span className="h-1.5 w-1.5 rounded-full bg-[#b45b6c]" />

              <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#9d4f60]">
                Ward Cosmetics
              </span>

            </div>

            <h1 className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">
              Shop
            </h1>

          </div>

          {/* CART */}

          <button
            type="button"
            onClick={() => {
              setError("");
              setCartOpen(true);
            }}
            className="relative flex h-12 items-center gap-2 rounded-2xl bg-[#b96070] px-4 text-sm font-extrabold text-white shadow-[0_8px_25px_rgba(185,96,112,0.20)] transition hover:-translate-y-0.5 hover:bg-[#a95263]"
          >

            <span className="text-base">
              🛒
            </span>

            <span className="hidden sm:inline">
              Cart
            </span>

            {cartCount > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-[10px] font-extrabold text-[#a95263]">
                {cartCount}
              </span>
            )}

          </button>

        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-9 lg:px-8">

        {/* SUCCESS */}

        {success && (
          <div className="mb-6 rounded-[24px] border border-[#cfe0c9] bg-[#f1f8ef] p-5">

            <div className="flex items-start gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#dfeeda] font-extrabold text-[#55704d]">
                ✓
              </div>

              <div>

                <p className="text-sm font-extrabold text-[#55704d]">
                  Order placed
                </p>

                <p className="mt-1 text-xs leading-5 text-[#71806d]">
                  {success}
                </p>

              </div>

            </div>

          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-[24px] border border-[#ecd0d5] bg-[#fdf0f2] p-5">

            <div className="flex items-start gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f5dfe4] font-extrabold text-[#a85566]">
                !
              </div>

              <div>

                <p className="text-sm font-extrabold text-[#9d4f60]">
                  Something went wrong
                </p>

                <p className="mt-1 text-xs leading-5 text-[#a76c76]">
                  {error}
                </p>

              </div>

            </div>

          </div>
        )}

        {/* HERO */}

        <section className="relative overflow-hidden rounded-[32px] border border-[#eadfe0] bg-white p-6 shadow-[0_15px_50px_rgba(82,57,61,0.06)] sm:p-8">

          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#f5dfe4]/70 blur-2xl" />

          <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#dfeeda]/60 blur-2xl" />

          <div className="relative max-w-2xl">

            <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#a85566]">
              Beauty & cosmetics
            </span>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#342d2f] sm:text-4xl">
              Find something you'll love.
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[#887c80]">
              Browse our products, find your favorites,
              and place your order directly through Ward
              Cosmetics.
            </p>

          </div>

        </section>

        {/* SEARCH / FILTERS */}

        <section className="mt-6 rounded-[28px] border border-[#eadfe0] bg-white p-4 shadow-[0_10px_35px_rgba(82,57,61,0.05)] sm:p-5">

          <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">

            {/* SEARCH */}

            <div className="relative">

              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-[#9d9194]">
                ⌕
              </span>

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search products, brands or barcode..."
                className="w-full rounded-[18px] border border-[#e7dddd] bg-[#fdfafa] py-3.5 pl-11 pr-4 text-sm font-medium outline-none transition placeholder:text-[#aaa0a2] focus:border-[#d49aa5] focus:bg-white focus:ring-4 focus:ring-[#f5dfe4]"
              />

            </div>

            {/* CATEGORY */}

            <select
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value
                )
              }
              className="rounded-[18px] border border-[#e7dddd] bg-[#fdfafa] px-4 py-3.5 text-sm font-semibold text-[#4d4245] outline-none focus:border-[#d49aa5] focus:ring-4 focus:ring-[#f5dfe4]"
            >

              <option value="all">
                All brands
              </option>

              {categories.map(
                (brand) => (
                  <option
                    key={brand}
                    value={brand}
                  >
                    {brand}
                  </option>
                )
              )}

            </select>

            {/* SORT */}

            <select
              value={sort}
              onChange={(event) =>
                setSort(
                  event.target.value
                )
              }
              className="rounded-[18px] border border-[#e7dddd] bg-[#fdfafa] px-4 py-3.5 text-sm font-semibold text-[#4d4245] outline-none focus:border-[#d49aa5] focus:ring-4 focus:ring-[#f5dfe4]"
            >

              <option value="featured">
                Newest
              </option>

              <option value="price_low">
                Price: Low to High
              </option>

              <option value="price_high">
                Price: High to Low
              </option>

              <option value="name_az">
                Name: A to Z
              </option>

              <option value="name_za">
                Name: Z to A
              </option>

              <option value="in_stock">
                In Stock First
              </option>

              <option value="out_of_stock">
                Out of Stock First
              </option>

              <option value="stock">
                Most Available
              </option>

            </select>

          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">

            <p className="text-xs font-semibold text-[#887c80]">

              Showing{" "}

              <span className="font-extrabold text-[#5c4f53]">
                {displayedProducts.length}
              </span>{" "}

              of{" "}

              <span className="font-extrabold text-[#5c4f53]">
                {products.length}
              </span>{" "}

              products

            </p>

            {(search ||
              category !== "all" ||
              sort !== "featured") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                  setSort(
                    "featured"
                  );
                }}
                className="text-xs font-extrabold text-[#a85566] hover:underline"
              >
                Clear filters
              </button>
            )}

          </div>

        </section>

        {/* PRODUCTS */}

        {displayedProducts.length ===
        0 ? (
          <section className="mt-6 rounded-[28px] border border-[#eadfe0] bg-white p-10 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#f5dfe4] text-2xl">
              🔍
            </div>

            <h3 className="mt-5 text-lg font-extrabold">
              No products found
            </h3>

            <p className="mt-2 text-sm text-[#887c80]">
              Try a different search or
              filter.
            </p>

          </section>
        ) : (
          <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">

            {displayedProducts.map(
              (product) => {
                const outOfStock =
                  product.stock_quantity <=
                  0;

                const cartItem =
                  cart.find(
                    (item) =>
                      item.product.id ===
                      product.id
                  );

                return (
                  <article
                    key={product.id}
                    onClick={() =>
                      setSelectedProduct(
                        product
                      )
                    }
                    className="group cursor-pointer overflow-hidden rounded-[22px] border border-[#eadfe0] bg-white shadow-[0_8px_30px_rgba(82,57,61,0.05)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(82,57,61,0.09)] sm:rounded-[28px]"
                  >

                    {/* IMAGE */}

                    <div className="relative aspect-square overflow-hidden bg-[#f7f3f2]">

                      {product.image_url ? (
                        <img
                          src={
                            product.image_url
                          }
                          alt={
                            product.name
                          }
                          className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${
                            outOfStock
                              ? "opacity-55 grayscale-[20%]"
                              : ""
                          }`}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="text-4xl opacity-40 sm:text-5xl">
                            🛍️
                          </span>
                        </div>
                      )}

                      {/* STOCK STATUS */}

                      <div className="absolute left-2 top-2 sm:left-3 sm:top-3">

                        {outOfStock ? (
                          <span className="rounded-full bg-[#342d2f]/90 px-2 py-1 text-[7px] font-extrabold uppercase tracking-wide text-white sm:px-3 sm:py-1.5 sm:text-[9px]">
                            Out of stock
                          </span>
                        ) : product.stock_quantity <=
                          5 ? (
                          <span className="rounded-full bg-[#fff1d9] px-2 py-1 text-[7px] font-extrabold uppercase tracking-wide text-[#9a6a27] sm:px-3 sm:py-1.5 sm:text-[9px]">
                            Limited stock
                          </span>
                        ) : (
                          <span className="rounded-full bg-[#e9f4e6] px-2 py-1 text-[7px] font-extrabold uppercase tracking-wide text-[#55704d] sm:px-3 sm:py-1.5 sm:text-[9px]">
                            In stock
                          </span>
                        )}

                      </div>

                      {/* CART QUANTITY */}

                      {cartItem && (
                        <div className="absolute right-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-[#b96070] px-2 text-[9px] font-extrabold text-white shadow-md sm:right-3 sm:top-3 sm:h-8 sm:min-w-8">
                          {cartItem.quantity}
                        </div>
                      )}

                    </div>

                    {/* CONTENT */}

                    <div className="p-3 sm:p-5">

                      {product.brand && (
                        <p className="truncate text-[8px] font-extrabold uppercase tracking-[0.14em] text-[#a85566] sm:text-[9px]">
                          {product.brand}
                        </p>
                      )}

                      <h3 className="mt-1.5 line-clamp-2 min-h-[38px] text-xs font-extrabold leading-4 text-[#3b3335] sm:min-h-[44px] sm:text-sm sm:leading-5">
                        {product.name}
                      </h3>

                      <div className="mt-3 flex flex-col gap-3 sm:mt-4 sm:flex-row sm:items-end sm:justify-between">

                        <div>

                          <p className="text-base font-extrabold text-[#a85566] sm:text-lg">
                            {formatPrice(
                              product.price
                            )}
                          </p>

                        </div>

                        <button
                          type="button"
                          disabled={
                            outOfStock
                          }
                          onClick={(
                            event
                          ) => {
                            event.stopPropagation();

                            addToCart(
                              product
                            );
                          }}
                          className={`flex h-10 w-full items-center justify-center rounded-xl px-2 text-[10px] font-extrabold transition sm:h-11 sm:w-auto sm:rounded-2xl sm:px-4 sm:text-xs ${
                            outOfStock
                              ? "cursor-not-allowed bg-[#eee9e9] text-[#aaa0a2]"
                              : "bg-[#b96070] text-white shadow-[0_7px_18px_rgba(185,96,112,0.18)] hover:-translate-y-0.5 hover:bg-[#a95263]"
                          }`}
                        >
                          {outOfStock
                            ? "Unavailable"
                            : cartItem
                            ? "Add another"
                            : "Add to cart"}
                        </button>

                      </div>

                      <p className="mt-3 text-center text-[9px] font-semibold text-[#b0a5a7]">
                        Tap to view product
                        details
                      </p>

                    </div>

                  </article>
                );
              }
            )}

          </section>
        )}

        {/* FOOTER */}

        <footer className="py-12 text-center">

          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#9b8e91]">
            Ward Cosmetics
          </p>

          <p className="mt-1 text-[10px] text-[#b0a5a7]">
            Beauty • Care • Confidence
          </p>

        </footer>

      </div>

      {/* ======================================================
          PRODUCT DETAILS MODAL
      ====================================================== */}

      {selectedProduct && (
        <div
          className="fixed inset-0 z-[120] overflow-y-auto bg-[#29302b]/40 px-4 py-6 backdrop-blur-[5px] sm:px-6"
          onClick={() =>
            setSelectedProduct(null)
          }
        >

          <div className="flex min-h-full items-center justify-center">

            <div
              className="relative w-full max-w-2xl overflow-hidden rounded-[30px] border border-[#eadfe0] bg-[#fbf8f7] shadow-[0_25px_80px_rgba(60,50,53,0.25)]"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              {/* CLOSE */}

              <button
                type="button"
                onClick={() =>
                  setSelectedProduct(null)
                }
                className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-xl font-medium text-[#705f63] shadow-md backdrop-blur transition hover:bg-[#f5dfe4]"
                aria-label="Close product details"
              >
                ×
              </button>

              {/* IMAGE */}

              <div className="relative aspect-square w-full bg-[#f7f3f2] sm:aspect-[4/3]">

                {selectedProduct.image_url ? (
                  <img
                    src={
                      selectedProduct.image_url
                    }
                    alt={
                      selectedProduct.name
                    }
                    className={`h-full w-full object-cover ${
                      selectedProduct.stock_quantity <=
                      0
                        ? "opacity-60"
                        : ""
                    }`}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-7xl opacity-30">
                      🛍️
                    </span>
                  </div>
                )}

                {/* STOCK */}

                <div className="absolute left-4 top-4">

                  {selectedProduct.stock_quantity <=
                  0 ? (
                    <span className="rounded-full bg-[#342d2f]/90 px-4 py-2 text-[9px] font-extrabold uppercase tracking-[0.12em] text-white">
                      Out of stock
                    </span>
                  ) : selectedProduct.stock_quantity <=
                    5 ? (
                    <span className="rounded-full bg-[#fff1d9] px-4 py-2 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#9a6a27]">
                      Limited stock
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#e9f4e6] px-4 py-2 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#55704d]">
                      In stock
                    </span>
                  )}

                </div>

              </div>

              {/* INFORMATION */}

              <div className="p-5 sm:p-7">

                {selectedProduct.brand && (
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#a85566]">
                    {selectedProduct.brand}
                  </p>
                )}

                <h2 className="mt-2 pr-8 text-2xl font-extrabold tracking-tight text-[#342d2f] sm:text-3xl">
                  {selectedProduct.name}
                </h2>

                <p className="mt-3 text-2xl font-extrabold text-[#a85566]">
                  {formatPrice(
                    selectedProduct.price
                  )}
                </p>

                {/* DESCRIPTION */}

                {selectedProduct.description?.trim() && (
                  <div className="mt-6 rounded-[20px] border border-[#eadfe0] bg-white p-4">

                    <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#9b8e91]">
                      Description
                    </p>

                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#665b5e]">
                      {
                        selectedProduct.description
                      }
                    </p>

                  </div>
                )}

                {/* INFORMATION GRID */}

                <div className="mt-6 grid gap-3 sm:grid-cols-2">

                  {/* AVAILABILITY */}

                  <div className="rounded-[20px] border border-[#dce7de] bg-[#f3f8f1] p-4">

                    <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#71806d]">
                      Availability
                    </p>

                    <p className="mt-1 text-sm font-extrabold text-[#55704d]">
                      {selectedProduct.stock_quantity >
                      0
                        ? "Available"
                        : "Currently unavailable"}
                    </p>

                  </div>

                  {/* PRODUCT CODE */}

                  <div className="rounded-[20px] border border-[#eadfe0] bg-white p-4">

                    <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#9b8e91]">
                      Product code
                    </p>

                    <p className="mt-1 break-all text-sm font-extrabold text-[#4d4245]">
                      {selectedProduct.barcode ||
                        "Not available"}
                    </p>

                  </div>

                </div>

                {/* PRODUCT INFORMATION */}

                <div className="mt-3 rounded-[20px] border border-[#eadfe0] bg-white p-4">

                  <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#9b8e91]">
                    Product information
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#887c80]">
                    This product is available
                    through Ward Cosmetics.
                    Add it to your cart to
                    include it in your order.
                  </p>

                </div>

                {/* ACTIONS */}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                  <button
                    type="button"
                    disabled={
                      selectedProduct.stock_quantity <=
                      0
                    }
                    onClick={() => {
                      addToCart(
                        selectedProduct
                      );

                      setSelectedProduct(
                        null
                      );
                    }}
                    className={`flex-1 rounded-[19px] px-5 py-4 text-sm font-extrabold transition ${
                      selectedProduct.stock_quantity <=
                      0
                        ? "cursor-not-allowed bg-[#eee9e9] text-[#aaa0a2]"
                        : "bg-[#b96070] text-white shadow-[0_10px_25px_rgba(185,96,112,0.20)] hover:-translate-y-0.5 hover:bg-[#a95263]"
                    }`}
                  >
                    {selectedProduct.stock_quantity <=
                    0
                      ? "Out of stock"
                      : "Add to cart"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedProduct(
                        null
                      )
                    }
                    className="rounded-[19px] border border-[#e7dddd] bg-white px-5 py-4 text-sm font-extrabold text-[#665b5e] transition hover:bg-[#f7f3f2]"
                  >
                    Continue shopping
                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* ======================================================
          CART DRAWER
      ====================================================== */}

      {cartOpen && (
        <div
          className="fixed inset-0 z-[100] bg-[#29302b]/30 backdrop-blur-[3px]"
          onClick={() =>
            setCartOpen(false)
          }
        >

          <aside
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[#fbf8f7] shadow-[-15px_0_50px_rgba(60,70,62,0.14)]"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* CART HEADER */}

            <div className="flex items-center justify-between border-b border-[#eadfe0] px-5 py-5">

              <div>

                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#a85566]">
                  Your selection
                </p>

                <h2 className="mt-1 text-xl font-extrabold">
                  Shopping cart
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setCartOpen(false)
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl text-[#705f63] shadow-sm"
              >
                ×
              </button>

            </div>

            {/* CART CONTENT */}

            <div className="flex-1 overflow-y-auto px-5 py-5">

              {cart.length === 0 ? (
                <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">

                  <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#f5dfe4] text-2xl">
                    🛒
                  </div>

                  <h3 className="mt-5 text-lg font-extrabold">
                    Your cart is empty
                  </h3>

                  <p className="mt-2 max-w-xs text-xs leading-5 text-[#887c80]">
                    Add some products to get
                    started.
                  </p>

                </div>
              ) : (
                <div className="space-y-3">

                  {cart.map(
                    (item) => (
                      <div
                        key={
                          item.product.id
                        }
                        className="rounded-[22px] border border-[#eadfe0] bg-white p-3"
                      >

                        <div className="flex gap-3">

                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[16px] bg-[#f7f3f2]">

                            {item.product.image_url ? (
                              <img
                                src={
                                  item
                                    .product
                                    .image_url
                                }
                                alt={
                                  item
                                    .product
                                    .name
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xl">
                                🛍️
                              </div>
                            )}

                          </div>

                          <div className="min-w-0 flex-1">

                            {item.product.brand && (
                              <p className="text-[8px] font-extrabold uppercase tracking-wide text-[#a85566]">
                                {
                                  item
                                    .product
                                    .brand
                                }
                              </p>
                            )}

                            <p className="mt-1 line-clamp-2 text-xs font-extrabold leading-5">
                              {
                                item
                                  .product
                                  .name
                              }
                            </p>

                            <p className="mt-1 text-sm font-extrabold text-[#a85566]">
                              {formatPrice(
                                item
                                  .product
                                  .price
                              )}
                            </p>

                            <div className="mt-2 flex items-center justify-between">

                              <div className="flex items-center rounded-xl bg-[#f7f3f2] p-1">

                                <button
                                  type="button"
                                  onClick={() =>
                                    decreaseQuantity(
                                      item
                                        .product
                                        .id
                                    )
                                  }
                                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-sm font-extrabold shadow-sm"
                                >
                                  −
                                </button>

                                <span className="w-8 text-center text-xs font-extrabold">
                                  {
                                    item.quantity
                                  }
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    increaseQuantity(
                                      item
                                        .product
                                        .id
                                    )
                                  }
                                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-sm font-extrabold shadow-sm"
                                >
                                  +
                                </button>

                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeFromCart(
                                    item
                                      .product
                                      .id
                                  )
                                }
                                className="text-[10px] font-extrabold text-[#a85566] hover:underline"
                              >
                                Remove
                              </button>

                            </div>

                          </div>

                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

            </div>

            {/* CART FOOTER */}

            {cart.length > 0 && (
              <div className="border-t border-[#eadfe0] bg-white p-5">

                <div className="space-y-2 text-xs">

                  <div className="flex justify-between text-[#887c80]">

                    <span>
                      Subtotal
                    </span>

                    <span className="font-bold text-[#4d4245]">
                      {formatPrice(
                        subtotal
                      )}
                    </span>

                  </div>

                  <div className="flex justify-between text-[#887c80]">

                    <span>
                      Delivery
                    </span>

                    <span className="font-bold text-[#4d4245]">
                      {formatPrice(
                        deliveryFee
                      )}
                    </span>

                  </div>

                  <div className="my-3 border-t border-[#eee6e7]" />

                  <div className="flex justify-between">

                    <span className="text-sm font-extrabold">
                      Total
                    </span>

                    <span className="text-lg font-extrabold text-[#a85566]">
                      {formatPrice(
                        total
                      )}
                    </span>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={
                    openCheckout
                  }
                  className="mt-5 w-full rounded-[18px] bg-[#b96070] px-4 py-4 text-sm font-extrabold text-white shadow-[0_10px_25px_rgba(185,96,112,0.20)] transition hover:bg-[#a95263]"
                >
                  Continue to checkout →
                </button>

              </div>
            )}

          </aside>

        </div>
      )}

      {/* ======================================================
          CHECKOUT MODAL
      ====================================================== */}

      {checkoutOpen && (
        <div
          className="fixed inset-0 z-[110] overflow-y-auto bg-[#29302b]/35 px-4 py-6 backdrop-blur-[4px] sm:px-6"
          onClick={() => {
            if (!placingOrder) {
              setCheckoutOpen(false);
            }
          }}
        >

          <div className="flex min-h-full items-center justify-center">

            <div
              className="w-full max-w-2xl overflow-hidden rounded-[30px] border border-[#eadfe0] bg-[#fbf8f7] shadow-[0_25px_80px_rgba(60,50,53,0.20)]"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              {/* CHECKOUT HEADER */}

              <div className="border-b border-[#eadfe0] bg-white px-5 py-5 sm:px-7">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#a85566]">
                      Almost there
                    </p>

                    <h2 className="mt-1 text-xl font-extrabold">
                      Checkout
                    </h2>

                  </div>

                  <button
                    type="button"
                    disabled={
                      placingOrder
                    }
                    onClick={() =>
                      setCheckoutOpen(
                        false
                      )
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f7f3f2] text-xl text-[#705f63]"
                  >
                    ×
                  </button>

                </div>

              </div>

              {/* CHECKOUT BODY */}

              <form
                onSubmit={placeOrder}
                className="space-y-6 p-5 sm:p-7"
              >

                {/* CUSTOMER INFORMATION */}

                <section>

                  <div className="mb-4">

                    <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#a85566]">
                      Customer information
                    </p>

                    <h3 className="mt-1 text-base font-extrabold">
                      {paymentMethod ===
                      "cash_at_store"
                        ? "Your information"
                        : "Where should we deliver?"}
                    </h3>

                    {paymentMethod ===
                      "cash_at_store" && (
                      <p className="mt-1 text-xs leading-5 text-[#887c80]">
                        You will collect your
                        order from the store and
                        pay cash.
                      </p>
                    )}

                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">

                    <CheckoutInput
                      label="Full name"
                      value={
                        customerName
                      }
                      onChange={
                        setCustomerName
                      }
                      placeholder="Your name"
                    />

                    <CheckoutInput
                      label="Phone number"
                      value={
                        customerPhone
                      }
                      onChange={
                        setCustomerPhone
                      }
                      placeholder="Your phone number"
                      type="tel"
                    />

                    <CheckoutInput
                      label="City"
                      value={
                        customerCity
                      }
                      onChange={
                        setCustomerCity
                      }
                      placeholder="Your city"
                    />

                    <CheckoutInput
                      label={
                        paymentMethod ===
                        "cash_at_store"
                          ? "Address (optional)"
                          : "Delivery address"
                      }
                      value={
                        customerAddress
                      }
                      onChange={
                        setCustomerAddress
                      }
                      placeholder={
                        paymentMethod ===
                        "cash_at_store"
                          ? "Optional"
                          : "Street / area / building"
                      }
                    />

                  </div>

                </section>

                {/* PAYMENT */}

                <section>

                  <div className="mb-4">

                    <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#a85566]">
                      Payment
                    </p>

                    <h3 className="mt-1 text-base font-extrabold">
                      Choose how you'd like to
                      pay
                    </h3>

                  </div>

                  <div className="space-y-3">

                    <PaymentOption
                      selected={
                        paymentMethod ===
                        "cash_on_delivery"
                      }
                      onClick={() =>
                        changePaymentMethod(
                          "cash_on_delivery"
                        )
                      }
                      title="Cash on Delivery"
                      description="Pay the delivery driver when your order arrives. $2 delivery fee."
                      icon="💵"
                    />

                    <PaymentOption
                      selected={
                        paymentMethod ===
                        "whish"
                      }
                      onClick={() =>
                        changePaymentMethod(
                          "whish"
                        )
                      }
                      title="Whish"
                      description={`Send the payment to ${WHISH_NAME} — ${WHISH_PHONE}. $2 delivery fee.`}
                      icon="📱"
                    />

                    <PaymentOption
                      selected={
                        paymentMethod ===
                        "cash_at_store"
                      }
                      onClick={() =>
                        changePaymentMethod(
                          "cash_at_store"
                        )
                      }
                      title="Cash at Store"
                      description="Collect your order from the store and pay cash. No delivery fee."
                      icon="🏪"
                    />

                  </div>

                  {/* WHISH */}

                  {paymentMethod ===
                    "whish" && (
                    <div className="mt-4 rounded-[22px] border border-[#e8d2d7] bg-[#fff5f6] p-4">

                      <p className="text-xs font-extrabold text-[#9d4f60]">
                        Whish payment instructions
                      </p>

                      <div className="mt-3 rounded-[16px] bg-white p-4">

                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9b8e91]">
                          Send payment to
                        </p>

                        <p className="mt-1 text-sm font-extrabold text-[#342d2f]">
                          {WHISH_NAME}
                        </p>

                        <p className="mt-0.5 text-base font-extrabold text-[#a85566]">
                          {WHISH_PHONE}
                        </p>

                        <p className="mt-3 text-xs leading-5 text-[#806d70]">
                          Send{" "}
                          <strong>
                            {formatPrice(
                              total
                            )}
                          </strong>{" "}
                          through Whish, then enter
                          your transaction/reference
                          number below.
                        </p>

                      </div>

                      <div className="mt-4">

                        <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#665b5e]">
                          Whish transaction/reference
                          number
                        </label>

                        <input
                          type="text"
                          value={
                            whishReference
                          }
                          onChange={(
                            event
                          ) =>
                            setWhishReference(
                              event.target
                                .value
                            )
                          }
                          placeholder="Enter transaction number"
                          className="w-full rounded-[17px] border border-[#e7dddd] bg-white px-4 py-3.5 text-sm font-medium outline-none placeholder:text-[#aaa0a2] focus:border-[#d49aa5] focus:ring-4 focus:ring-[#f5dfe4]"
                        />

                      </div>

                    </div>
                  )}

                </section>

                {/* NOTES */}

                <section>

                  <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#665b5e]">
                    Notes{" "}
                    <span className="font-medium text-[#aaa0a2]">
                      (optional)
                    </span>
                  </label>

                  <textarea
                    value={notes}
                    onChange={(event) =>
                      setNotes(
                        event.target.value
                      )
                    }
                    rows={3}
                    placeholder="Anything we should know about your order?"
                    className="w-full resize-none rounded-[18px] border border-[#e7dddd] bg-white px-4 py-3.5 text-sm font-medium outline-none placeholder:text-[#aaa0a2] focus:border-[#d49aa5] focus:ring-4 focus:ring-[#f5dfe4]"
                  />

                </section>

                {/* ORDER SUMMARY */}

                <section className="rounded-[24px] border border-[#dce7de] bg-[#f3f8f1] p-5">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#55704d]">
                        Order summary
                      </p>

                      <p className="mt-1 text-xs text-[#71806d]">
                        {cartCount}{" "}
                        {cartCount === 1
                          ? "item"
                          : "items"}
                      </p>

                    </div>

                    <p className="text-xl font-extrabold text-[#55704d]">
                      {formatPrice(
                        total
                      )}
                    </p>

                  </div>

                  <div className="mt-4 space-y-2 border-t border-[#dce7de] pt-4 text-xs">

                    <div className="flex justify-between text-[#71806d]">

                      <span>
                        Subtotal
                      </span>

                      <span className="font-bold">
                        {formatPrice(
                          subtotal
                        )}
                      </span>

                    </div>

                    <div className="flex justify-between text-[#71806d]">

                      <span>
                        {paymentMethod ===
                        "cash_at_store"
                          ? "Store pickup"
                          : "Delivery"}
                      </span>

                      <span className="font-bold">
                        {paymentMethod ===
                        "cash_at_store"
                          ? "$0.00"
                          : formatPrice(
                              deliveryFee
                            )}
                      </span>

                    </div>

                    <div className="flex justify-between pt-2 text-sm font-extrabold text-[#55704d]">

                      <span>
                        Total
                      </span>

                      <span>
                        {formatPrice(
                          total
                        )}
                      </span>

                    </div>

                  </div>

                </section>

                {/* FORM ERROR */}

                {error && (
                  <div className="rounded-[18px] border border-[#ecd0d5] bg-[#fdf0f2] px-4 py-3">

                    <p className="text-xs font-extrabold text-[#9d4f60]">
                      {error}
                    </p>

                  </div>
                )}

                {/* SUBMIT */}

                <button
                  type="submit"
                  disabled={
                    placingOrder
                  }
                  className="w-full rounded-[19px] bg-[#b96070] px-4 py-4 text-sm font-extrabold text-white shadow-[0_10px_25px_rgba(185,96,112,0.20)] transition hover:-translate-y-0.5 hover:bg-[#a95263] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {placingOrder ? (
                    <span className="flex items-center justify-center gap-2">

                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                      Placing order...

                    </span>
                  ) : (
                    `Place order • ${formatPrice(
                      total
                    )}`
                  )}
                </button>

                <p className="text-center text-[10px] leading-4 text-[#9b8e91]">
                  By placing your order, you confirm
                  that the information provided is
                  correct.
                </p>

              </form>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}

// ============================================================
// CHECKOUT INPUT
// ============================================================

function CheckoutInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>

      <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#665b5e]">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        className="w-full rounded-[17px] border border-[#e7dddd] bg-white px-4 py-3.5 text-sm font-medium text-[#3b3335] outline-none placeholder:text-[#aaa0a2] focus:border-[#d49aa5] focus:ring-4 focus:ring-[#f5dfe4]"
      />

    </div>
  );
}

// ============================================================
// PAYMENT OPTION
// ============================================================

function PaymentOption({
  selected,
  onClick,
  title,
  description,
  icon,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-[20px] border p-4 text-left transition ${
        selected
          ? "border-[#d49aa5] bg-[#fff5f6] shadow-[0_5px_18px_rgba(155,102,112,0.07)]"
          : "border-[#e7dddd] bg-white hover:border-[#d9c6c9]"
      }`}
    >

      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg ${
          selected
            ? "bg-[#f5dfe4]"
            : "bg-[#f3f8f1]"
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">

        <p
          className={`text-sm font-extrabold ${
            selected
              ? "text-[#9d4f60]"
              : "text-[#3b3335]"
          }`}
        >
          {title}
        </p>

        <p className="mt-0.5 text-[10px] leading-4 text-[#887c80]">
          {description}
        </p>

      </div>

      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          selected
            ? "border-[#b96070] bg-[#b96070] text-[10px] text-white"
            : "border-[#d9cdcf]"
        }`}
      >
        {selected && "✓"}
      </div>

    </button>
  );
}