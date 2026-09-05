"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Zap, Check } from "lucide-react";
import { submitNativeApplication } from "@/features/applications/actions";

// One-click apply straight from a listing card -- only offered when
// there's genuinely nothing to ask first: a native (non-external-
// redirect) application with no screening questions. Anything else
// (an external employer site, or a job with its own questions) still
// routes through the full apply flow on the job detail page, since
// "quick" apply that silently skips real questions would misrepresent
// the application.
export function QuickApplyButton({ jobId, initialApplied = false }: { jobId: string; initialApplied?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [applied, setApplied] = useState(initialApplied);
  const [error, setError] = useState<string | null>(null);

  function handleClick(e: React.MouseEvent) {
    // JobCard wraps this in a <Link> for the card click-through.
    e.preventDefault();
    e.stopPropagation();
    if (applied || isPending) return;

    setError(null);
    startTransition(async () => {
      const result = await submitNativeApplication(jobId, {});
      if (result.error === "resume_required") {
        setError("resume_required");
        return;
      }
      if (result.error === "already_applied") {
        setApplied(true);
        return;
      }
      if (result.error) {
        setError(result.error);
        return;
      }
      setApplied(true);
    });
  }

  if (applied) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-md">
        <Check className="w-3.5 h-3.5" /> Applied
      </span>
    );
  }

  return (
    <span className="relative inline-block">
      <button
        onClick={handleClick}
        disabled={isPending}
        title="Apply with your saved profile and resume — no extra steps"
        className="inline-flex items-center gap-1 text-xs font-semibold text-accent-700 bg-accent-50 hover:bg-accent-100 px-2.5 py-1.5 rounded-md transition-colors disabled:opacity-50"
      >
        <Zap className="w-3.5 h-3.5" />
        {isPending ? "Applying…" : "Quick Apply"}
      </button>
      {error === "resume_required" && (
        <span className="absolute top-full right-0 mt-1 text-xs bg-white border rounded-md shadow-lg px-3 py-2 w-52 z-10">
          <span className="block text-slate-700">Add a resume to your profile to use Quick Apply.</span>
          <Link href="/dashboard/resume" className="text-brand-600 font-medium hover:underline hover:text-brand-700 transition-colors">
            Upload resume →
          </Link>
        </span>
      )}
      {error && error !== "resume_required" && (
        <span className="absolute top-full right-0 mt-1 text-xs text-red-600 bg-white border rounded-md shadow-lg px-2.5 py-1.5 whitespace-nowrap z-10">
          {error}
        </span>
      )}
    </span>
  );
}
