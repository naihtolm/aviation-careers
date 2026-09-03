import { notFound } from "next/navigation";
import Link from "next/link";
import { Briefcase } from "lucide-react";
import { getSectorDetail } from "@/features/sectors/queries";
import { sectorColorClasses } from "@/lib/sectors";
import { PageHero } from "@/components/layout/PageHero";
import { CompanyLogo } from "@/components/ui/CompanyLogo";

export default async function SectorDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getSectorDetail(slug);
  if (!result) notFound();
  const { sector, companies } = result;
  const colors = sectorColorClasses(sector.colorKey);

  return (
    <div>
      <PageHero title={sector.name} description={sector.description} icon={sector.icon} />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {companies.length === 0 ? (
          <div className="border rounded-lg p-6 bg-white text-center">
            <p className="text-slate-900 font-medium">No employers in this sector yet</p>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              We're actively growing coverage here. If you're hiring in {sector.name.toLowerCase()}, be one of the first
              employers listed.
            </p>
            <Link
              href="/employers/sign-up"
              className="inline-block mt-4 bg-accent-200 text-board text-sm font-medium px-4 py-2 rounded-md hover:bg-accent-100 transition-colors"
            >
              Register your company
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((c: any) => (
              <Link
                key={c.id}
                href={`/companies/${c.slug}`}
                className={`flex items-center gap-3 border border-t-4 ${colors.border} rounded-xl p-4 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all`}
              >
                <CompanyLogo name={c.name} website={c.website} size={36} />
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate">{c.name}</p>
                  <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    {c.jobCount} open job{c.jobCount === 1 ? "" : "s"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
