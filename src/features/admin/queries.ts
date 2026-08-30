// features/admin/queries.ts
//
// Every admin page needs cross-tenant reads (all companies' jobs, every
// user's profile counts, etc.) that ordinary RLS would never allow for a
// single user's session -- so, same pattern as the existing admin pages
// (admin/jobs/review, admin/employers), everything here goes through the
// service client. The has_role('platform_admin') check in
// features/admin/auth.ts (run once from app/admin/layout.tsx) is what
// stands in for RLS at the page level.

import { getServiceClient } from "@/lib/supabase/service";

export async function getAdminOverviewStats() {
  const db = getServiceClient();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalJobs },
    { count: activeJobs },
    { count: newJobsThisWeek },
    { count: totalCompanies },
    { count: pendingVerifications },
    { count: totalJobSeekers },
    { count: newSeekersThisWeek },
    { count: totalApplications },
    { count: pendingIngestion },
  ] = await Promise.all([
    db.from("jobs").select("id", { count: "exact", head: true }),
    db.from("jobs").select("id", { count: "exact", head: true }).eq("status", "active"),
    db.from("jobs").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    db.from("companies").select("id", { count: "exact", head: true }),
    db.from("company_verifications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("job_seeker_profiles").select("id", { count: "exact", head: true }),
    db.from("job_seeker_profiles").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    db.from("job_applications").select("id", { count: "exact", head: true }),
    db.from("raw_job_records").select("id", { count: "exact", head: true }).eq("status", "received"),
  ]);

  return {
    totalJobs: totalJobs ?? 0,
    activeJobs: activeJobs ?? 0,
    newJobsThisWeek: newJobsThisWeek ?? 0,
    totalCompanies: totalCompanies ?? 0,
    pendingVerifications: pendingVerifications ?? 0,
    totalJobSeekers: totalJobSeekers ?? 0,
    newSeekersThisWeek: newSeekersThisWeek ?? 0,
    totalApplications: totalApplications ?? 0,
    pendingIngestion: pendingIngestion ?? 0,
  };
}

export interface AdminJobFilters {
  status?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export async function getAllJobsForAdmin(filters: AdminJobFilters) {
  const db = getServiceClient();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 25;

  let query = db
    .from("jobs")
    .select("id, title, slug, status, application_type, published_at, expires_at, created_at, companies ( name )", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.keyword) query = query.ilike("title", `%${filters.keyword}%`);

  const { data, error, count } = await query;
  if (error) throw new Error(`Failed to load jobs: ${error.message}`);
  return { jobs: data ?? [], total: count ?? 0, page, pageSize };
}

// Concrete, checkable completeness gaps rather than a synthetic "score" --
// job_events/job_daily_metrics have no rollup job populating them yet
// (see features/employers/queries.ts's getCompanyApplicationAnalytics
// comment), so they aren't a usable signal for data quality yet either.
export async function getDataQualityIssues() {
  const db = getServiceClient();

  const [{ data: activeJobs }, { data: locatedJobIds }, { data: compensatedJobIds }, { data: companies }] = await Promise.all([
    db.from("jobs").select("id, title, description, company_id").eq("status", "active"),
    db.from("job_locations").select("job_id"),
    db.from("job_compensation").select("job_id"),
    db.from("companies").select("id, name, description, website").eq("status", "active"),
  ]);

  const locatedSet = new Set((locatedJobIds ?? []).map((r) => r.job_id));
  const compensatedSet = new Set((compensatedJobIds ?? []).map((r) => r.job_id));

  const jobs = activeJobs ?? [];
  const missingLocation = jobs.filter((j) => !locatedSet.has(j.id));
  const missingCompensation = jobs.filter((j) => !compensatedSet.has(j.id));
  const missingDescription = jobs.filter((j) => !j.description || j.description.trim().length < 40);

  const orgs = companies ?? [];
  const companiesMissingDescription = orgs.filter((c) => !c.description);
  // No logo upload flow exists -- real employer logos are pulled live from
  // this website field (see components/ui/CompanyLogo.tsx), so a missing
  // website is what actually leaves a company without a real logo on site.
  const companiesMissingWebsite = orgs.filter((c) => !c.website);

  const { data: stalePending } = await db
    .from("raw_job_records")
    .select("id, received_at")
    .eq("status", "received")
    .lt("received_at", new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString());

  return {
    missingLocation,
    missingCompensation,
    missingDescription,
    companiesMissingDescription,
    companiesMissingWebsite,
    stalePendingIngestion: stalePending ?? [],
  };
}
