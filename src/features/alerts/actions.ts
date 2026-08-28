"use server";

import { revalidatePath } from "next/cache";
import { createServerActionClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createAlert(formData: FormData) {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "sign_in_required" as const };

  const keyword = String(formData.get("keyword") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const frequency = String(formData.get("frequency") ?? "daily");

  const { error } = await supabase.from("job_alerts").insert({
    user_id: user.id,
    name: keyword || location || "Job alert",
    search_query: keyword || null,
    filters: { keyword: keyword || null, location: location || null },
    frequency,
    is_active: true,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/alerts");
  return { error: null };
}

export async function toggleAlert(alertId: string, isActive: boolean) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await supabase.from("job_alerts").update({ is_active: isActive }).eq("id", alertId).eq("user_id", user.id);
  revalidatePath("/dashboard/alerts");
}

export async function deleteAlert(alertId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await supabase.from("job_alerts").delete().eq("id", alertId).eq("user_id", user.id);
  revalidatePath("/dashboard/alerts");
}
