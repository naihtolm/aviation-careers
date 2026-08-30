// features/employers/job-expiry.ts
//
// Called by the daily cron route. Runs as a system process with no user
// session, so it goes through the service client. Public visibility of
// an overdue job is already gated precisely by RLS the instant
// expires_at passes (migration 019) -- this just keeps jobs.status
// itself accurate so the employer's own dashboard (and any future
// status-based reporting) reflects reality without waiting on a
// same-day RLS check to notice.

import { getServiceClient } from "@/lib/supabase/service";

export async function expireOverdueJobs() {
  const db = getServiceClient();
  const { data, error } = await db
    .from("jobs")
    .update({ status: "expired" })
    .eq("status", "active")
    .lt("expires_at", new Date().toISOString())
    .select("id");

  if (error) throw new Error(`Failed to expire jobs: ${error.message}`);
  return { expiredCount: data?.length ?? 0 };
}
