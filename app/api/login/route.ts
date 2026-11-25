
import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || "");
    const role = String(body.role || "").trim().toLowerCase();

    if (!username || !password || !["admin", "employee"].includes(role)) {
      return NextResponse.json(
        { error: "Enter username, password and account type." },
        { status: 400 }
      );
    }

    const token = randomBytes(32).toString("hex");
    const hash = createHash("sha256").update(token).digest("hex");

    const { data, error } = await supabase.rpc("ward_login", {
      p_username: username,
      p_password: password,
      p_role: role,
      p_token_hash: hash,
    });

    // Log database errors without logging passwords or session tokens.
    if (error) {
      console.error("WARD LOGIN DATABASE ERROR:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });

      return NextResponse.json(
        {
          error: "Database login error.",
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      );
    }

    console.log("WARD LOGIN RESULT:", {
      success: data?.success,
      role: data?.role,
      username: data?.username,
    });

    if (!data?.success) {
      return NextResponse.json(
        { error: "The database rejected the username or password." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      user: {
        role: data.role,
        name: data.name,
        username: data.username,
      },
    });

    response.cookies.set("ward_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("WARD LOGIN SERVER ERROR:", error);

    return NextResponse.json(
      { error: "Unable to sign in. Check the server logs." },
      { status: 500 }
    );
  }
}
