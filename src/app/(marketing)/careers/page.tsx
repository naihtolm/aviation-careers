import Link from "next/link";
import { getCareerCategories, getCareers } from "@/features/careers/queries";

export default async function CareerDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const [categories, careers] = await Promise.all([getCareerCategories(), getCareers(params.category)]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Aviation Career Guides</h1>
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
          {careers.map((career: any) => (
            <Link
              key={career.id}
              href={`/careers/${career.slug}`}
              className="border rounded-lg p-4 bg-white hover:border-slate-400 hover:shadow-md transition-all"
            >
              <p className="font-medium text-slate-900">{career.name}</p>
              <p className="text-sm text-slate-500 mt-1">{career.short_description}</p>
              <div className="flex gap-2 mt-3">
                {career.entry_level && (
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">Entry-level friendly</span>
                )}
                {career.regulated && (
                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded">FAA regulated</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
