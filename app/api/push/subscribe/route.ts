import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const endpoint = body?.endpoint;
    const p256dh = body?.p256dh;
    const auth = body?.auth;

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        {
          error: "Missing push subscription data.",
        },
        {
          status: 400,
        }
      );
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const secretKey =
      process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !secretKey) {
      console.error(
        "Missing Supabase server environment variables."
      );

      return NextResponse.json(
        {
          error:
            "Server configuration is missing. Check SUPABASE_SECRET_KEY in .env.local and Vercel.",
        },
        {
          status: 500,
        }
      );
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      secretKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { error } = await supabaseAdmin
      .from("push_subscriptions")
      .upsert(
        {
          endpoint,
          p256dh,
          auth,
        },
        {
          onConflict: "endpoint",
        }
      );

    if (error) {
      console.error(
        "SERVER PUSH SUBSCRIPTION ERROR:",
        error
      );

      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "PUSH SUBSCRIPTION API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown server error.",
      },
      {
        status: 500,
      }
    );
  }
}