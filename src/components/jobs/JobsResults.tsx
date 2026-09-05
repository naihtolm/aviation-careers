"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock, TrendingUp, Home } from "lucide-react";
import { JobCard } from "@/components/jobs/JobCard";
import { FlipCounter } from "@/components/ui/FlipCounter";

interface FilterOption {
  value: string;
  label: string;
  href: string;
  active: boolean;
}

// Filters, sort, and the results list, as one client component so a
// filter click can drive a single shared `isPending` -- the results list
// quick-fades while the new page is in flight, instead of just sitting
// frozen (or flashing blank) until the RSC response lands. The hrefs
// themselves are precomputed server-side (see app/jobs/page.tsx) so this
// component doesn't need to duplicate the URLSearchParams logic.
export function JobsResults({
  employmentTypes,
  experienceLevels,
  workArrangements,
  sortOptions,
  jobs,
  total,
  savedJobIds,
}: {
  employmentTypes: FilterOption[];
  experienceLevels: FilterOption[];
  workArrangements: FilterOption[];
  sortOptions: FilterOption[];
  jobs: any[];
  total: number;
  savedJobIds: string[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function go(href: string) {
    startTransition(() => router.push(href));
  }

  function FilterGroup({ icon: Icon, title, options }: { icon: typeof Clock; title: string; options: FilterOption[] }) {
    return (
      <div>
        <p className="text-sm font-medium text-slate-900 mb-2 flex items-center gap-1.5">
          <Icon className="w-4 h-4 text-brand-600" />
          {title}
        </p>
        <ul className="space-y-1">
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                onClick={() => go(opt.href)}
                className={`text-sm block text-left ${opt.active ? "text-slate-900 font-medium" : "text-slate-500"}`}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-[220px_1fr] gap-8">
      <aside className="space-y-6 md:sticky md:top-24 md:self-start">
        <FilterGroup icon={Clock} title="Employment type" options={employmentTypes} />
        <FilterGroup icon={TrendingUp} title="Experience level" options={experienceLevels} />
        <FilterGroup icon={Home} title="Work arrangement" options={workArrangements} />
      </aside>

      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <p className="text-sm text-slate-500">
            <FlipCounter value={total} /> job{total === 1 ? "" : "s"} found
          </p>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-slate-400">Sort:</span>
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => go(opt.href)}
                className={`px-2 py-1 rounded-md ${opt.active ? "bg-brand-50 text-brand-700 font-medium" : "text-slate-500 hover:bg-slate-100"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`transition-opacity duration-200 ${isPending ? "opacity-40" : "opacity-100"}`}>
          {jobs.length === 0 ? (
            <div className="border rounded-lg p-8 text-center bg-white">
              <p className="font-medium text-slate-900">We couldn't find any exact matches</p>
              <p className="text-sm text-slate-500 mt-1">
                Try broadening your filters or searching a wider location radius.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job: any) => (
                <JobCard key={job.id} job={job} initialSaved={savedJobIds.includes(job.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
