"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateJobStatus, renewJobExpiry } from "@/features/employers/job-post-actions";

type Job = {
  id: string;
  title: string;
  slug: string;
  status: string;
  application_type: string;
  applicantCount: number;
  expires_at: string | null;
};

const TABS = ["active", "draft", "paused", "expired", "archived"] as const;

// expires_at passing doesn't flip jobs.status in the DB (no cron -- see
// migration 019's comment), so "expired" here is derived at render time:
// still status='active', just past its expiry date.
function derivedStatus(job: Job): (typeof TABS)[number] | string {
  if (job.status === "active" && job.expires_at && new Date(job.expires_at) < new Date()) return "expired";
  return job.status;
}

export function ManageJobsList({ jobs }: { jobs: Job[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("active");
  const [isPending, startTransition] = useTransition();

  const withStatus = jobs.map((j) => ({ ...j, derived: derivedStatus(j) }));
  const filtered = withStatus.filter((j) => j.derived === tab);

  function handleStatusChange(jobId: string, status: "active" | "paused" | "expired" | "archived") {
    startTransition(() => updateJobStatus(jobId, status));
  }

  function handleRenew(jobId: string) {
    startTransition(() => renewJobExpiry(jobId));
  }

  return (
    <div>
      <div className="flex gap-1 border-b border-white/10 mb-4">
        {TABS.map((t) => {
          const count = withStatus.filter((j) => j.derived === t).length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm capitalize border-b-2 -mb-px transition-colors ${
                tab === t ? "border-accent-200 text-white font-medium" : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {t} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && <p className="text-sm text-slate-400">No {tab} jobs.</p>}

      <div className="space-y-3">
        {filtered.map((job) => (
          <div key={job.id} className="border border-white/10 rounded-lg p-4 bg-white/[0.04] flex items-center justify-between">
            <div>
              {job.derived === "draft" ? (
                <span className="font-medium text-white">{job.title || "Untitled draft"}</span>
              ) : (
                <Link href={`/jobs/${job.slug}`} className="font-medium text-white hover:underline hover:text-brand-300 transition-colors">
                  {job.title}
                </Link>
              )}
              <p className="text-xs text-slate-400 mt-0.5 capitalize">
                {job.derived === "draft" ? (
                  "Not published yet"
                ) : (
                  <>
                    {job.application_type.replace("_", " ")}
                    {job.application_type === "platform_application" && (
                      <>
                        {" · "}
                        <Link href={`/employer/jobs/${job.id}/applicants`} className="text-brand-300 hover:underline hover:text-brand-200 transition-colors">
                          {job.applicantCount} applicant{job.applicantCount === 1 ? "" : "s"}
                        </Link>
                      </>
                    )}
                  </>
                )}
                {job.derived === "expired" && job.expires_at && (
                  <span className="text-amber-300"> · expired {new Date(job.expires_at).toLocaleDateString()}</span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              {(job.derived === "draft" || job.derived === "active" || job.derived === "paused" || job.derived === "expired") && (
                <Link href={`/employer/jobs/${job.id}/edit`} className="text-sm border border-white/15 text-slate-200 rounded-md px-3 py-1.5 hover:bg-white/5 transition-colors">
                  Edit
                </Link>
              )}
              {job.derived === "expired" && (
                <button
                  disabled={isPending}
                  onClick={() => handleRenew(job.id)}
                  className="text-sm border border-accent-200 bg-accent-200 text-board hover:bg-accent-100 transition-colors rounded-md px-3 py-1.5 disabled:opacity-50"
                >
                  Renew
                </button>
              )}
              {job.derived === "active" && (
                <button
                  disabled={isPending}
                  onClick={() => handleStatusChange(job.id, "paused")}
                  className="text-sm border border-white/15 text-slate-200 rounded-md px-3 py-1.5 disabled:opacity-50 hover:bg-white/5 transition-colors"
                >
                  Pause
                </button>
              )}
              {job.derived === "paused" && (
                <button
                  disabled={isPending}
                  onClick={() => handleStatusChange(job.id, "active")}
                  className="text-sm border border-white/15 text-slate-200 rounded-md px-3 py-1.5 disabled:opacity-50 hover:bg-white/5 transition-colors"
                >
                  Resume
                </button>
              )}
              {(job.derived === "active" || job.derived === "paused" || job.derived === "expired" || job.derived === "draft") && (
                <button
                  disabled={isPending}
                  onClick={() => handleStatusChange(job.id, "archived")}
                  className="text-sm border border-red-400/30 text-red-300 rounded-md px-3 py-1.5 disabled:opacity-50 hover:bg-red-500/10 transition-colors"
                >
                  Archive
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
