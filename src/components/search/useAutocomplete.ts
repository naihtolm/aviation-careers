import { useEffect, useRef, useState } from "react";

// Shared debounce/keyboard-nav/click-outside plumbing for a type-ahead text
// input -- used by both LocationAutocomplete and KeywordAutocomplete, which
// otherwise differ only in what they fetch and how a suggestion renders.
export function useAutocomplete<T>({
  value,
  onChange,
  fetchSuggestions,
  getValue,
  debounceMs = 250,
}: {
  value: string;
  onChange: (value: string) => void;
  fetchSuggestions: (query: string) => Promise<T[]>;
  getValue: (item: T) => string;
  debounceMs?: number;
}) {
  const [suggestions, setSuggestions] = useState<T[]>([]);
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
      const results = await fetchSuggestions(value);
      if (id !== requestId.current) return; // a newer keystroke already superseded this request
      setSuggestions(results);
      setHighlighted(0);
    }, debounceMs);
    return () => clearTimeout(timer);
    // fetchSuggestions/getValue are expected to be stable (module-level or
    // useCallback'd by the caller) -- omitted to avoid re-running the
    // effect every render if a caller passes an inline function.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function select(item: T) {
    onChange(getValue(item));
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

  return { containerRef, open, setOpen, suggestions, highlighted, select, handleKeyDown };
}
