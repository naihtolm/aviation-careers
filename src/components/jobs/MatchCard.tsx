"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { getMatchScoreForJob } from "@/features/jobs/actions";
import type { MatchResult } from "@/features/jobs/match-score";

export function MatchCard({ jobId }: { jobId: string }) {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<{ signedIn: boolean; result?: MatchResult } | null>(null);

  function handleCheck() {
    startTransition(async () => {
      const response = await getMatchScoreForJob(jobId);
      setState(response);
    });
  }

  if (!state) {
    return (
      <div className="border rounded-lg p-4 bg-slate-50">
        <p className="font-medium text-slate-900 text-sm">Check My Match</p>
        <p className="text-sm text-slate-500 mt-1">See how well your profile lines up with this job's requirements.</p>
        <button
          onClick={handleCheck}
          disabled={isPending}
          className="mt-3 text-sm bg-brand-600 text-white hover:bg-brand-700 transition-colors px-4 py-1.5 rounded-md disabled:opacity-50"
        >
          {isPending ? "Checking…" : "Check My Match"}
        </button>
      </div>
    );
  }

  if (!state.signedIn) {
    return (
      <div className="border rounded-lg p-4 bg-slate-50">
        <p className="font-medium text-slate-900 text-sm">Check My Match</p>
        <p className="text-sm text-slate-500 mt-1">
          <Link href="/sign-in" className="text-brand-600 hover:underline">
            Sign in
          </Link>{" "}
          and complete your profile to see how well you match this job's requirements.
        </p>
      </div>
    );
  }

  const { result } = state;
  if (!result) return null;

  const allChecks = [
    ...result.certifications.map((c) => ({ label: c.name, met: c.met, requirementType: c.requirementType })),
    ...result.skills.map((s) => ({ label: s.name, met: s.met, requirementType: s.requirementType })),
    result.experience.applicable && { label: "Experience level", met: result.experience.met, requirementType: "required" as const },
    result.location.applicable && { label: "Location", met: result.location.met, requirementType: "preferred" as const },
    result.salary.applicable && { label: "Salary range", met: result.salary.met, requirementType: "preferred" as const },
    result.careerInterest.applicable && { label: "Career interest", met: result.careerInterest.met, requirementType: "preferred" as const },
  ].filter((c): c is { label: string; met: boolean; requirementType: "required" | "preferred" } => !!c);

  return (
    <div className="border rounded-lg p-4 bg-slate-50">
      <div className="flex items-center justify-between">
        <p className="font-medium text-slate-900 text-sm">Your Match</p>
        <span className="text-xl font-semibold text-slate-900">{result.score}%</span>
      </div>

      {result.hasMissingRequiredCertification && (
        <p className="text-xs text-amber-800 bg-amber-50 rounded px-2 py-1.5 mt-2">
          ⚠ This role requires a certification you don't have listed on your profile yet.
        </p>
      )}

      {allChecks.length > 0 && (
        <ul className="mt-3 space-y-1">
          {allChecks.map((check, i) => (
            <li key={i} className="text-xs flex items-center gap-1.5">
              <span className={check.met ? "text-emerald-600" : "text-amber-600"}>{check.met ? "✓" : "⚠"}</span>
              <span className={check.met ? "text-slate-600" : "text-slate-500"}>{check.label}</span>
              {check.requirementType === "required" && !check.met && (
                <span className="text-slate-400">(required)</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <Link href="/dashboard/profile" className="text-xs text-brand-600 hover:underline mt-3 inline-block">
        Update your profile →
      </Link>
    </div>
  );
}
