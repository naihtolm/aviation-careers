"use client";

import { useTransition } from "react";
import { updateApplicationStatus } from "@/features/employers/applicant-actions";
import { titleCase } from "@/lib/text";

type Applicant = {
  id: string;
  status: string;
  applied_at: string | null;
  screening_answers: Record<string, string> | null;
  profile: { first_name: string | null; last_name: string | null; display_name: string | null; email: string } | null;
  resumeUrl: string | null;
  resumeFileName: string | null;
};

const STATUSES = ["applied", "interviewing", "offer", "rejected"] as const;

export function ApplicantList({ jobId, applicants }: { jobId: string; applicants: Applicant[] }) {
  const [isPending, startTransition] = useTransition();

  if (applicants.length === 0) {
    return <p className="text-sm text-slate-500">No applicants yet.</p>;
  }

  return (
    <div className="space-y-3">
      {applicants.map((a) => {
        const name = a.profile?.display_name || [a.profile?.first_name, a.profile?.last_name].filter(Boolean).join(" ") || a.profile?.email || "Applicant";
        return (
          <div key={a.id} className="border rounded-lg p-4 bg-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-900">{name}</p>
                {a.profile?.email && <p className="text-xs text-slate-500">{a.profile.email}</p>}
                <p className="text-xs text-slate-400 mt-0.5">
                  Applied {a.applied_at ? new Date(a.applied_at).toLocaleDateString() : "—"}
                </p>
              </div>
              <select
                value={a.status}
                disabled={isPending}
                onChange={(e) => {
                  const status = e.target.value as (typeof STATUSES)[number];
                  startTransition(async () => {
                    await updateApplicationStatus(a.id, jobId, status);
                  });
                }}
                className="border rounded-md px-2 py-1.5 text-sm disabled:opacity-50"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {titleCase(s)}
                  </option>
                ))}
              </select>
            </div>

            {a.resumeUrl && (
              <a href={a.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 hover:underline mt-2 inline-block hover:text-brand-700 transition-colors">
                View resume{a.resumeFileName ? ` (${a.resumeFileName})` : ""}
              </a>
            )}

            {a.screening_answers && Object.keys(a.screening_answers).length > 0 && (
              <div className="mt-3 border-t pt-3 space-y-1">
                {Object.entries(a.screening_answers).map(([question, answer]) => (
                  <p key={question} className="text-sm">
                    <span className="text-slate-500">{question}:</span> <span className="text-slate-900">{String(answer)}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
