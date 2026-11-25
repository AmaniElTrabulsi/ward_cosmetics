import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash } from "crypto";
import { supabase } from "@/lib/supabase";

async function getTokenHash() {
  const cookieStore = await cookies();
  const token = cookieStore.get("ward_session")?.value;

  return token
    ? createHash("sha256").update(token).digest("hex")
    : null;
}

export async function GET() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ products: data || [] });
}

export async function POST(req: NextRequest) {
  const tokenHash = await getTokenHash();

  if (!tokenHash) {
    return NextResponse.json(
      { error: "Sign in required." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();

    const { data, error } = await supabase.rpc(
      "ward_product_upsert",
      {
        p_token_hash: tokenHash,
        p_product_id: null,
        p_values: {
          brand: body.brand,
          name: body.name,
          price: body.price,
          stock_quantity: body.stock_quantity,
          image_url: body.image_url || null,
          barcode: body.barcode || null,
          description: body.description || null,
        },
      }
    );

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : "Unable to add product.",
      },
      { status: 400 }
    );
  }
}