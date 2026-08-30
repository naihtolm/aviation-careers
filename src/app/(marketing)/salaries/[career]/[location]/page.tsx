import { notFound } from "next/navigation";
import Link from "next/link";
import { getSalaryDetail } from "@/features/salaries/queries";
import { SalaryCalculator } from "@/components/salary/SalaryCalculator";

function fmt(n: number | null) {
  return n != null ? `$${Math.round(n).toLocaleString()}` : null;
}

function confidenceLabel(score: number | null, sampleSize: number | null) {
  if (score == null) return { label: "Limited data", color: "amber" };
  if (score >= 0.8 && (sampleSize ?? 0) >= 30) return { label: "High confidence", color: "emerald" };
  if (score >= 0.5) return { label: "Medium confidence", color: "amber" };
  return { label: "Limited data", color: "amber" };
}

export default async function SalaryDetailPage({
  params,
}: {
  params: Promise<{ career: string; location: string }>;
}) {
  const { career: careerSlug, location: locationSlug } = await params;
  const result = await getSalaryDetail(careerSlug, locationSlug);
  if (!result) notFound();
  const { career, locationLabel, aggregate, relatedJobs } = result;

  const confidence = confidenceLabel(aggregate?.confidence_score ?? null, aggregate?.sample_size ?? null);
  const points = [
    { key: "p10", label: "10th pct", value: aggregate?.salary_p10 },
    { key: "p25", label: "25th pct", value: aggregate?.salary_p25 },
    { key: "p50", label: "Median", value: aggregate?.salary_p50 },
    { key: "p75", label: "75th pct", value: aggregate?.salary_p75 },
    { key: "p90", label: "90th pct", value: aggregate?.salary_p90 },
  ];
  const maxValue = Math.max(...points.map((p) => p.value ?? 0), 1);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <p className="text-sm text-slate-500">
        <Link href="/salaries" className="hover:underline hover:text-slate-900 transition-colors">Salaries</Link> / {career.name}
      </p>
      <h1 className="text-2xl font-semibold text-slate-900 mt-1">
        {career.name} Salary — {locationLabel}
      </h1>

      {!aggregate ? (
        <div className="border rounded-lg p-6 bg-slate-50 mt-6 text-center">
          <p className="font-medium text-slate-900">No salary data yet for this location</p>
          <Link href={`/salaries/${career.slug}/national`} className="text-sm text-brand-600 hover:underline mt-2 inline-block hover:text-brand-700 transition-colors">
            View national data instead →
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-[1fr_280px] gap-6 mt-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span
                className={`text-xs px-2 py-1 rounded ${confidence.color === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
              >
                {confidence.label}
              </span>
              {aggregate.sample_size && (
                <span className="text-xs text-slate-400">Based on {aggregate.sample_size.toLocaleString()} data points</span>
              )}
            </div>

            <div className="border rounded-lg p-4 bg-white space-y-3">
              {points.map((p) =>
                p.value == null ? null : (
                  <div key={p.key} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-16">{p.label}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-brand-600 h-2 rounded-full"
                        style={{ width: `${(p.value / maxValue) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-900 w-24 text-right">{fmt(p.value)}</span>
                  </div>
                )
              )}
            </div>

            <p className="text-xs text-slate-400 mt-3">
              Sourced from the U.S. Bureau of Labor Statistics. Some percentiles aren't available for every career/location combination yet.
            </p>
          </div>

          <div>
            <SalaryCalculator />
          </div>
        </div>
      )}

      {relatedJobs.length > 0 && (
        <div className="border-t mt-10 pt-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Open {career.name} jobs</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {relatedJobs.map((j: any) => (
              <Link key={j.id} href={`/jobs/${j.slug}`} className="border rounded-lg p-3 bg-white shadow-sm hover:border-brand-300 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <p className="font-medium text-slate-900 text-sm">{j.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{j.companies?.name}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
