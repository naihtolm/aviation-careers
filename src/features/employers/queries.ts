import { createServerActionClient } from "@/lib/supabase/server";

// Gates every /employer/* route — returns the employer_members row (with
// the company + organization it belongs to) for the current user, or
// null if they're not an employer member of any company.
export async function getEmployerContext(userId: string) {
  const supabase = await createServerActionClient();
  const { data } = await supabase
    .from("employer_members")
    .select(
      "role, status, organization_id, employer_organizations ( company_id, companies ( id, name, slug, status, verification_status, description, website, employee_size_range ) )"
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (!data) return null;
  const org: any = data.employer_organizations;
  const company = org?.companies;
  if (!company) return null;

  return {
    role: data.role,
    organizationId: data.organization_id as string,
    company,
  };
}

export async function getLatestVerification(companyId: string) {
  const supabase = await createServerActionClient();
  const { data } = await supabase
    .from("company_verifications")
    .select("*")
    .eq("company_id", companyId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getCompanyJobs(companyId: string) {
  const supabase = await createServerActionClient();
  const { data } = await supabase
    .from("jobs")
    .select("id, title, slug, status, application_type, published_at, expires_at, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  const jobs = data ?? [];
  const jobIds = jobs.map((j) => j.id);
  if (jobIds.length === 0) return jobs.map((j) => ({ ...j, applicantCount: 0 }));

  const { data: applications } = await supabase
    .from("job_applications")
    .select("job_id")
    .in("job_id", jobIds)
    .eq("source", "platform");

  const counts = new Map<string, number>();
  for (const a of applications ?? []) {
    counts.set(a.job_id, (counts.get(a.job_id) ?? 0) + 1);
  }

  return jobs.map((j) => ({ ...j, applicantCount: counts.get(j.id) ?? 0 }));
}

export async function getJobForEmployer(jobId: string, companyId: string) {
  const supabase = await createServerActionClient();
  const { data } = await supabase.from("jobs").select("id, title, application_type").eq("id", jobId).eq("company_id", companyId).maybeSingle();
  return data;
}

// Full editable job shape for the "edit posting" form -- everything
// JobPostForm needs to prefill, mirroring what createJobPosting writes.
export async function getJobForEdit(jobId: string, companyId: string) {
  const supabase = await createServerActionClient();
  const { data: job } = await supabase
    .from("jobs")
    .select(
      `id, title, career_id, employment_type, work_arrangement, status, application_type, application_url,
       screening_questions, description, expires_at,
       job_locations ( is_primary, locations ( city, state_code ) ),
       job_compensation ( min_amount, max_amount, period, is_public ),
       job_skills ( skills ( name ) ),
       job_certifications ( certifications ( name ) )`
    )
    .eq("id", jobId)
    .eq("company_id", companyId)
    .maybeSingle();
  return job as any;
}

export async function getJobApplicants(jobId: string) {
  const supabase = await createServerActionClient();
  // RLS (016_employer_applicant_inbox_rls.sql) scopes this to
  // source='platform' applications on jobs the caller's company owns.
  const { data: applications } = await supabase
    .from("job_applications")
    .select("id, status, applied_at, screening_answers, user_id")
    .eq("job_id", jobId)
    .eq("source", "platform")
    .order("applied_at", { ascending: false });

  const apps = applications ?? [];
  if (apps.length === 0) return [];

  const userIds = apps.map((a) => a.user_id);
  const [{ data: profiles }, { data: resumes }] = await Promise.all([
    supabase.from("profiles").select("id, first_name, last_name, display_name, email").in("id", userIds),
    supabase.from("resumes").select("user_id, storage_path, file_name").in("user_id", userIds).eq("is_primary", true),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const resumeMap = new Map((resumes ?? []).map((r) => [r.user_id, r]));

  return apps.map((a) => ({
    ...a,
    profile: profileMap.get(a.user_id) ?? null,
    resume: resumeMap.get(a.user_id) ?? null,
  }));
}

// Analytics is built from job_applications (RLS-scoped, real data) rather
// than job_events/job_daily_metrics -- those tables have no rollup job or
// employer-facing RLS yet, so they aren't a reliable source in V1.
export async function getCompanyApplicationAnalytics(companyId: string) {
  const supabase = await createServerActionClient();
  const { data: jobs } = await supabase.from("jobs").select("id, title, status").eq("company_id", companyId);
  const jobIds = (jobs ?? []).map((j) => j.id);
  if (jobIds.length === 0) return { byStatus: {}, byJob: [], last30Days: [] };

  const { data: applications } = await supabase
    .from("job_applications")
    .select("job_id, status, applied_at")
    .in("job_id", jobIds)
    .eq("source", "platform");

  const apps = applications ?? [];
  const byStatus: Record<string, number> = {};
  const byJobCounts = new Map<string, number>();
  for (const a of apps) {
    byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
    byJobCounts.set(a.job_id, (byJobCounts.get(a.job_id) ?? 0) + 1);
  }

  const byJob = (jobs ?? [])
    .map((j) => ({ title: j.title, count: byJobCounts.get(j.id) ?? 0 }))
    .filter((j) => j.count > 0)
    .sort((a, b) => b.count - a.count);

  const dayBuckets = new Map<string, number>();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  for (const a of apps) {
    if (!a.applied_at) continue;
    const d = new Date(a.applied_at);
    if (d < thirtyDaysAgo) continue;
    const key = d.toISOString().slice(0, 10);
    dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + 1);
  }
  const last30Days = Array.from(dayBuckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  return { byStatus, byJob, last30Days };
}
