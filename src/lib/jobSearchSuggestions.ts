import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface KeywordSuggestion {
  id: string;
  label: string;
  type: "career" | "title";
}

// Careers and active jobs both have public-read RLS, so this queries
// directly from the browser client -- same pattern as airportSearch.ts.
export async function fetchKeywordSuggestions(query: string): Promise<KeywordSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const supabase = createSupabaseBrowserClient();
  const [{ data: careers }, { data: jobs }] = await Promise.all([
    supabase.from("careers").select("id, name").eq("active", true).ilike("name", `%${trimmed}%`).limit(4),
    // Over-fetch job titles and dedupe client-side -- Supabase's JS client
    // has no simple DISTINCT for an arbitrary column, and many postings
    // share an identical title ("Aircraft Mechanic" x N).
    supabase.from("jobs").select("id, title").eq("status", "active").ilike("title", `%${trimmed}%`).limit(20),
  ]);

  const careerSuggestions: KeywordSuggestion[] = (careers ?? []).map((c) => ({
    id: `career-${c.id}`,
    label: c.name,
    type: "career",
  }));

  const seenTitles = new Set<string>();
  const titleSuggestions: KeywordSuggestion[] = [];
  for (const j of jobs ?? []) {
    const key = j.title.toLowerCase();
    if (seenTitles.has(key)) continue;
    seenTitles.add(key);
    titleSuggestions.push({ id: `title-${j.id}`, label: j.title, type: "title" });
    if (titleSuggestions.length >= 5) break;
  }

  return [...careerSuggestions, ...titleSuggestions];
}
