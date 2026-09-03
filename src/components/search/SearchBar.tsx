"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LocationAutocomplete } from "@/components/search/LocationAutocomplete";
import { KeywordAutocomplete } from "@/components/search/KeywordAutocomplete";

export function SearchBar({
  defaultKeyword = "",
  defaultLocation = "",
  dark = false,
}: {
  defaultKeyword?: string;
  defaultLocation?: string;
  dark?: boolean;
}) {
  const router = useRouter();
  const [keyword, setKeyword] = useState(defaultKeyword);
  const [location, setLocation] = useState(defaultLocation);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (location) params.set("location", location);
    router.push(`/jobs?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        dark
          ? "flex flex-col sm:flex-row gap-2 bg-white/10 border border-white/20 backdrop-blur-sm rounded-lg p-2"
          : "flex flex-col sm:flex-row gap-2 bg-white rounded-lg border p-2 shadow-sm"
      }
    >
      <KeywordAutocomplete
        placeholder="Job title, career, or keyword"
        className={
          dark ? "w-full px-3 py-2 outline-none bg-transparent text-white placeholder:text-slate-400" : "w-full px-3 py-2 outline-none"
        }
        value={keyword}
        onChange={setKeyword}
      />
      <div className={dark ? "hidden sm:block w-px bg-white/20" : "hidden sm:block w-px bg-slate-200"} />
      <LocationAutocomplete
        placeholder="City, state, or airport"
        className={
          dark ? "w-full px-3 py-2 outline-none bg-transparent text-white placeholder:text-slate-400" : "w-full px-3 py-2 outline-none"
        }
        value={location}
        onChange={setLocation}
      />
      <button
        type="submit"
        className="bg-accent-200 text-board font-semibold px-6 py-2 rounded-md hover:bg-accent-100 transition-colors whitespace-nowrap"
      >
        Search Jobs
      </button>
    </form>
  );
}
