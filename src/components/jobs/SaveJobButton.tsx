"use client";

import { useState, useTransition } from "react";
import { saveJob, unsaveJob } from "@/features/jobs/actions";

export function SaveJobButton({ jobId, initialSaved = false }: { jobId: string; initialSaved?: boolean }) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleClick(e: React.MouseEvent) {
    // JobCard wraps this in a <Link> for the card-click-through; stop the
    // click from also triggering navigation.
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      if (saved) {
        const result = await unsaveJob(jobId);
        if (!result.error) setSaved(false);
        return;
      }
      const result = await saveJob(jobId);
      if (result.error === "sign_in_required") {
        setMessage("Sign in to save jobs.");
        return;
      }
      if (!result.error) setSaved(true);
    });
  }

  return (
    <span className="relative inline-block">
      <button
        onClick={handleClick}
        disabled={isPending}
        className={`text-sm border rounded-md px-2 py-1 disabled:opacity-50 ${
          saved ? "bg-slate-900 text-white border-slate-900" : "text-slate-600 hover:border-slate-400"
        }`}
      >
        {saved ? "Saved ✓" : "Save"}
      </button>
      {message && (
        <span className="absolute top-full left-0 mt-1 text-xs text-red-600 bg-white border rounded px-2 py-1 whitespace-nowrap z-10">
          {message}
        </span>
      )}
    </span>
  );
}
