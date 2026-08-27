"use server";

import { createServerActionClient } from "@/lib/supabase/server";

export async function logApplyClick(jobId: string) {
  const supabase = await createServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("job_events").insert({
    job_id: jobId,
    event_type: "apply_click",
    user_id: user?.id ?? null,
  });
}

export async function saveJob(jobId: string) {
  const supabase = await createServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "sign_in_required" as const };

  const { error } = await supabase.from("saved_jobs").insert({ user_id: user.id, job_id: jobId });
  if (error && error.code !== "23505") return { error: error.message };
  return { error: null };
}
