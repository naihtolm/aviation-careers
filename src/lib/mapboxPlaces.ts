export interface PlaceSuggestion {
  id: string;
  label: string;
  city: string;
  stateCode: string;
}

// Mapbox's free-tier Geocoding API, called directly from the browser --
// NEXT_PUBLIC_MAPBOX_TOKEN is already shipped to the client bundle (used by
// AirportMap), so there's no need to proxy this through our own server.
export async function fetchPlaceSuggestions(query: string): Promise<PlaceSuggestion[]> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token || query.trim().length < 2) return [];

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&types=place&country=US&limit=5`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features ?? []).map((f: any) => {
      const regionContext = (f.context ?? []).find((c: any) => typeof c.id === "string" && c.id.startsWith("region"));
      const stateCode = regionContext?.short_code?.replace(/^US-/, "") ?? "";
      return {
        id: f.id,
        label: stateCode ? `${f.text}, ${stateCode}` : f.text,
        city: f.text,
        stateCode,
      };
    });
  } catch {
    return [];
  }
}
