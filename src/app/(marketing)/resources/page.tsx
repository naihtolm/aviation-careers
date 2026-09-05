import Link from "next/link";
import { BookOpen } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { getPublishedArticles } from "@/features/resources/queries";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default async function ResourcesPage() {
  const articles = await getPublishedArticles();

  return (
    <div>
      <PageHero
        title="Resources"
        description="Guides to breaking into aviation careers, certifications, and pay."
        icon={BookOpen}
      />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {articles.length === 0 ? (
          <p className="text-slate-500 mt-8">No guides published yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {articles.map((a) => (
              <Link
                key={a.id}
                href={`/resources/${a.slug}`}
                className="border rounded-lg p-4 bg-white shadow-sm hover:border-brand-300 hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-700 bg-brand-50 rounded px-1.5 py-0.5 w-fit">
                  {a.category}
                </span>
                <p className="font-medium text-slate-900 mt-2">{a.title}</p>
                <p className="text-sm text-slate-500 mt-1.5 line-clamp-3">{a.excerpt}</p>
                {a.published_at && <p className="text-xs text-slate-400 mt-3">{formatDate(a.published_at)}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
