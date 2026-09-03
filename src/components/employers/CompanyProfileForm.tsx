"use client";

import { useState, useTransition } from "react";
import { updateCompanyProfile } from "@/features/employers/company-actions";

const SIZE_RANGES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];

export function CompanyProfileForm({
  initialDescription,
  initialWebsite,
  initialSizeRange,
}: {
  initialDescription: string;
  initialWebsite: string;
  initialSizeRange: string;
}) {
  const [description, setDescription] = useState(initialDescription);
  const [website, setWebsite] = useState(initialWebsite);
  const [sizeRange, setSizeRange] = useState(initialSizeRange);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    startTransition(async () => {
      const result = await updateCompanyProfile({ description, website, employeeSizeRange: sizeRange });
      if (!result.error) setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4 bg-white">
      <label className="block text-sm">
        Website
        <input
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="w-full border rounded-md px-3 py-2 mt-1"
        />
      </label>
      <label className="block text-sm">
        Company size
        <select value={sizeRange} onChange={(e) => setSizeRange(e.target.value)} className="w-full border rounded-md px-3 py-2 mt-1">
          <option value="">Not specified</option>
          {SIZE_RANGES.map((r) => (
            <option key={r} value={r}>
              {r} employees
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        About your company
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          className="w-full border rounded-md px-3 py-2 mt-1"
        />
      </label>
      <button type="submit" disabled={isPending} className="bg-accent-200 text-board hover:bg-accent-100 transition-colors px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50">
        {isPending ? "Saving…" : "Save"}
      </button>
      {saved && <span className="text-sm text-emerald-600 ml-3">Saved</span>}
    </form>
  );
}
