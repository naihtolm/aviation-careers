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

export async function getCareers(categorySlug?: string) {
  const supabase = await createServerActionClient();
  let query = supabase
    .from("careers")
    .select("id, name, slug, short_description, entry_level, regulated, career_categories ( name, slug )")
    .eq("active", true)
    .order("name");

  if (categorySlug) {
    query = query.eq("career_categories.slug", categorySlug);
  }

  const { data } = await query;
  return (data ?? []).filter((c: any) => !categorySlug || c.career_categories?.slug === categorySlug);
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
    supabase
      .from("salary_aggregates")
      .select("*")
      .eq("career_id", career.id)
      .is("location_id", null)
      .is("experience_level", null)
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
