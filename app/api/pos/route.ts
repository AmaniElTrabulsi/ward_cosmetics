import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash } from "crypto";
import { supabase } from "@/lib/supabase";

async function getTokenHash() {
  const jar = await cookies();
  const token = jar.get("ward_session")?.value;
  return token ? createHash("sha256").update(token).digest("hex") : null;
}

export async function POST(request: NextRequest) {
  const tokenHash = await getTokenHash();
  if (!tokenHash) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  try {
    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items : [];
    const paymentMethod = String(body.payment_method || "cash");
    if (!items.length) return NextResponse.json({ error: "The sale has no items." }, { status: 400 });
    if (!["cash", "card", "whish", "other"].includes(paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method." }, { status: 400 });
    }
    const normalized = items.map((item: { product_id?: string; quantity?: number }) => ({
      product_id: String(item.product_id || ""),
      quantity: Math.floor(Number(item.quantity)),
    }));
    if (normalized.some((item: { product_id: string; quantity: number }) => !item.product_id || !Number.isInteger(item.quantity) || item.quantity < 1)) {
      return NextResponse.json({ error: "One or more sale items are invalid." }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("ward_pos_checkout", {
      p_token_hash: tokenHash,
      p_items: normalized,
      p_payment_method: paymentMethod,
    });
    if (error) throw error;
    if (!data?.success) throw new Error(data?.message || "Sale could not be completed.");
    return NextResponse.json({ sale_id: data.sale_id, sale_number: data.sale_number, total: data.total });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to complete sale." }, { status: 400 });
  }
}
