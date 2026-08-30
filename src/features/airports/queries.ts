// features/airports/queries.ts
import { createServerActionClient } from "@/lib/supabase/server";

export async function getAirports() {
  const supabase = await createServerActionClient();
  const { data: airports } = await supabase
    .from("airports")
    .select("id, iata_code, icao_code, name, slug, city, state, latitude, longitude, airport_type")
    .eq("active", true)
    .order("name");

  if (!airports?.length) return [];

  // Joining through jobs (rather than just counting job_locations rows)
  // both scopes the count to active listings -- the previous version
  // counted every job_locations row regardless of the job's status -- and
  // gives us each job's career for the "most in-demand role" figure below.
  const { data: locations } = await supabase
    .from("job_locations")
    .select("airport_id, jobs ( status, careers ( name ) )")
    .in(
      "airport_id",
      airports.map((a) => a.id)
    );

  const counts = new Map<string, number>();
  const careerCountsByAirport = new Map<string, Map<string, number>>();
  for (const row of locations ?? []) {
    const job = row.jobs as any;
    if (!row.airport_id || !job || job.status !== "active") continue;
    counts.set(row.airport_id, (counts.get(row.airport_id) ?? 0) + 1);

    const careerName = job.careers?.name;
    if (careerName) {
      const careerCounts = careerCountsByAirport.get(row.airport_id) ?? new Map<string, number>();
      careerCounts.set(careerName, (careerCounts.get(careerName) ?? 0) + 1);
      careerCountsByAirport.set(row.airport_id, careerCounts);
    }
  }

  function topCareerFor(airportId: string) {
    const careerCounts = careerCountsByAirport.get(airportId);
    if (!careerCounts?.size) return null;
    let best: { name: string; count: number } | null = null;
    for (const [name, count] of careerCounts) {
      if (!best || count > best.count) best = { name, count };
    }
    return best;
  }

  // Carrier/hub relationships for the map popup -- "is this airport a
  // hub, and for who" per company_airports (005_companies_and_employers.sql).
  const { data: companyLinks } = await supabase
    .from("company_airports")
    .select("airport_id, relationship_type, companies ( name )")
    .in(
      "airport_id",
      airports.map((a) => a.id)
    )
    .eq("active", true);

  const companiesByAirport = new Map<string, { name: string; relationshipType: string }[]>();
  for (const row of companyLinks ?? []) {
    if (!row.airport_id) continue;
    const list = companiesByAirport.get(row.airport_id) ?? [];
    const companyName = (row.companies as any)?.name;
    if (companyName) list.push({ name: companyName, relationshipType: row.relationship_type });
    companiesByAirport.set(row.airport_id, list);
  }

  return airports.map((a) => ({
    ...a,
    jobCount: counts.get(a.id) ?? 0,
    companies: companiesByAirport.get(a.id) ?? [],
    topCareer: topCareerFor(a.id),
  }));
}

export async function getAirportByCode(code: string) {
  const supabase = await createServerActionClient();
  // Not every airport has an IATA code -- general aviation fields like
  // Manassas Regional are commonly ICAO-only. Route by whichever code the
  // airport actually has (see the ?? fallback everywhere this is linked).
  const upperCode = code.toUpperCase();
  const { data: airport } = await supabase
    .from("airports")
    .select("*")
    .or(`iata_code.eq.${upperCode},icao_code.eq.${upperCode}`)
    .eq("active", true)
    .maybeSingle();
  if (!airport) return null;

  const [{ data: companyLinks }, { data: jobLocations }] = await Promise.all([
    supabase
      .from("company_airports")
      .select("relationship_type, companies ( id, name, slug, website, company_type, status )")
      .eq("airport_id", airport.id)
      .eq("active", true),
    supabase
      .from("job_locations")
      .select(
        `jobs (
          id, slug, title, status, employment_type, work_arrangement,
          companies ( name, slug, website, verification_status ),
          careers ( name, slug ),
          job_locations ( is_primary, locations ( city, state_code ), airports ( city, state ) ),
          job_compensation ( pay_type, currency, min_amount, max_amount, period, is_public ),
          published_at
        )`
      )
      .eq("airport_id", airport.id),
  ]);

  const jobs = (jobLocations ?? [])
    .map((jl: any) => jl.jobs)
    .filter((j: any) => j && j.status === "active");

  return { airport, companies: companyLinks ?? [], jobs };
}
