// features/companies/queries.ts
import { createServerActionClient } from "@/lib/supabase/server";

export async function getFeaturedCompanies(limit = 6) {
  const supabase = await createServerActionClient();
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, slug, logo_path, website, company_type")
    .eq("status", "active")
    .limit(limit);
  if (!companies?.length) return [];

  const { data: jobCounts } = await supabase
    .from("jobs")
    .select("company_id")
    .eq("status", "active")
    .in(
      "company_id",
      companies.map((c) => c.id)
    );
  const counts = new Map<string, number>();
  for (const row of jobCounts ?? []) {
    counts.set(row.company_id, (counts.get(row.company_id) ?? 0) + 1);
  }
  return companies
    .map((c) => ({ ...c, jobCount: counts.get(c.id) ?? 0 }))
    .sort((a, b) => b.jobCount - a.jobCount);
}

export async function getVeteranFriendlyCompanies(limit = 12) {
  const supabase = await createServerActionClient();
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, slug, logo_path, website, company_type")
    .eq("status", "active")
    .eq("veteran_friendly", true)
    .limit(limit);
  if (!companies?.length) return [];

  const { data: jobCounts } = await supabase
    .from("jobs")
    .select("company_id")
    .eq("status", "active")
    .in(
      "company_id",
      companies.map((c) => c.id)
    );
  const counts = new Map<string, number>();
  for (const row of jobCounts ?? []) {
    counts.set(row.company_id, (counts.get(row.company_id) ?? 0) + 1);
  }
  return companies
    .map((c) => ({ ...c, jobCount: counts.get(c.id) ?? 0 }))
    .sort((a, b) => b.jobCount - a.jobCount);
}

export async function getCompanyBySlug(slug: string) {
  const supabase = await createServerActionClient();
  const { data: company } = await supabase
    .from("companies")
    .select("*, locations:headquarters_location_id ( city, state_code )")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  if (!company) return null;

  const [{ data: jobs }, { data: airportLinks }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, slug, title, employment_type, work_arrangement, published_at")
      .eq("company_id", company.id)
      .eq("status", "active")
      .order("published_at", { ascending: false }),
    supabase
      .from("company_airports")
      .select("relationship_type, airports ( iata_code, name, slug, city, state ) ")
      .eq("company_id", company.id)
      .eq("active", true),
  ]);

  return { company, jobs: jobs ?? [], airportLinks: airportLinks ?? [] };
}
