import { createServerActionClient } from "@/lib/supabase/server";

export async function getAlerts(userId: string) {
  const supabase = await createServerActionClient();
  const { data } = await supabase
    .from("job_alerts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}
