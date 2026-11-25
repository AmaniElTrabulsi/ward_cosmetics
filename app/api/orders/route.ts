
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Sign in required." },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ orders: data || [] });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      customer_name,
      customer_phone,
      customer_city,
      customer_address,
      notes,
      delivery_type,
      payment_method,
      whish_transaction_id,
      items,
    } = body;

    if (
      typeof customer_name !== "string" ||
      !customer_name.trim() ||
      typeof customer_phone !== "string" ||
      !customer_phone.trim()
    ) {
      return NextResponse.json(
        { error: "Please enter your name and phone number." },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return NextResponse.json(
        { error: "Your shopping bag is empty or invalid." },
        { status: 400 }
      );
    }

    if (delivery_type !== "delivery" && delivery_type !== "pickup") {
      return NextResponse.json(
        { error: "Invalid delivery option." },
        { status: 400 }
      );
    }

    if (
      delivery_type === "delivery" &&
      payment_method !== "cash_on_delivery" &&
      payment_method !== "whish"
    ) {
      return NextResponse.json(
        { error: "Please choose a valid payment method." },
        { status: 400 }
      );
    }

    if (
      delivery_type === "pickup" &&
      payment_method !== "cash_at_store" &&
      payment_method !== "whish"
    ) {
      return NextResponse.json(
        { error: "Please choose payment at the store or Whish." },
        { status: 400 }
      );
    }

    let cleanWhishTransactionId: string | null = null;

    if (payment_method === "whish") {
      if (
        typeof whish_transaction_id !== "string" ||
        !whish_transaction_id.trim()
      ) {
        return NextResponse.json(
          { error: "Please enter your Whish transaction number." },
          { status: 400 }
        );
      }

      cleanWhishTransactionId = whish_transaction_id.trim();

      if (cleanWhishTransactionId.length > 120) {
        return NextResponse.json(
          { error: "The Whish transaction number is too long." },
          { status: 400 }
        );
      }
    }

    if (
      delivery_type === "delivery" &&
      (
        typeof customer_city !== "string" ||
        !customer_city.trim() ||
        typeof customer_address !== "string" ||
        !customer_address.trim()
      )
    ) {
      return NextResponse.json(
        { error: "Please enter your delivery city and address." },
        { status: 400 }
      );
    }

    const quantities = new Map<string, number>();

    for (const item of items) {
      if (
        !item ||
        typeof item.product_id !== "string" ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 100
      ) {
        return NextResponse.json(
          { error: "One or more products have invalid quantities." },
          { status: 400 }
        );
      }

      quantities.set(
        item.product_id,
        (quantities.get(item.product_id) || 0) + item.quantity
      );
    }

    if ([...quantities.values()].some((quantity) => quantity > 100)) {
      return NextResponse.json(
        { error: "The requested quantity is too large." },
        { status: 400 }
      );
    }

    const cleanItems = [...quantities.entries()].map(
      ([product_id, quantity]) => ({
        product_id,
        quantity,
      })
    );

    const { data, error } = await supabase.rpc(
      "ward_create_public_order",
      {
        p_customer_name: customer_name.trim(),
        p_customer_phone: customer_phone.trim(),
        p_customer_city:
          delivery_type === "pickup"
            ? "Store pickup"
            : customer_city.trim(),
        p_customer_address:
          delivery_type === "pickup"
            ? "Store pickup"
            : customer_address.trim(),
        p_notes:
          typeof notes === "string" && notes.trim()
            ? notes.trim()
            : null,
        p_delivery_type: delivery_type,
        p_payment_method: payment_method,
        p_items: cleanItems,
        p_whish_transaction_id: cleanWhishTransactionId,
      }
    );

    if (error) {
      console.error("Order creation error:", error.message);

      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (!data?.success) {
      return NextResponse.json(
        { error: data?.error || "Unable to place your order." },
        { status: 400 }
      );
    }

    if (!data.order_number) {
      console.error("Order number missing from RPC response:", data);

      return NextResponse.json(
        {
          error:
            "Your order was created, but its reference number could not be retrieved. Please contact the store.",
          order_id: data.order_id,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        order_id: data.order_id,
        order_number: data.order_number,
        message: "Your order has been placed successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Checkout error:", error);

    return NextResponse.json(
      { error: "Something went wrong while placing your order." },
      { status: 500 }
    );
  }
}
