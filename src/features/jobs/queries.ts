// features/jobs/queries.ts
import { createServerActionClient } from "@/lib/supabase/server";

const JOB_SELECT = `
  id, slug, title, description, employment_type, experience_level,
  work_arrangement, application_type, application_url, published_at,
  companies ( id, name, slug, logo_path, website, verification_status ),
  careers ( id, name, slug ),
  job_locations ( id, is_primary, locations ( city, state_code, latitude, longitude ), airports ( iata_code, name, slug, city, state, latitude, longitude ) ),
  job_compensation ( pay_type, currency, min_amount, max_amount, period, is_public )
`;

export interface JobSearchParams {
  keyword?: string;
  careerCategorySlug?: string;
  careerSlug?: string;
  airportCode?: string;
  employmentType?: string;
  experienceLevel?: string;
  workArrangement?: string;
  salaryMin?: number;
  location?: string;
  radiusMiles?: number;
  publishedAfter?: string; // ISO timestamp — used by alert delivery to find only new matches
  page?: number;
  pageSize?: number;
}

function milesBetween(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocode(query: string): Promise<{ lat: number; lon: number } | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=1&country=US`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) return null;
    const [lon, lat] = feature.center;
    return { lat, lon };
  } catch {
    return null;
  }
}

// Radius filtering is done in application code (Haversine distance against
// job_locations -> locations lat/lng) rather than a PostGIS ST_DWithin
// query. At V1's data volume this is simple and fast enough; if the jobs
// table grows into the tens of thousands, move this to a dedicated RPC
// function that pushes the distance filter into Postgres/PostGIS instead.
export async function searchJobs(params: JobSearchParams) {
  const supabase = await createServerActionClient();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;

  let query = supabase
    .from("jobs")
    .select(JOB_SELECT, { count: "exact" })
    .eq("status", "active")
    .order("published_at", { ascending: false });

  if (params.publishedAfter) {
    query = query.gt("published_at", params.publishedAfter);
  }

  if (params.keyword) {
    query = query.textSearch("search_vector", params.keyword, {
      type: "websearch",
      config: "english",
    });
  }
  if (params.careerSlug) {
    query = query.eq("careers.slug", params.careerSlug);
  }
  if (params.employmentType) {
    query = query.eq("employment_type", params.employmentType);
  }
  if (params.experienceLevel) {
    query = query.eq("experience_level", params.experienceLevel);
  }
  if (params.workArrangement) {
    query = query.eq("work_arrangement", params.workArrangement);
  }
  if (params.airportCode) {
    query = query.eq("job_locations.airports.iata_code", params.airportCode);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(`Job search failed: ${error.message}`);

  let results = data ?? [];

  if (params.careerCategorySlug) {
    // careers.category_id isn't in JOB_SELECT's careers() join, so filter
    // by fetching the category's career ids separately would be cleaner —
    // kept simple here since V1 has very few careers per category.
    const { data: categoryCareers } = await supabase
      .from("careers")
      .select("id")
      .eq("category_id", params.careerCategorySlug);
    const ids = new Set((categoryCareers ?? []).map((c) => c.id));
    results = results.filter((j: any) => j.careers && ids.has(j.careers.id));
  }

  if (params.salaryMin) {
    results = results.filter((j: any) =>
      (j.job_compensation ?? []).some((c: any) => (c.max_amount ?? c.min_amount ?? 0) >= params.salaryMin!)
    );
  }

  if (params.location && params.radiusMiles) {
    const center = await geocode(params.location);
    if (center) {
      results = results.filter((j: any) =>
        (j.job_locations ?? []).some((jl: any) => {
          const point = jl.locations ?? jl.airports;
          if (!point?.latitude || !point?.longitude) return false;
          return milesBetween(center.lat, center.lon, point.latitude, point.longitude) <= params.radiusMiles!;
        })
      );
    }
  }

  return { jobs: results, total: count ?? results.length, page, pageSize };
}

export async function getJobBySlug(slug: string) {
  const supabase = await createServerActionClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(
      `${JOB_SELECT}, screening_questions, job_requirements ( * ), job_skills ( importance, requirement_type, skills ( name ) ), job_certifications ( requirement_type, certifications ( name ) )`
    )
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw new Error(`Failed to load job: ${error.message}`);
  // Cast: without generated DB types, supabase-js can't tell these
  // foreign-key embeds (company, career) are one-to-one rather than
  // one-to-many. Revisit once src/types/database.ts is generated.
  return data as any;
}

export async function getSimilarJobs(careerId: string | null, excludeJobId: string, limit = 4) {
  if (!careerId) return [];
  const supabase = await createServerActionClient();
  const { data } = await supabase
    .from("jobs")
    .select(JOB_SELECT)
    .eq("status", "active")
    .eq("career_id", careerId)
    .neq("id", excludeJobId)
    .limit(limit);
  return data ?? [];
}

export async function getSavedJobs(userId: string) {
  const supabase = await createServerActionClient();
  const { data } = await supabase
    .from("saved_jobs")
    .select(`created_at, jobs ( ${JOB_SELECT} )`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((row: any) => row.jobs).filter(Boolean);
}

export async function getSavedJobIds(userId: string | null): Promise<Set<string>> {
  if (!userId) return new Set();
  const supabase = await createServerActionClient();
  const { data } = await supabase.from("saved_jobs").select("job_id").eq("user_id", userId);
  return new Set((data ?? []).map((r) => r.job_id));
}

export async function hasAppliedToJob(userId: string | null, jobId: string): Promise<boolean> {
  if (!userId) return false;
  const supabase = await createServerActionClient();
  const { data } = await supabase
    .from("job_applications")
    .select("id")
    .eq("user_id", userId)
    .eq("job_id", jobId)
    .eq("status", "applied")
    .maybeSingle();
  return !!data;
}

export async function getFeaturedJobs(limit = 6) {
  const supabase = await createServerActionClient();
  const { data } = await supabase
    .from("jobs")
    .select(JOB_SELECT)
    .eq("status", "active")
    .order("published_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

// Real counts for the homepage hero stat strip -- head:true so these are
// cheap count-only queries, not full row fetches.
export async function getHomepageStats() {
  const supabase = await createServerActionClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [{ count: jobCount }, { count: companyCount }, { count: airportCount }, { count: newJobsThisWeek }] = await Promise.all([
    supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("companies").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("airports").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "active").gte("published_at", sevenDaysAgo),
  ]);
  return {
    jobCount: jobCount ?? 0,
    companyCount: companyCount ?? 0,
    airportCount: airportCount ?? 0,
    newJobsThisWeek: newJobsThisWeek ?? 0,
  };
}
