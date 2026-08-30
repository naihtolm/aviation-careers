"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/admin/auth";
import { getServiceClient } from "@/lib/supabase/service";

// Cross-company version of features/employers/job-post-actions.ts's
// updateJobStatus -- that one is scoped to the caller's own employer
// membership (correct for an employer managing their own listings), but
// an admin moderating the whole platform isn't a member of every
// company, so this goes through the service client instead, gated by
// requireAdmin() rather than RLS.
export async function adminUpdateJobStatus(jobId: string, status: "active" | "paused" | "expired" | "archived") {
  await requireAdmin();
  const db = getServiceClient();
  await db.from("jobs").update({ status }).eq("id", jobId);
  revalidatePath("/admin/jobs");
}
