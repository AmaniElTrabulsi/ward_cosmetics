import { cookies } from "next/headers";
import { createHash } from "crypto";
import { supabase } from "./supabase";

export type Role = "admin" | "employee";
export type SessionUser = { id: string; name: string; username: string; role: Role };

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get("ward_session")?.value;
  if (!token) return null;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data, error } = await supabase.rpc("ward_get_session", { p_token_hash: tokenHash });
  if (error || !data || !data.user_id) return null;
  return { id: data.user_id, name: data.name, username: data.username, role: data.role };
}

export async function requireSession(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}
