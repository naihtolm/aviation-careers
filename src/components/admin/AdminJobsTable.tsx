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
  active: "bg-emerald-50 text-emerald-700",
  draft: "bg-slate-100 text-slate-600",
  paused: "bg-amber-50 text-amber-700",
  expired: "bg-orange-50 text-orange-700",
  archived: "bg-slate-100 text-slate-500",
  rejected: "bg-red-50 text-red-700",
  pending_review: "bg-blue-50 text-blue-700",
};

export function AdminJobsTable({ jobs }: { jobs: Job[] }) {
  const [isPending, startTransition] = useTransition();

  function setStatus(jobId: string, status: "active" | "paused" | "expired" | "archived") {
    startTransition(() => adminUpdateJobStatus(jobId, status));
  }

  if (jobs.length === 0) return <p className="text-sm text-slate-500">No jobs match this filter.</p>;

  return (
    <div className="overflow-x-auto border rounded-lg bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
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
            <tr key={job.id} className="border-t">
              <td className="px-3 py-2">
                {job.status === "active" ? (
                  <Link href={`/jobs/${job.slug}`} className="text-slate-900 hover:underline hover:text-brand-600 transition-colors">
                    {job.title}
                  </Link>
                ) : (
                  <span className="text-slate-900">{job.title}</span>
                )}
              </td>
              <td className="px-3 py-2 text-slate-600">{companyName(job.companies)}</td>
              <td className="px-3 py-2">
                <span className={`px-2 py-0.5 rounded text-xs capitalize ${STATUS_STYLES[job.status] ?? "bg-slate-100"}`}>
                  {job.status.replace("_", " ")}
                </span>
              </td>
              <td className="px-3 py-2 text-slate-500 capitalize">{job.application_type.replace("_", " ")}</td>
              <td className="px-3 py-2 text-slate-500">
                {job.published_at ? new Date(job.published_at).toLocaleDateString() : "—"}
              </td>
              <td className="px-3 py-2 text-right whitespace-nowrap">
                {job.status === "active" && (
                  <button
                    disabled={isPending}
                    onClick={() => setStatus(job.id, "paused")}
                    className="text-xs border rounded px-2 py-1 mr-1 disabled:opacity-50"
                  >
                    Pause
                  </button>
                )}
                {job.status === "paused" && (
                  <button
                    disabled={isPending}
                    onClick={() => setStatus(job.id, "active")}
                    className="text-xs border rounded px-2 py-1 mr-1 disabled:opacity-50"
                  >
                    Resume
                  </button>
                )}
                {job.status !== "archived" && (
                  <button
                    disabled={isPending}
                    onClick={() => setStatus(job.id, "archived")}
                    className="text-xs border border-red-300 text-red-600 rounded px-2 py-1 disabled:opacity-50"
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
