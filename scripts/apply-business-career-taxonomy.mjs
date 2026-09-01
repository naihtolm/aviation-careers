import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const category = {
  name: "Business, Finance & Corporate",
  slug: "business-finance-corporate",
  description: "Finance, accounting, program management, people operations, procurement, technology, and commercial roles supporting aviation organizations.",
  display_order: 8,
};

const { data: savedCategory, error: categoryError } = await db
  .from("career_categories")
  .upsert(category, { onConflict: "slug" })
  .select("id")
  .single();
if (categoryError) throw categoryError;

const careers = [
  ["Cost Analyst", "cost-analyst", "Analyzes program, manufacturing, maintenance, and operating costs.", true],
  ["Financial Analyst", "financial-analyst", "Builds budgets, forecasts, and financial models for aviation organizations.", true],
  ["Accountant", "accountant", "Maintains financial records, reporting, controls, and compliance.", true],
  ["Procurement Specialist", "procurement-specialist", "Sources aircraft parts, services, equipment, and supplier capacity.", true],
  ["Human Resources Specialist", "human-resources-specialist", "Supports recruiting, employee relations, benefits, and workforce programs.", true],
  ["Program Manager", "program-manager", "Coordinates complex aviation programs across schedule, cost, scope, and risk.", false],
  ["Business Development Specialist", "business-development-specialist", "Develops customer relationships, proposals, partnerships, and new revenue.", true],
  ["IT & Cybersecurity Specialist", "it-cybersecurity-specialist", "Protects and supports business, airport, airline, and operational technology systems.", true],
].map(([name, slug, short_description, entry_level]) => ({
  category_id: savedCategory.id,
  name,
  slug,
  short_description,
  entry_level,
  regulated: false,
  active: true,
}));

const { data: savedCareers, error: careersError } = await db
  .from("careers")
  .upsert(careers, { onConflict: "slug" })
  .select("id, name, slug");
if (careersError) throw careersError;

const careerBySlug = new Map((savedCareers ?? []).map((career) => [career.slug, career.id]));
const aliasesBySlug = {
  "cost-analyst": ["cost estimator", "pricing analyst"],
  "financial-analyst": ["finance analyst", "FP&A analyst"],
  "procurement-specialist": ["buyer", "sourcing specialist"],
  "human-resources-specialist": ["recruiter", "talent acquisition"],
  "program-manager": ["project manager"],
  "business-development-specialist": ["sales"],
  "it-cybersecurity-specialist": ["information security"],
};

for (const [slug, aliases] of Object.entries(aliasesBySlug)) {
  const careerId = careerBySlug.get(slug);
  const { data: existing, error: existingError } = await db
    .from("career_aliases")
    .select("alias")
    .eq("career_id", careerId);
  if (existingError) throw existingError;
  const existingAliases = new Set((existing ?? []).map((row) => row.alias.toLowerCase()));
  const missing = aliases.filter((alias) => !existingAliases.has(alias.toLowerCase()));
  if (missing.length) {
    const { error: aliasError } = await db
      .from("career_aliases")
      .insert(missing.map((alias) => ({ career_id: careerId, alias })));
    if (aliasError) throw aliasError;
  }
}

console.log(JSON.stringify({ category: category.name, careers: savedCareers?.map((career) => career.name) }, null, 2));
