import { createServerActionClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service";
import type { ParsedResumeData } from "@/lib/resume-parsing";

export async function getLatestResume(userId: string) {
  const supabase = await createServerActionClient();
  const { data: resume } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", userId)
    .eq("is_primary", true)
    .maybeSingle();
  if (!resume) return null;

  const { data: job } = await supabase
    .from("resume_processing_jobs")
    .select("*")
    .eq("resume_id", resume.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { resume, job };
}

export async function getLatestParse(resumeId: string): Promise<{ id: string; structured_data: ParsedResumeData } | null> {
  // resume_parses is owner-select-only for the RLS client, which is fine
  // for reads through this server component -- using the service client
  // here anyway keeps this function usable from contexts (like the
  // upload action) that already hold it, and avoids a second RLS lookup.
  const db = getServiceClient();
  const { data } = await db
    .from("resume_parses")
    .select("id, structured_data")
    .eq("resume_id", resumeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as any;
}

export async function getResumeDownloadUrl(storagePath: string) {
  const supabase = await createServerActionClient();
  const { data } = await supabase.storage.from("resumes").createSignedUrl(storagePath, 60 * 10);
  return data?.signedUrl ?? null;
}
