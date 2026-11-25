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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tokenHash = await getTokenHash();

  if (!tokenHash) {
    return NextResponse.json(
      { error: "Sign in required." },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const { data, error } = await supabase.rpc(
      "ward_product_upsert",
      {
        p_token_hash: tokenHash,
        p_product_id: id,
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

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : "Unable to update product.",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tokenHash = await getTokenHash();

  if (!tokenHash) {
    return NextResponse.json(
      { error: "Sign in required." },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;

    const { data, error } = await supabase.rpc(
      "ward_product_delete",
      {
        p_token_hash: tokenHash,
        p_product_id: id,
      }
    );

    if (error) throw error;

    if (!data?.success) {
      return NextResponse.json(
        { error: data?.message || "Could not delete product." },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : "Unable to delete product.",
      },
      { status: 400 }
    );
  }
}