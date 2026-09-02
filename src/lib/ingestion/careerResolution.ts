// lib/ingestion/careerResolution.ts
//
// Creates a new careers row from an AI classification (aiCareerClassifier)
// or the admin's own inline "create a new career role" form (RawJobCard) --
// one insert path so both stay in sync instead of drifting.

import type { SupabaseClient } from "@supabase/supabase-js";

export interface NewCareer {
  id: string;
  name: string;
  categoryName: string | null;
}

export async function createCareer(
  db: SupabaseClient,
  input: { name: string; categoryId: string; shortDescription: string | null }
): Promise<NewCareer> {
  const slug = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const { data: career, error } = await db
    .from("careers")
    .upsert(
      {
        category_id: input.categoryId,
        name: input.name,
        slug,
        short_description: input.shortDescription,
        active: true,
      },
      { onConflict: "slug" }
    )
    .select("id, name, career_categories ( name )")
    .single();

  if (error) throw new Error(`Failed to create career role: ${error.message}`);

  return { id: career.id, name: career.name, categoryName: (career.career_categories as any)?.name ?? null };
}
