import { redirect } from "next/navigation";
import { createServerActionClient } from "@/lib/supabase/server";

// Every /admin/* page needs this same check -- centralized here (and
// called once from app/admin/layout.tsx) instead of each page repeating
// the same auth.getUser() + has_role() round trip.
export async function requireAdmin() {
  const supabase = await createServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: isAdmin } = await supabase.rpc("has_role", { target_role: "platform_admin" });
  if (!isAdmin) redirect("/");

  return { user };
}
