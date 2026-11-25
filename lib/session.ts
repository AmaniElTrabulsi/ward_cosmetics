import { cookies } from "next/headers";
import { createHash } from "crypto";
import { supabase } from "@/lib/supabase";

export type StaffUser = {
  user_id: string;
  name: string;
  username: string;
  role: "admin" | "employee";
};

export async function getSession(): Promise<StaffUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("ward_session")?.value;
    if (!token) return null;
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const { data, error } = await supabase.rpc("ward_get_session", {
      p_token_hash: tokenHash,
    });
    if (error || !data || typeof data !== "object") return null;
    const user = data as Partial<StaffUser>;
    if (!user.user_id || !user.name || !user.username || !["admin", "employee"].includes(user.role || "")) return null;
    return user as StaffUser;
  } catch {
    return null;
  }
}
