import { notFound } from "next/navigation";
import Link from "next/link";
import { DollarSign, TrendingUp, GraduationCap, ShieldCheck, Briefcase } from "lucide-react";
import { getCareerBySlug } from "@/features/careers/queries";
import { JobCard } from "@/components/jobs/JobCard";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { categoryColorClasses } from "@/lib/categoryColor";

function fmt(n: number | null) {
  return n ? `$${Math.round(n).toLocaleString()}` : null;
}

export default async function CareerDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getCareerBySlug(slug);
  if (!result) notFound();
  const { career, content, salary, certRequirements, jobs } = result;
  const colors = categoryColorClasses(career.career_categories?.name ?? career.name);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <p className="text-sm text-slate-500">
        <Link href="/careers" className="hover:underline hover:text-slate-900 transition-colors">Careers</Link>
        {career.career_categories?.name && <> / {career.career_categories.name}</>}
      </p>
      <div className="flex items-center gap-3 mt-3">
        <div className={`w-11 h-11 rounded-lg ${colors.iconBg} ${colors.iconText} flex items-center justify-center shrink-0`}>
          <CategoryIcon name={career.career_categories?.name ?? career.name} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">{career.name}</h1>
          <p className="text-slate-500 mt-0.5">{career.short_description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        <div className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-1.5 text-slate-500">
            <DollarSign className="w-3.5 h-3.5" />
            <p className="text-xs">Median salary</p>
          </div>
          <p className="font-semibold text-slate-900 mt-1">{fmt(salary?.salary_p50) ?? "—"}</p>
        </div>
        <div className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-1.5 text-slate-500">
            <TrendingUp className="w-3.5 h-3.5" />
            <p className="text-xs">Salary range</p>
          </div>
          <p className="font-semibold text-slate-900 mt-1">
            {salary ? `${fmt(salary.salary_p10)}–${fmt(salary.salary_p90)}` : "—"}
          </p>
        </div>
        <div className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-1.5 text-slate-500">
            <GraduationCap className="w-3.5 h-3.5" />
            <p className="text-xs">Entry-level friendly</p>
          </div>
          <p className="font-semibold text-slate-900 mt-1">{career.entry_level ? "Yes" : "No"}</p>
        </div>
        <div className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-1.5 text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5" />
            <p className="text-xs">FAA regulated</p>
          </div>
          <p className="font-semibold text-slate-900 mt-1">{career.regulated ? "Yes" : "No"}</p>
        </div>
      </div>

      {!content ? (
        <div className="border rounded-lg p-6 bg-slate-50 mt-8 text-center">
          <p className="text-slate-900 font-medium">Detailed guide coming soon</p>
          <p className="text-sm text-slate-500 mt-1">
            We're still building out the full career guide for {career.name}. Here's what we know so far.
          </p>
          {career.full_description && <p className="text-sm text-slate-600 mt-4 text-left">{career.full_description}</p>}
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Overview</h2>
            <p className="text-sm text-slate-600">{content.overview}</p>
          </section>

          {content.responsibilities?.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">What they do</h2>
              <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                {content.responsibilities.map((r: string, i: number) => <li key={i}>{r}</li>)}
              </ul>
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">How to become one</h2>
            <p className="text-sm text-slate-600">{content.training_path}</p>
            {certRequirements.length > 0 && (
              <ul className="mt-2 space-y-1">
                {certRequirements.map((c: any, i: number) => (
                  <li key={i} className="text-sm text-slate-600">
                    {c.requirement_type === "required" ? "Required" : "Preferred"}: {c.certifications?.name}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {content.career_path && (
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Career path</h2>
              <p className="text-sm text-slate-600">{content.career_path}</p>
            </section>
          )}

          {(content.pros?.length > 0 || content.considerations?.length > 0) && (
            <section className="grid sm:grid-cols-2 gap-6">
              {content.pros?.length > 0 && (
                <div>
                  <h3 className="font-medium text-slate-900 mb-2">Pros</h3>
                  <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                    {content.pros.map((p: string, i: number) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              )}
              {content.considerations?.length > 0 && (
                <div>
                  <h3 className="font-medium text-slate-900 mb-2">Considerations</h3>
                  <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                    {content.considerations.map((p: string, i: number) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      <section className="border-t mt-10 pt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-brand-600" />
            Open jobs
            {jobs.length > 0 && (
              <span className="text-xs font-medium bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">{jobs.length}</span>
            )}
          </h2>
          <Link href={`/salaries/${career.slug}/national`} className="text-sm text-brand-600 hover:underline hover:text-brand-700 transition-colors">
            View salary details →
          </Link>
        </div>
        {jobs.length === 0 ? (
          <p className="text-sm text-slate-500">No open jobs in this career right now.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {jobs.map((j: any) => (
              <Link key={j.id} href={`/jobs/${j.slug}`} className="border rounded-lg p-3 bg-white shadow-sm hover:border-brand-300 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <p className="font-medium text-slate-900 text-sm">{j.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{j.companies?.name}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {salary && (
        <p className="text-xs text-slate-400 mt-8 border-t pt-4">
          Salary data sourced from the U.S. Bureau of Labor Statistics.
        </p>
      )}
    </div>
  );
}
