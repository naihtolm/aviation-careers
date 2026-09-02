import { createServerActionClient } from "@/lib/supabase/server";

export async function getCertifications() {
  const supabase = await createServerActionClient();
  const { data: certifications } = await supabase
    .from("certifications")
    .select("id, name, issuing_authority, category, description")
    .order("category")
    .order("name");
  if (!certifications?.length) return [];

  const { data: links } = await supabase
    .from("career_certification_requirements")
    .select("certification_id, requirement_type, careers ( name, slug )")
    .in(
      "certification_id",
      certifications.map((c) => c.id)
    );

  const careersByCert = new Map<string, { name: string; slug: string; requirementType: string }[]>();
  for (const row of links ?? []) {
    if (!row.certification_id) continue;
    const career = row.careers as any;
    if (!career) continue;
    const list = careersByCert.get(row.certification_id) ?? [];
    list.push({ name: career.name, slug: career.slug, requirementType: row.requirement_type });
    careersByCert.set(row.certification_id, list);
  }

  return certifications.map((c) => ({ ...c, careers: careersByCert.get(c.id) ?? [] }));
}
