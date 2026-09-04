"use client";

import { GraduationCap, Briefcase } from "lucide-react";
import { fetchKeywordSuggestions, type KeywordSuggestion } from "@/lib/jobSearchSuggestions";
import { useAutocomplete } from "@/components/search/useAutocomplete";

export function KeywordAutocomplete({
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
  const { containerRef, open, setOpen, suggestions, highlighted, select, handleKeyDown } = useAutocomplete<KeywordSuggestion>({
    value,
    onChange,
    fetchSuggestions: fetchKeywordSuggestions,
    getValue: (s) => s.label,
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
            <li key={s.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(s)}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors ${
                  i === highlighted ? "bg-brand-400/15" : "hover:bg-white/5"
                }`}
              >
                {s.type === "career" ? (
                  <GraduationCap className="w-4 h-4 text-brand-300 shrink-0" />
                ) : (
                  <Briefcase className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span className="text-white truncate">{s.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
