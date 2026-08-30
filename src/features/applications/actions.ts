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

// Called when a signed-in user confirms "Apply Now" on an external-URL
// job. Creates the tracking row at 'interested' (or reuses an existing
// one — job_applications has no unique constraint on user_id/job_id, so
// this avoids piling up duplicate rows every time someone re-clicks
// apply on the same job). Status only reaches 'applied' once they
// confirm via confirmApplied(), per the post-redirect "did you apply?"
// prompt in the spec.
export async function trackApplyClick(jobId: string, applicationUrl: string | null) {
  const { supabase, user } = await requireUser();

  // Apply-click analytics matter regardless of sign-in status — only the
  // job_applications tracking row (and the post-redirect prompt it
  // enables) requires an account.
  await supabase.from("job_events").insert({ job_id: jobId, event_type: "apply_click", user_id: user?.id ?? null });
  if (!user) return { applicationId: null };

  const { data: existing } = await supabase
    .from("job_applications")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("job_id", jobId)
    .maybeSingle();

  if (existing) return { applicationId: existing.id };

  const { data: created } = await supabase
    .from("job_applications")
    .insert({
      user_id: user.id,
      job_id: jobId,
      status: "interested",
      source: "external",
      external_application_url: applicationUrl,
    })
    .select("id")
    .single();

  return { applicationId: created?.id ?? null };
}

export async function confirmApplied(applicationId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await supabase
    .from("job_applications")
    .update({ status: "applied", applied_at: new Date().toISOString() })
    .eq("id", applicationId)
    .eq("user_id", user.id);
  revalidatePath("/dashboard/applications");
}

const VALID_STATUSES = ["interested", "applied", "interviewing", "offer", "rejected", "withdrawn"];

export async function updateApplicationStatus(applicationId: string, status: string) {
  const { supabase, user } = await requireUser();
  if (!user || !VALID_STATUSES.includes(status)) return;
  await supabase.from("job_applications").update({ status }).eq("id", applicationId).eq("user_id", user.id);
  revalidatePath("/dashboard/applications");
}

export async function submitNativeApplication(jobId: string, screeningAnswers: Record<string, string>) {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "sign_in_required" as const };

  const { data: resume } = await supabase.from("resumes").select("id").eq("user_id", user.id).eq("is_primary", true).maybeSingle();
  if (!resume) return { error: "resume_required" as const };

  const { data: existing } = await supabase
    .from("job_applications")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("job_id", jobId)
    .maybeSingle();
  if (existing?.status === "applied") return { error: "already_applied" as const };

  const payload = {
    status: "applied" as const,
    applied_at: new Date().toISOString(),
    source: "platform",
    screening_answers: screeningAnswers,
  };

  const { error } = existing
    ? await supabase.from("job_applications").update(payload).eq("id", existing.id)
    : await supabase.from("job_applications").insert({ ...payload, user_id: user.id, job_id: jobId });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/applications");
  return { success: true as const };
}

export async function updateApplicationNotes(applicationId: string, notes: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await supabase.from("job_applications").update({ notes }).eq("id", applicationId).eq("user_id", user.id);
  revalidatePath("/dashboard/applications");
}
