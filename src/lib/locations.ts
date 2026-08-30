// lib/locations.ts
//
// Shared by the employer job-post form and the admin ingestion review
// screen -- both need to turn a free-text city/state into a real
// `locations` row so job_locations.location_id is actually set (see
// migration-era comments in job-post-actions.ts and admin/jobs/review
// for the "Location not specified" bug this fixes in both places).

import { getServiceClient } from "@/lib/supabase/service";

export async function findOrCreateLocation(city: string, state: string) {
  const db = getServiceClient();
  const { data: existing } = await db
    .from("locations")
    .select("id")
    .ilike("city", city)
    .ilike("state_code", state)
    .maybeSingle();
  if (existing) return existing.id;
  const { data: created } = await db
    .from("locations")
    .insert({ city, state_code: state, display_name: `${city}, ${state}` })
    .select("id")
    .single();
  return created?.id ?? null;
}
