// features/careers/queries.ts
import { createServerActionClient } from "@/lib/supabase/server";

export async function getCareerCategories() {
  const supabase = await createServerActionClient();
  const { data } = await supabase
    .from("career_categories")
    .select("id, name, slug, description, icon")
    .order("display_order");
  return data ?? [];
}

export interface CareerFilters {
  categorySlug?: string;
  entryLevelOnly?: boolean;
  regulatedOnly?: boolean;
  // "entry_level" surfaces entry-level-friendly guides first (for someone
  // just starting out) while still ordering alphabetically within each
  // group; "name" is a plain A-Z browse.
  sort?: "name" | "entry_level";
}

export async function getCareers(filters: CareerFilters = {}) {
  const supabase = await createServerActionClient();
  let query = supabase
    .from("careers")
    .select("id, name, slug, short_description, entry_level, regulated, career_categories ( name, slug )")
    .eq("active", true);

  if (filters.categorySlug) {
    query = query.eq("career_categories.slug", filters.categorySlug);
  }
  if (filters.entryLevelOnly) {
    query = query.eq("entry_level", true);
  }
  if (filters.regulatedOnly) {
    query = query.eq("regulated", true);
  }

  query =
    filters.sort === "entry_level"
      ? query.order("entry_level", { ascending: false }).order("name")
      : query.order("name");

  const { data } = await query;
  // Supabase's .eq() on an embedded relation doesn't reliably restrict
  // rows for a left-joined select, so this re-filters client-side too --
  // same belt-and-suspenders approach the original code used.
  return (data ?? []).filter((c: any) => !filters.categorySlug || c.career_categories?.slug === filters.categorySlug);
}

export async function getCareerBySlug(slug: string) {
  const supabase = await createServerActionClient();
  const { data: career } = await supabase
    .from("careers")
    .select(
      "id, name, slug, short_description, full_description, typical_training, entry_level, regulated, career_categories ( name, slug )"
    )
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (!career) return null;
  // See the same cast note in features/jobs/queries.ts — no generated
  // DB types yet, so the one-to-one career_categories embed infers as
  // an array.
  const typedCareer = career as any;

  const [{ data: content }, { data: salary }, { data: certRequirements }, { data: jobs }] = await Promise.all([
    supabase.from("career_content").select("*").eq("career_id", career.id).not("published_at", "is", null).maybeSingle(),
    // A career can carry one salary_aggregates row per data_year
    // (migration 033's trend history) -- .maybeSingle() here would error
    // on 2+ rows, so this takes the newest year instead, same fix
    // already applied in features/salaries/queries.ts.
    supabase
      .from("salary_aggregates")
      .select("*")
      .eq("career_id", career.id)
      .is("location_id", null)
      .is("experience_level", null)
      .order("data_year", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("career_certification_requirements")
      .select("requirement_type, notes, certifications ( name, issuing_authority )")
      .eq("career_id", career.id),
    supabase
      .from("jobs")
      .select("id, slug, title, companies ( name, slug )")
      .eq("career_id", career.id)
      .eq("status", "active")
      .limit(10),
  ]);

  return { career: typedCareer, content, salary, certRequirements: certRequirements ?? [], jobs: jobs ?? [] };
}
