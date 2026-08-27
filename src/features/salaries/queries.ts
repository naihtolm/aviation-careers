// features/salaries/queries.ts
import { createServerActionClient } from "@/lib/supabase/server";

export async function getCareersForSalaryPicker() {
  const supabase = await createServerActionClient();
  const { data } = await supabase.from("careers").select("id, name, slug").eq("active", true).order("name");
  return data ?? [];
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

  let query = supabase.from("salary_aggregates").select("*").eq("career_id", career.id).is("experience_level", null);
  query = locationId ? query.eq("location_id", locationId) : query.is("location_id", null);
  const { data: aggregate } = await query.maybeSingle();

  const { data: relatedJobs } = await supabase
    .from("jobs")
    .select("id, slug, title, companies ( name, slug )")
    .eq("career_id", career.id)
    .eq("status", "active")
    .limit(6);

  return { career, locationLabel, aggregate, relatedJobs: relatedJobs ?? [] };
}
