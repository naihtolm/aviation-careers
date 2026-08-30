"use server";

import { revalidatePath } from "next/cache";
import { createServerActionClient } from "@/lib/supabase/server";

const ALLOWED_STATUSES = ["applied", "interviewing", "offer", "rejected"] as const;

export async function updateApplicationStatus(applicationId: string, jobId: string, status: (typeof ALLOWED_STATUSES)[number]) {
  if (!ALLOWED_STATUSES.includes(status)) return { error: "Invalid status." };

  const supabase = await createServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  // job_applications_employer_update_status RLS (016) already scopes this
  // to platform-source applications on jobs the employer owns.
  const { error } = await supabase.from("job_applications").update({ status }).eq("id", applicationId);
  if (error) return { error: error.message };

  revalidatePath(`/employer/jobs/${jobId}/applicants`);
  return { success: true };
}
