// features/salaries/queries.ts
import { createServerActionClient } from "@/lib/supabase/server";

export async function getCareersForSalaryPicker() {
  const supabase = await createServerActionClient();
  const { data: careers } = await supabase
    .from("careers")
    .select("id, name, slug, career_categories ( name, slug )")
    .eq("active", true)
    .order("name");
  if (!careers?.length) return [];

  // National median (location_id + experience_level both null) for each
  // career, so the picker can show a real pay figure instead of a bare link.
  // A career can now have one row per data_year (migration 033's trend
  // history) -- order oldest-first so the Map (last write wins per key)
  // settles on the newest year's median instead of an arbitrary one.
  const { data: aggregates } = await supabase
    .from("salary_aggregates")
    .select("career_id, salary_p50")
    .in(
      "career_id",
      careers.map((c) => c.id)
    )
    .is("location_id", null)
    .is("experience_level", null)
    .order("data_year", { ascending: true });

  const medianByCareer = new Map((aggregates ?? []).map((a) => [a.career_id, a.salary_p50]));

  return careers.map((c) => ({ ...c, medianSalary: medianByCareer.get(c.id) ?? null }));
}

export async function getSalaryDetail(careerSlug: string, locationSlug: string) {
  const supabase = await createServerActionClient();
  const { data: career } = await supabase
    .from("careers")
    .select("id, name, slug")
    .eq("slug", careerSlug)
    .maybeSingle();
  if (!career) return null;

  // "national" is the synthetic location slug for the location_id IS NULL
  // aggregate row (no location breakdown yet — that's Sprint 8+ population).
  let locationId: string | null = null;
  let locationLabel = "National";
  if (locationSlug !== "national") {
    const [city, state] = locationSlug.split("-");
    const { data: location } = await supabase
      .from("locations")
      .select("id, city, state_code")
      .ilike("city", city ?? "")
      .eq("state_code", (state ?? "").toUpperCase())
      .maybeSingle();
    if (!location) return null;
    locationId = location.id;
    locationLabel = `${location.city}, ${location.state_code}`;
  }

  // A career/location/experience combo can now carry one row per
  // data_year (migration 033) -- fetch the whole run, newest-first, so
  // `aggregate` (the current-snapshot display above the chart) is just
  // the first row, and `history` (oldest-first, for the trend chart) is
  // the same rows read the other way.
  let query = supabase.from("salary_aggregates").select("*").eq("career_id", career.id).is("experience_level", null);
  query = locationId ? query.eq("location_id", locationId) : query.is("location_id", null);
  const { data: rows } = await query.order("data_year", { ascending: false });

  const aggregate = rows?.[0] ?? null;
  const history = rows ? [...rows].reverse() : [];

  const { data: relatedJobs } = await supabase
    .from("jobs")
    .select("id, slug, title, companies ( name, slug )")
    .eq("career_id", career.id)
    .eq("status", "active")
    .limit(6);

  return { career, locationLabel, aggregate, history, relatedJobs: relatedJobs ?? [] };
}
