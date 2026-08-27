"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SearchBar({
  defaultKeyword = "",
  defaultLocation = "",
}: {
  defaultKeyword?: string;
  defaultLocation?: string;
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
      className="flex flex-col sm:flex-row gap-2 bg-white rounded-lg border p-2 shadow-sm"
    >
      <input
        type="text"
        placeholder="Job title, career, or keyword"
        className="flex-1 px-3 py-2 outline-none"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <div className="hidden sm:block w-px bg-slate-200" />
      <input
        type="text"
        placeholder="City, state, or airport"
        className="flex-1 px-3 py-2 outline-none"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <button
        type="submit"
        className="bg-slate-900 text-white px-6 py-2 rounded-md hover:bg-slate-700 whitespace-nowrap"
      >
        Search Jobs
      </button>
    </form>
  );
}
