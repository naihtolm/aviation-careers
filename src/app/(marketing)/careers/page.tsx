import Link from "next/link";
import { GraduationCap, ShieldCheck } from "lucide-react";
import { getCareerCategories, getCareers } from "@/features/careers/queries";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { categoryColorClasses } from "@/lib/categoryColor";

export default async function CareerDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const [categories, careers] = await Promise.all([getCareerCategories(), getCareers(params.category)]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-slate-900">Aviation Career Guides</h1>
      <p className="text-slate-500 mt-1">Explore roles across the industry — what they pay, what they require, and how to get started.</p>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-6">
          <Link
            href="/careers"
            className={`px-3 py-1.5 rounded-full text-sm border ${!params.category ? "bg-brand-600 text-white hover:bg-brand-700 transition-colors border-brand-600" : "text-slate-600"}`}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/careers?category=${cat.slug}`}
              className={`px-3 py-1.5 rounded-full text-sm border ${params.category === cat.slug ? "bg-brand-600 text-white hover:bg-brand-700 transition-colors border-brand-600" : "text-slate-600"}`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      {careers.length === 0 ? (
        <p className="text-slate-500 mt-8">No career guides published yet for this category.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {careers.map((career: any) => {
            const colors = categoryColorClasses(career.career_categories?.name ?? career.name);
            return (
              <Link
                key={career.id}
                href={`/careers/${career.slug}`}
                className={`border border-t-4 ${colors.border} rounded-lg p-4 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all`}
              >
                <div className={`w-9 h-9 rounded-lg ${colors.iconBg} ${colors.iconText} flex items-center justify-center`}>
                  <CategoryIcon name={career.career_categories?.name ?? career.name} className="w-5 h-5" />
                </div>
                <p className="font-medium text-slate-900 mt-3">{career.name}</p>
                <p className="text-sm text-slate-500 mt-1">{career.short_description}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {career.entry_level && (
                    <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                      <GraduationCap className="w-3.5 h-3.5" />
                      Entry-level friendly
                    </span>
                  )}
                  {career.regulated && (
                    <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      FAA regulated
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
