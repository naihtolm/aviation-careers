"use client";

import { MapPin, Plane } from "lucide-react";
import { fetchPlaceSuggestions } from "@/lib/mapboxPlaces";
import { fetchAirportSuggestions } from "@/lib/airportSearch";
import { useAutocomplete } from "@/components/search/useAutocomplete";

interface Suggestion {
  key: string;
  label: string;
  sublabel?: string;
  type: "airport" | "place";
  value: string;
}

async function fetchLocationSuggestions(query: string): Promise<Suggestion[]> {
  const [airports, places] = await Promise.all([fetchAirportSuggestions(query), fetchPlaceSuggestions(query)]);
  return [
    ...airports.map((a) => ({ key: `airport-${a.id}`, label: a.label, sublabel: a.sublabel, type: "airport" as const, value: a.searchValue })),
    ...places.map((p) => ({ key: `place-${p.id}`, label: p.label, type: "place" as const, value: p.label })),
  ];
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const { containerRef, open, setOpen, suggestions, highlighted, select, handleKeyDown } = useAutocomplete({
    value,
    onChange,
    fetchSuggestions: fetchLocationSuggestions,
    getValue: (s) => s.value,
  });

  return (
    <div ref={containerRef} className="relative flex-1">
      <input
        type="text"
        placeholder={placeholder}
        className={className}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full mt-1 bg-board-2 border border-white/15 rounded-md shadow-lg z-20 max-h-64 overflow-auto text-sm">
          {suggestions.map((s, i) => (
            <li key={s.key}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(s)}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors ${
                  i === highlighted ? "bg-brand-400/15" : "hover:bg-white/5"
                }`}
              >
                {s.type === "airport" ? (
                  <Plane className="w-4 h-4 text-brand-300 shrink-0" />
                ) : (
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span className="min-w-0">
                  <span className="block text-white truncate">{s.label}</span>
                  {s.sublabel && <span className="block text-xs text-slate-500 truncate">{s.sublabel}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
