import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash } from "crypto";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("ward_session")?.value;
  if (!token) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { id } = await params;
  const body = await request.json();
  const orderStatus = body.order_status ? String(body.order_status) : null;
  const paymentStatus = body.payment_status ? String(body.payment_status) : null;

  // Keep this payload in the same argument order as the SQL migration.
  const { data, error } = await supabase.rpc("ward_order_update", {
    p_order_id: id,
    p_order_status: orderStatus,
    p_payment_status: paymentStatus,
    p_token_hash: tokenHash,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!data?.success) {
    return NextResponse.json({ error: "Unable to update order. Check that the order exists." }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}
