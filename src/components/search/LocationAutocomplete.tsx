"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Plane } from "lucide-react";
import { fetchPlaceSuggestions } from "@/lib/mapboxPlaces";
import { fetchAirportSuggestions } from "@/lib/airportSearch";

interface Suggestion {
  key: string;
  label: string;
  sublabel?: string;
  type: "airport" | "place";
  value: string;
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
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      const [airports, places] = await Promise.all([fetchAirportSuggestions(value), fetchPlaceSuggestions(value)]);
      if (id !== requestId.current) return; // a newer keystroke already superseded this request
      setSuggestions([
        ...airports.map((a) => ({ key: `airport-${a.id}`, label: a.label, sublabel: a.sublabel, type: "airport" as const, value: a.searchValue })),
        ...places.map((p) => ({ key: `place-${p.id}`, label: p.label, type: "place" as const, value: p.label })),
      ]);
      setHighlighted(0);
    }, 250);
    return () => clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function select(s: Suggestion) {
    onChange(s.value);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (suggestions[highlighted]) {
        e.preventDefault();
        select(suggestions[highlighted]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

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
        <ul className="absolute left-0 right-0 top-full mt-1 bg-white border rounded-md shadow-lg z-20 max-h-64 overflow-auto text-sm">
          {suggestions.map((s, i) => (
            <li key={s.key}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(s)}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors ${
                  i === highlighted ? "bg-brand-50" : "hover:bg-slate-50"
                }`}
              >
                {s.type === "airport" ? (
                  <Plane className="w-4 h-4 text-brand-600 shrink-0" />
                ) : (
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span className="min-w-0">
                  <span className="block text-slate-900 truncate">{s.label}</span>
                  {s.sublabel && <span className="block text-xs text-slate-400 truncate">{s.sublabel}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
