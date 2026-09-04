"use client";

import { useTransition } from "react";
import Link from "next/link";
import { adminUpdateJobStatus } from "@/features/admin/actions";

type Job = {
  id: string;
  title: string;
  slug: string;
  status: string;
  application_type: string;
  published_at: string | null;
  expires_at: string | null;
  companies: { name: string } | { name: string }[] | null;
};

function companyName(companies: Job["companies"]) {
  if (!companies) return "—";
  return Array.isArray(companies) ? (companies[0]?.name ?? "—") : companies.name;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-300",
  draft: "bg-white/10 text-slate-300",
  paused: "bg-amber-500/15 text-amber-300",
  expired: "bg-orange-500/15 text-orange-300",
  archived: "bg-white/10 text-slate-400",
  rejected: "bg-red-500/15 text-red-300",
  pending_review: "bg-sky-500/15 text-sky-300",
};

export function AdminJobsTable({ jobs }: { jobs: Job[] }) {
  const [isPending, startTransition] = useTransition();

  function setStatus(jobId: string, status: "active" | "paused" | "expired" | "archived") {
    startTransition(() => adminUpdateJobStatus(jobId, status));
  }

  if (jobs.length === 0) return <p className="text-sm text-slate-400">No jobs match this filter.</p>;

  return (
    <div className="overflow-x-auto border border-white/10 rounded-lg bg-white/[0.04]">
      <table className="w-full text-sm">
        <thead className="bg-white/[0.03] text-left text-slate-400">
          <tr>
            <th className="px-3 py-2 font-medium">Title</th>
            <th className="px-3 py-2 font-medium">Company</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">Published</th>
            <th className="px-3 py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="border-t border-white/10">
              <td className="px-3 py-2">
                {job.status === "active" ? (
                  <Link href={`/jobs/${job.slug}`} className="text-white hover:underline hover:text-brand-300 transition-colors">
                    {job.title}
                  </Link>
                ) : (
                  <span className="text-white">{job.title}</span>
                )}
              </td>
              <td className="px-3 py-2 text-slate-300">{companyName(job.companies)}</td>
              <td className="px-3 py-2">
                <span className={`px-2 py-0.5 rounded text-xs capitalize ${STATUS_STYLES[job.status] ?? "bg-white/10 text-slate-300"}`}>
                  {job.status.replace("_", " ")}
                </span>
              </td>
              <td className="px-3 py-2 text-slate-400 capitalize">{job.application_type.replace("_", " ")}</td>
              <td className="px-3 py-2 text-slate-400">
                {job.published_at ? new Date(job.published_at).toLocaleDateString() : "—"}
              </td>
              <td className="px-3 py-2 text-right whitespace-nowrap">
                {job.status === "active" && (
                  <button
                    disabled={isPending}
                    onClick={() => setStatus(job.id, "paused")}
                    className="text-xs border border-white/15 text-slate-200 rounded px-2 py-1 mr-1 disabled:opacity-50 hover:bg-white/5 transition-colors"
                  >
                    Pause
                  </button>
                )}
                {job.status === "paused" && (
                  <button
                    disabled={isPending}
                    onClick={() => setStatus(job.id, "active")}
                    className="text-xs border border-white/15 text-slate-200 rounded px-2 py-1 mr-1 disabled:opacity-50 hover:bg-white/5 transition-colors"
                  >
                    Resume
                  </button>
                )}
                {job.status !== "archived" && (
                  <button
                    disabled={isPending}
                    onClick={() => setStatus(job.id, "archived")}
                    className="text-xs border border-red-400/30 text-red-300 rounded px-2 py-1 disabled:opacity-50 hover:bg-red-500/10 transition-colors"
                  >
                    Archive
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
