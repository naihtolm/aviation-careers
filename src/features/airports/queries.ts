// features/airports/queries.ts
import { createServerActionClient } from "@/lib/supabase/server";

export async function getAirports() {
  const supabase = await createServerActionClient();
  const { data: airports } = await supabase
    .from("airports")
    .select("id, iata_code, name, slug, city, state, latitude, longitude")
    .eq("active", true)
    .order("name");

  if (!airports?.length) return [];

  const { data: locations } = await supabase
    .from("job_locations")
    .select("airport_id")
    .in(
      "airport_id",
      airports.map((a) => a.id)
    );

  const counts = new Map<string, number>();
  for (const row of locations ?? []) {
    if (row.airport_id) counts.set(row.airport_id, (counts.get(row.airport_id) ?? 0) + 1);
  }

  return airports.map((a) => ({ ...a, jobCount: counts.get(a.id) ?? 0 }));
}

export async function getAirportByCode(code: string) {
  const supabase = await createServerActionClient();
  const { data: airport } = await supabase
    .from("airports")
    .select("*")
    .eq("iata_code", code.toUpperCase())
    .eq("active", true)
    .maybeSingle();
  if (!airport) return null;

  const [{ data: companyLinks }, { data: jobLocations }] = await Promise.all([
    supabase
      .from("company_airports")
      .select("relationship_type, companies ( id, name, slug, company_type, status )")
      .eq("airport_id", airport.id)
      .eq("active", true),
    supabase
      .from("job_locations")
      .select(
        `jobs (
          id, slug, title, status, employment_type, work_arrangement,
          companies ( name, slug, verification_status ),
          careers ( name, slug ),
          job_locations ( is_primary, locations ( city, state_code ), airports ( city, state ) ),
          job_compensation ( pay_type, currency, min_amount, max_amount, period, is_public )
        )`
      )
      .eq("airport_id", airport.id),
  ]);

  const jobs = (jobLocations ?? [])
    .map((jl: any) => jl.jobs)
    .filter((j: any) => j && j.status === "active");

  return { airport, companies: companyLinks ?? [], jobs };
}
