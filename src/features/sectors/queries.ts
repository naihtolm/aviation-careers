import { createServerActionClient } from "@/lib/supabase/server";
import { SECTORS, getSectorBySlug } from "@/lib/sectors";

export async function getSectorStats() {
  const supabase = await createServerActionClient();
  const { data: companies } = await supabase
    .from("companies")
    .select("id, company_type")
    .eq("status", "active");
  if (!companies?.length) return SECTORS.map((s) => ({ ...s, companyCount: 0, jobCount: 0 }));

  const { data: jobCounts } = await supabase
    .from("jobs")
    .select("company_id")
    .eq("status", "active")
    .in(
      "company_id",
      companies.map((c) => c.id)
    );
  const jobsByCompany = new Map<string, number>();
  for (const row of jobCounts ?? []) {
    jobsByCompany.set(row.company_id, (jobsByCompany.get(row.company_id) ?? 0) + 1);
  }

  return SECTORS.map((sector) => {
    const sectorCompanies = companies.filter((c) => sector.companyTypes.includes(c.company_type ?? ""));
    const jobCount = sectorCompanies.reduce((sum, c) => sum + (jobsByCompany.get(c.id) ?? 0), 0);
    return { ...sector, companyCount: sectorCompanies.length, jobCount };
  });
}

export async function getSectorDetail(slug: string) {
  const sector = getSectorBySlug(slug);
  if (!sector) return null;

  const supabase = await createServerActionClient();
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, slug, logo_path, website, company_type")
    .eq("status", "active")
    .in("company_type", sector.companyTypes);

  if (!companies?.length) return { sector, companies: [] };

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

  const companiesWithCounts = companies
    .map((c) => ({ ...c, jobCount: counts.get(c.id) ?? 0 }))
    .sort((a, b) => b.jobCount - a.jobCount);

  return { sector, companies: companiesWithCounts };
}
