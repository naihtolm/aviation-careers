import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface AirportSuggestion {
  id: string;
  label: string;
  sublabel: string;
  searchValue: string;
}

// Airports have public-read RLS (011_public_reference_rls.sql), so this can
// query directly from the browser via the anon client -- no server round
// trip needed for a type-ahead lookup.
export async function fetchAirportSuggestions(query: string): Promise<AirportSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const supabase = createSupabaseBrowserClient();
  const { data } = await supabase
    .from("airports")
    .select("id, name, iata_code, icao_code, city, state")
    .eq("active", true)
    .or(`name.ilike.%${trimmed}%,city.ilike.%${trimmed}%,iata_code.ilike.%${trimmed}%`)
    .limit(5);

  return (data ?? []).map((a) => {
    const code = a.iata_code ?? a.icao_code ?? "";
    const label = code ? `${a.name} (${code})` : a.name;
    return {
      id: a.id,
      label,
      sublabel: [a.city, a.state].filter(Boolean).join(", "),
      searchValue: label,
    };
  });
}
