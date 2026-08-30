"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerActionClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service";
import { findOrCreateLocation } from "@/lib/locations";

export interface ScreeningQuestion {
  id: string;
  type: "yes_no" | "short_text" | "multiple_choice";
  label: string;
  options?: string[];
}

export interface JobPostInput {
  title: string;
  careerId: string | null;
  employmentType: string | null;
  workArrangement: string;
  city: string;
  state: string;
  requiredSkills: string[];
  requiredCertifications: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPublic: boolean;
  applicationType: "external_url" | "platform_application";
  applicationUrl: string | null;
  screeningQuestions: ScreeningQuestion[];
  description: string;
  expiresAt: string | null; // ISO date, or null for no expiry
}

// jobs/job_locations/job_compensation/job_skills/job_certifications all
// have "employer member of this company can manage" RLS policies
// (010_rls_policies.sql), so the employer's own session can write these
// directly -- no service client needed here, unlike skills/certifications
// (shared reference tables, still service-role-only for writes).
async function requireVerifiedEmployer() {
  const supabase = await createServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: membership } = await supabase
    .from("employer_members")
    .select("organization_id, employer_organizations ( company_id, companies ( id, status ) )")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const company = (membership?.employer_organizations as any)?.companies;
  if (!company || company.status !== "active") redirect("/employer/verification");

  return { supabase, user, companyId: company.id as string };
}

function validate(input: JobPostInput, publish: boolean) {
  if (!input.title.trim()) return "Title is required.";
  if (!publish) return null; // drafts skip the rest -- fill in later
  if (input.applicationType === "external_url" && !input.applicationUrl?.trim()) {
    return "An application URL is required for external-URL jobs.";
  }
  if (input.applicationType === "platform_application" && input.screeningQuestions.length > 3) {
    return "Up to 3 screening questions only.";
  }
  return null;
}

async function findOrCreateSkill(name: string) {
  const db = getServiceClient();
  const { data: existing } = await db.from("skills").select("id").ilike("name", name).maybeSingle();
  if (existing) return existing.id;
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const { data: created } = await db.from("skills").insert({ name, slug }).select("id").single();
  return created?.id ?? null;
}

async function findOrCreateCertification(name: string) {
  const db = getServiceClient();
  const { data: existing } = await db.from("certifications").select("id").ilike("name", name).maybeSingle();
  if (existing) return existing.id;
  const { data: created } = await db.from("certifications").insert({ name }).select("id").single();
  return created?.id ?? null;
}

// Shared by create and edit: (re)writes every child row for a job from the
// current form state. Edit calls this after clearing the job's existing
// child rows, so this always starts from a clean slate -- simpler than
// diffing, and these tables are small per job.
async function writeJobChildren(supabase: Awaited<ReturnType<typeof createServerActionClient>>, jobId: string, input: JobPostInput) {
  if (input.city.trim() && input.state.trim()) {
    const locationId = await findOrCreateLocation(input.city.trim(), input.state.trim());
    await supabase.from("job_locations").insert({ job_id: jobId, location_id: locationId, is_primary: true });
  }

  if (input.salaryMin || input.salaryMax) {
    await supabase.from("job_compensation").insert({
      job_id: jobId,
      pay_type: "base",
      currency: "USD",
      min_amount: input.salaryMin,
      max_amount: input.salaryMax,
      period: "year",
      is_public: input.salaryPublic,
      source: "employer_direct",
    });
  }

  for (const name of input.requiredSkills) {
    if (!name.trim()) continue;
    const skillId = await findOrCreateSkill(name.trim());
    if (skillId) await supabase.from("job_skills").insert({ job_id: jobId, skill_id: skillId, requirement_type: "required" });
  }

  for (const name of input.requiredCertifications) {
    if (!name.trim()) continue;
    const certId = await findOrCreateCertification(name.trim());
    if (certId) await supabase.from("job_certifications").insert({ job_id: jobId, certification_id: certId, requirement_type: "required" });
  }
}

export async function createJobPosting(input: JobPostInput & { publish: boolean }) {
  const { supabase, companyId } = await requireVerifiedEmployer();

  const validationError = validate(input, input.publish);
  if (validationError) return { error: validationError };

  const baseSlug = input.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  let slug = baseSlug;
  let suffix = 1;
  // slug is unique per company, not globally -- collisions are rare but
  // possible if an employer posts near-duplicate titles.
  while (true) {
    const { data: clash } = await supabase.from("jobs").select("id").eq("company_id", companyId).eq("slug", slug).maybeSingle();
    if (!clash) break;
    slug = `${baseSlug}-${++suffix}`;
  }

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .insert({
      company_id: companyId,
      career_id: input.careerId,
      title: input.title.trim(),
      slug,
      description: input.description || null,
      employment_type: input.employmentType,
      work_arrangement: input.workArrangement,
      status: input.publish ? "active" : "draft",
      source_type: "employer_direct",
      application_type: input.applicationType,
      application_url: input.applicationType === "external_url" ? input.applicationUrl : null,
      screening_questions: input.applicationType === "platform_application" ? input.screeningQuestions : null,
      expires_at: input.expiresAt,
      published_at: input.publish ? new Date().toISOString() : null,
    })
    .select("id")
    .single();
  if (jobError) return { error: jobError.message };

  await writeJobChildren(supabase, job.id, input);

  revalidatePath("/employer/jobs");
  redirect("/employer/jobs");
}

async function loadOwnedJob(jobId: string, companyId: string) {
  const supabase = await createServerActionClient();
  const { data: job } = await supabase.from("jobs").select("id, status").eq("id", jobId).eq("company_id", companyId).maybeSingle();
  return job;
}

export async function updateJobPosting(jobId: string, input: JobPostInput & { publish: boolean }) {
  const { supabase, companyId } = await requireVerifiedEmployer();

  const job = await loadOwnedJob(jobId, companyId);
  if (!job) return { error: "Job not found." };

  // Once a job has ever gone live, editing keeps it in whatever
  // active/paused state it was already in -- the draft/publish choice
  // only applies to jobs that haven't been published yet.
  const alreadyLive = job.status !== "draft";
  const validationError = validate(input, input.publish || alreadyLive);
  if (validationError) return { error: validationError };

  const nextStatus = alreadyLive ? job.status : input.publish ? "active" : "draft";

  const { error: jobError } = await supabase
    .from("jobs")
    .update({
      career_id: input.careerId,
      title: input.title.trim(),
      description: input.description || null,
      employment_type: input.employmentType,
      work_arrangement: input.workArrangement,
      status: nextStatus,
      application_type: input.applicationType,
      application_url: input.applicationType === "external_url" ? input.applicationUrl : null,
      screening_questions: input.applicationType === "platform_application" ? input.screeningQuestions : null,
      expires_at: input.expiresAt,
      published_at: !alreadyLive && input.publish ? new Date().toISOString() : undefined,
    })
    .eq("id", jobId);
  if (jobError) return { error: jobError.message };

  // Replace child rows wholesale -- simplest correct approach for these
  // small per-job tables (see writeJobChildren comment).
  await Promise.all([
    supabase.from("job_locations").delete().eq("job_id", jobId),
    supabase.from("job_compensation").delete().eq("job_id", jobId),
    supabase.from("job_skills").delete().eq("job_id", jobId),
    supabase.from("job_certifications").delete().eq("job_id", jobId),
  ]);
  await writeJobChildren(supabase, jobId, input);

  revalidatePath("/employer/jobs");
  revalidatePath(`/employer/jobs/${jobId}/edit`);
  redirect("/employer/jobs");
}

export async function updateJobStatus(jobId: string, status: "active" | "paused" | "expired" | "archived") {
  const { supabase } = await requireVerifiedEmployer();
  await supabase.from("jobs").update({ status }).eq("id", jobId);
  revalidatePath("/employer/jobs");
}

// A job whose expires_at has passed drops out of public view immediately
// via RLS (migration 019), and the daily expire-jobs cron eventually
// flips its status to 'expired' too. Renewing has to cover both cases --
// set status back to 'active' unconditionally alongside pushing
// expires_at forward, since this may run before or after that cron.
export async function renewJobExpiry(jobId: string, days = 30) {
  const { supabase } = await requireVerifiedEmployer();
  const nextExpiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from("jobs").update({ status: "active", expires_at: nextExpiry }).eq("id", jobId);
  revalidatePath("/employer/jobs");
}
