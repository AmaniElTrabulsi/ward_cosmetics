"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type OrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
};

type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_city: string | null;
  customer_address: string | null;
  notes: string | null;
  payment_method: string | null;
  payment_status: string | null;
  order_status:
    | "new"
    | "confirmed"
    | "preparing"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";
  subtotal: number;
  delivery_fee: number;
  total: number;
  created_at: string;
  items: OrderItem[];
};

type Filter =
  | "all"
  | "new"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-[#fcecef] text-[#a34f61]",
  confirmed: "bg-[#edf3e9] text-[#55704d]",
  preparing: "bg-[#fff3df] text-[#9a6b32]",
  out_for_delivery: "bg-[#e9f0f8] text-[#54708f]",
  delivered: "bg-[#e5f1e5] text-[#4d724d]",
  cancelled: "bg-[#eee9e9] text-[#777070]",
};

const NEXT_STATUS: Record<string, string | null> = {
  new: "confirmed",
  confirmed: "preparing",
  preparing: "out_for_delivery",
  out_for_delivery: "delivered",
  delivered: null,
  cancelled: null,
};

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState<Filter>("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(
    null
  );

  const [updatingOrder, setUpdatingOrder] = useState<string | null>(
    null
  );

  const [employeeName, setEmployeeName] = useState("");

  /* =========================================================
     EMPLOYEE CHECK
  ========================================================= */

  useEffect(() => {
    const employeeData = localStorage.getItem("employee");

    if (!employeeData) {
      router.replace("/employee-login");
      return;
    }

    try {
      const employee = JSON.parse(employeeData);

      setEmployeeName(employee.name || "Employee");
    } catch {
      localStorage.removeItem("employee");
      router.replace("/employee-login");
    }
  }, [router]);

  /* =========================================================
     LOAD ORDERS
  ========================================================= */

  const loadOrders = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const { data, error: ordersError } =
          await supabase.rpc("get_employee_orders");

        if (ordersError) {
          console.error("Load orders error:", ordersError);
          setError(ordersError.message);
          return;
        }

        const formattedOrders: Order[] = (data || []).map(
          (order: any) => ({
            ...order,

            subtotal: Number(order.subtotal || 0),
            delivery_fee: Number(order.delivery_fee || 0),
            total: Number(order.total || 0),

            items: Array.isArray(order.items)
              ? order.items.map((item: any) => ({
                  ...item,
                  quantity: Number(item.quantity || 0),
                  unit_price: Number(item.unit_price || 0),
                  total: Number(item.total || 0),
                }))
              : [],
          })
        );

        setOrders(formattedOrders);
      } catch (err) {
        console.error(err);

        setError(
          "Something went wrong while loading the orders."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  /* =========================================================
     UPDATE STATUS
  ========================================================= */

  async function updateStatus(
    orderId: string,
    status: string
  ) {
    setUpdatingOrder(orderId);
    setError("");

    try {
      const { error: updateError } =
        await supabase.rpc("update_order_status", {
          p_order_id: orderId,
          p_status: status,
        });

      if (updateError) {
        console.error(
          "Update order status error:",
          updateError
        );

        setError(updateError.message);
        return;
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                order_status: status as Order["order_status"],
              }
            : order
        )
      );
    } catch (err) {
      console.error(err);

      setError(
        "Unable to update the order status."
      );
    } finally {
      setUpdatingOrder(null);
    }
  }

  /* =========================================================
     FILTERED ORDERS
  ========================================================= */

  const filteredOrders = useMemo(() => {
    if (filter === "all") {
      return orders;
    }

    return orders.filter(
      (order) => order.order_status === filter
    );
  }, [orders, filter]);

  /* =========================================================
     COUNTS
  ========================================================= */

  const counts = useMemo(() => {
    return {
      all: orders.length,

      new: orders.filter(
        (order) => order.order_status === "new"
      ).length,

      confirmed: orders.filter(
        (order) => order.order_status === "confirmed"
      ).length,

      preparing: orders.filter(
        (order) => order.order_status === "preparing"
      ).length,

      out_for_delivery: orders.filter(
        (order) =>
          order.order_status === "out_for_delivery"
      ).length,

      delivered: orders.filter(
        (order) => order.order_status === "delivered"
      ).length,

      cancelled: orders.filter(
        (order) => order.order_status === "cancelled"
      ).length,
    };
  }, [orders]);

  /* =========================================================
     FORMAT DATE
  ========================================================= */

  function formatDate(date: string) {
    return new Date(date).toLocaleString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /* =========================================================
     LOGOUT
  ========================================================= */

  function goBack() {
    router.push("/home");
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#fbf8f7] text-[#342d2f]">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-40 border-b border-[#eadfe0] bg-[#fbf8f7]/95 backdrop-blur-xl">

        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={goBack}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e7dddd] bg-white text-lg text-[#665b5e] shadow-sm transition hover:bg-[#fff0f2]"
            >
              ←
            </button>

            <div>

              <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#a85566]">
                Ward Cosmetics
              </p>

              <h1 className="text-lg font-extrabold tracking-tight sm:text-xl">
                Orders
              </h1>

            </div>

          </div>

          <div className="flex items-center gap-2">

            <div className="hidden text-right sm:block">

              <p className="text-[9px] font-bold uppercase tracking-wide text-[#a09597]">
                Employee
              </p>

              <p className="text-xs font-bold">
                {employeeName}
              </p>

            </div>

            <button
              type="button"
              onClick={() => loadOrders(true)}
              disabled={refreshing}
              className="flex h-10 items-center gap-2 rounded-full border border-[#e7dddd] bg-white px-3.5 text-xs font-bold text-[#665b5e] shadow-sm transition hover:bg-[#fff0f2] disabled:opacity-50"
            >
              <span
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              >
                ↻
              </span>

              <span className="hidden sm:inline">
                Refresh
              </span>
            </button>

          </div>

        </div>

      </header>

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-10">

        {/* =====================================================
            PAGE INTRO
        ===================================================== */}

        <section className="mb-6">

          <div className="rounded-[28px] bg-[#e4eee0] p-6 sm:p-8">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/75 text-xl shadow-sm">
                  🛍️
                </div>

                <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Order management
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-[#687466]">
                  Review incoming orders, prepare them,
                  and keep their status up to date.
                </p>

              </div>

              <div className="rounded-2xl bg-white/70 px-5 py-4">

                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#7c8b77]">
                  Orders
                </p>

                <p className="mt-1 text-3xl font-extrabold text-[#52634e]">
                  {counts.all}
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="mb-5 rounded-[20px] border border-[#ecd0d5] bg-[#fdf0f2] px-4 py-4">

            <div className="flex items-start gap-3">

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#f5dfe4] font-extrabold text-[#a85566]">
                !
              </div>

              <div>

                <p className="text-xs font-extrabold text-[#9d4f60]">
                  Something went wrong
                </p>

                <p className="mt-1 text-xs leading-5 text-[#a76c76]">
                  {error}
                </p>

              </div>

            </div>

          </div>
        )}

        {/* =====================================================
            FILTERS
        ===================================================== */}

        <section className="mb-6 overflow-x-auto">

          <div className="flex min-w-max gap-2">

            <FilterButton
              label="All"
              count={counts.all}
              active={filter === "all"}
              onClick={() => setFilter("all")}
            />

            <FilterButton
              label="New"
              count={counts.new}
              active={filter === "new"}
              onClick={() => setFilter("new")}
            />

            <FilterButton
              label="Confirmed"
              count={counts.confirmed}
              active={filter === "confirmed"}
              onClick={() => setFilter("confirmed")}
            />

            <FilterButton
              label="Preparing"
              count={counts.preparing}
              active={filter === "preparing"}
              onClick={() => setFilter("preparing")}
            />

            <FilterButton
              label="Out for delivery"
              count={counts.out_for_delivery}
              active={filter === "out_for_delivery"}
              onClick={() =>
                setFilter("out_for_delivery")
              }
            />

            <FilterButton
              label="Delivered"
              count={counts.delivered}
              active={filter === "delivered"}
              onClick={() => setFilter("delivered")}
            />

            <FilterButton
              label="Cancelled"
              count={counts.cancelled}
              active={filter === "cancelled"}
              onClick={() => setFilter("cancelled")}
            />

          </div>

        </section>

        {/* =====================================================
            LOADING
        ===================================================== */}

        {loading && (
          <div className="space-y-4">

            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-[28px] border border-[#eadfe0] bg-white p-5 shadow-sm"
              >

                <div className="animate-pulse space-y-4">

                  <div className="h-5 w-32 rounded bg-[#eee7e7]" />

                  <div className="h-4 w-52 rounded bg-[#eee7e7]" />

                  <div className="h-12 rounded-2xl bg-[#f5f0ef]" />

                </div>

              </div>
            ))}

          </div>
        )}

        {/* =====================================================
            EMPTY
        ===================================================== */}

        {!loading &&
          filteredOrders.length === 0 && (
            <div className="rounded-[30px] border border-[#eadfe0] bg-white p-10 text-center shadow-sm">

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#e4eee0] text-3xl">
                🛍️
              </div>

              <h2 className="mt-5 text-xl font-extrabold">
                No orders here
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#918688]">
                {filter === "all"
                  ? "There are no customer orders yet."
                  : `There are no ${STATUS_LABELS[
                      filter
                    ]?.toLowerCase()} orders right now.`}
              </p>

              {filter !== "all" && (
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className="mt-5 rounded-full bg-[#b96070] px-5 py-3 text-sm font-bold text-white"
                >
                  View all orders
                </button>
              )}

            </div>
          )}

        {/* =====================================================
            ORDERS
        ===================================================== */}

        {!loading &&
          filteredOrders.length > 0 && (
            <div className="space-y-4">

              {filteredOrders.map((order) => {

                const expanded =
                  expandedOrder === order.id;

                const nextStatus =
                  NEXT_STATUS[order.order_status];

                const isUpdating =
                  updatingOrder === order.id;

                return (
                  <article
                    key={order.id}
                    className="overflow-hidden rounded-[28px] border border-[#eadfe0] bg-white shadow-[0_5px_25px_rgba(82,57,61,0.05)]"
                  >

                    {/* =================================================
                        ORDER HEADER
                    ================================================= */}

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedOrder(
                          expanded
                            ? null
                            : order.id
                        )
                      }
                      className="w-full text-left"
                    >

                      <div className="p-5 sm:p-6">

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                          <div className="min-w-0">

                            <div className="flex flex-wrap items-center gap-2">

                              <span className="text-sm font-extrabold">
                                Order #
                                {order.id.slice(0, 8)}
                              </span>

                              <span
                                className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold ${STATUS_COLORS[
                                  order.order_status
                                ]}`}
                              >
                                {
                                  STATUS_LABELS[
                                    order.order_status
                                  ]
                                }
                              </span>

                            </div>

                            <p className="mt-2 text-sm font-bold text-[#4a4143]">
                              {order.customer_name}
                            </p>

                            <p className="mt-1 text-xs text-[#93878a]">
                              {formatDate(
                                order.created_at
                              )}
                            </p>

                          </div>

                          <div className="flex items-center justify-between gap-5 sm:justify-end">

                            <div className="text-left sm:text-right">

                              <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#a09597]">
                                Total
                              </p>

                              <p className="mt-1 text-xl font-extrabold text-[#a85566]">
                                $
                                {Number(
                                  order.total
                                ).toFixed(2)}
                              </p>

                            </div>

                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f6eeee] text-[#806f73]">
                              {expanded
                                ? "↑"
                                : "↓"}
                            </span>

                          </div>

                        </div>

                      </div>

                    </button>

                    {/* =================================================
                        EXPANDED ORDER
                    ================================================= */}

                    {expanded && (
                      <div className="border-t border-[#eee4e4] bg-[#fdfafa]">

                        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_320px]">

                          {/* =============================================
                              LEFT
                          ============================================= */}

                          <div className="space-y-5">

                            {/* CUSTOMER */}

                            <div className="rounded-[22px] border border-[#eadfe0] bg-white p-5">

                              <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#a85566]">
                                Customer
                              </p>

                              <div className="mt-4 grid gap-4 sm:grid-cols-2">

                                <Info
                                  label="Name"
                                  value={
                                    order.customer_name
                                  }
                                />

                                <Info
                                  label="Phone"
                                  value={
                                    order.customer_phone
                                  }
                                />

                                {order.customer_city && (
                                  <Info
                                    label="City"
                                    value={
                                      order.customer_city
                                    }
                                  />
                                )}

                                {order.customer_address && (
                                  <Info
                                    label="Address"
                                    value={
                                      order.customer_address
                                    }
                                  />
                                )}

                              </div>

                            </div>

                            {/* ITEMS */}

                            <div className="rounded-[22px] border border-[#eadfe0] bg-white p-5">

                              <div className="flex items-center justify-between">

                                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#a85566]">
                                  Items
                                </p>

                                <p className="text-xs font-bold text-[#8e8285]">
                                  {order.items.reduce(
                                    (sum, item) =>
                                      sum +
                                      item.quantity,
                                    0
                                  )}{" "}
                                  units
                                </p>

                              </div>

                              <div className="mt-4 divide-y divide-[#eee5e5]">

                                {order.items.map(
                                  (item) => (
                                    <div
                                      key={item.id}
                                      className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                                    >

                                      <div className="min-w-0">

                                        <p className="text-sm font-bold">
                                          {
                                            item.product_name
                                          }
                                        </p>

                                        <p className="mt-1 text-xs text-[#94898b]">
                                          {item.quantity} × $
                                          {Number(
                                            item.unit_price
                                          ).toFixed(
                                            2
                                          )}
                                        </p>

                                      </div>

                                      <p className="shrink-0 text-sm font-extrabold">
                                        $
                                        {Number(
                                          item.total
                                        ).toFixed(2)}
                                      </p>

                                    </div>
                                  )
                                )}

                              </div>

                            </div>

                            {/* NOTES */}

                            {order.notes && (
                              <div className="rounded-[22px] border border-[#eadfe0] bg-[#fff9f0] p-5">

                                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#a36d36]">
                                  Customer note
                                </p>

                                <p className="mt-3 text-sm leading-6 text-[#665b54]">
                                  {order.notes}
                                </p>

                              </div>
                            )}

                          </div>

                          {/* =============================================
                              RIGHT
                          ============================================= */}

                          <div className="space-y-4">

                            {/* PAYMENT */}

                            <div className="rounded-[22px] border border-[#eadfe0] bg-white p-5">

                              <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#a85566]">
                                Payment
                              </p>

                              <div className="mt-4 flex items-center justify-between">

                                <span className="text-sm text-[#83777a]">
                                  Method
                                </span>

                                <span className="text-sm font-extrabold">
                                  {formatPaymentMethod(
                                    order.payment_method
                                  )}
                                </span>

                              </div>

                              <div className="mt-3 flex items-center justify-between">

                                <span className="text-sm text-[#83777a]">
                                  Payment status
                                </span>

                                <span className="rounded-full bg-[#f3f0ee] px-3 py-1.5 text-[10px] font-bold">
                                  {formatPaymentStatus(
                                    order.payment_status
                                  )}
                                </span>

                              </div>

                            </div>

                            {/* TOTAL */}

                            <div className="rounded-[22px] border border-[#eadfe0] bg-white p-5">

                              <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#a85566]">
                                Order total
                              </p>

                              <div className="mt-4 space-y-2">

                                <SummaryRow
                                  label="Subtotal"
                                  value={
                                    order.subtotal
                                  }
                                />

                                <SummaryRow
                                  label="Delivery"
                                  value={
                                    order.delivery_fee
                                  }
                                />

                                <div className="my-3 border-t border-[#eee5e5]" />

                                <div className="flex items-center justify-between">

                                  <span className="text-sm font-bold">
                                    Total
                                  </span>

                                  <span className="text-xl font-extrabold text-[#a85566]">
                                    $
                                    {Number(
                                      order.total
                                    ).toFixed(2)}
                                  </span>

                                </div>

                              </div>

                            </div>

                            {/* STATUS ACTION */}

                            {order.order_status !==
                              "delivered" &&
                              order.order_status !==
                                "cancelled" && (
                                <div className="rounded-[22px] border border-[#eadfe0] bg-white p-5">

                                  <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#a85566]">
                                    Order action
                                  </p>

                                  {nextStatus && (
                                    <button
                                      type="button"
                                      disabled={
                                        isUpdating
                                      }
                                      onClick={() =>
                                        updateStatus(
                                          order.id,
                                          nextStatus
                                        )
                                      }
                                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#b96070] px-4 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#a95263] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {isUpdating ? (
                                        <>
                                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                          Updating...
                                        </>
                                      ) : (
                                        <>
                                          Mark as{" "}
                                          {
                                            STATUS_LABELS[
                                              nextStatus
                                            ]
                                          }
                                          <span>
                                            →
                                          </span>
                                        </>
                                      )}
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    disabled={
                                      isUpdating
                                    }
                                    onClick={() =>
                                      updateStatus(
                                        order.id,
                                        "cancelled"
                                      )
                                    }
                                    className="mt-2 w-full rounded-2xl border border-[#eadfe0] bg-white px-4 py-3 text-xs font-bold text-[#887b7e] transition hover:bg-[#faf5f5] hover:text-[#a85566] disabled:opacity-50"
                                  >
                                    Cancel order
                                  </button>

                                </div>
                              )}

                            {order.order_status ===
                              "delivered" && (
                              <div className="rounded-[22px] border border-[#d9e6d5] bg-[#f1f7ef] p-5">

                                <div className="flex items-center gap-3">

                                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#dfeeda] text-[#55704d]">
                                    ✓
                                  </div>

                                  <div>

                                    <p className="text-sm font-extrabold text-[#52634e]">
                                      Order delivered
                                    </p>

                                    <p className="mt-1 text-[10px] text-[#71806d]">
                                      This order is
                                      complete.
                                    </p>

                                  </div>

                                </div>

                              </div>
                            )}

                            {order.order_status ===
                              "cancelled" && (
                              <div className="rounded-[22px] border border-[#e5dede] bg-[#f5f1f1] p-5">

                                <div className="flex items-center gap-3">

                                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e7dfdf] text-[#766d6f]">
                                    ×
                                  </div>

                                  <div>

                                    <p className="text-sm font-extrabold text-[#625b5d]">
                                      Order cancelled
                                    </p>

                                    <p className="mt-1 text-[10px] text-[#8e8587]">
                                      This order is
                                      no longer active.
                                    </p>

                                  </div>

                                </div>

                              </div>
                            )}

                          </div>

                        </div>

                      </div>
                    )}

                  </article>
                );
              })}

            </div>
          )}

      </div>
    </main>
  );
}

/* =============================================================
   FILTER BUTTON
============================================================= */

function FilterButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-extrabold transition ${
        active
          ? "bg-[#b96070] text-white shadow-sm"
          : "border border-[#e7dddd] bg-white text-[#706467] hover:bg-[#fff0f2]"
      }`}
    >
      {label}

      <span
        className={`rounded-full px-2 py-0.5 text-[9px] ${
          active
            ? "bg-white/20 text-white"
            : "bg-[#f3eeee] text-[#887b7e]"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

/* =============================================================
   INFO
============================================================= */

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#a09597]">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold leading-5 text-[#403739]">
        {value}
      </p>

    </div>
  );
}

/* =============================================================
   SUMMARY ROW
============================================================= */

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between">

      <span className="text-sm text-[#83777a]">
        {label}
      </span>

      <span className="text-sm font-semibold">
        ${Number(value).toFixed(2)}
      </span>

    </div>
  );
}

/* =============================================================
   PAYMENT FORMAT
============================================================= */

function formatPaymentMethod(
  method: string | null
) {
  if (!method) return "Not specified";

  switch (method) {
    case "whish":
      return "Whish";

    case "cash_on_delivery":
      return "Cash on delivery";

    case "cash":
      return "Cash";

    default:
      return method;
  }
}

/* =============================================================
   PAYMENT STATUS
============================================================= */

function formatPaymentStatus(
  status: string | null
) {
  if (!status) return "Pending";

  switch (status) {
    case "pending":
      return "Pending";

    case "paid":
      return "Paid";

    case "failed":
      return "Failed";

    case "refunded":
      return "Refunded";

    default:
      return status;
  }
}