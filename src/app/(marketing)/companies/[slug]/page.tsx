import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Briefcase, ExternalLink } from "lucide-react";
import { getCompanyBySlug } from "@/features/companies/queries";
import { getCompanyReviews } from "@/features/companies/reviewQueries";
import { Tabs } from "@/components/ui/Tabs";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { RelationshipBadge } from "@/components/ui/RelationshipBadge";
import { CompanyReviewsTab } from "@/components/companies/CompanyReviewsTab";
import { companyTypeLabel } from "@/lib/companyType";

export default async function CompanyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getCompanyBySlug(slug);
  if (!result) notFound();
  const { company, jobs, airportLinks } = result;
  const { reviews, ownReview, averageRating, count: reviewCount } = await getCompanyReviews(company.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <CompanyLogo name={company.name} website={company.website} size={56} className="mt-1" />
          <div>
            <h1 className="font-display text-2xl font-semibold text-slate-900">
              {company.name}
              {company.verification_status === "approved" && (
                <span className="ml-2 text-sm text-brand-600 align-middle" title="Verified employer">✓ Verified</span>
              )}
            </h1>
            <p className="text-slate-500 mt-1">{companyTypeLabel(company.company_type)}</p>
            {company.veteran_friendly && (
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full mt-1.5">
                Veteran-friendly employer
              </span>
            )}
          </div>
        </div>
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm border rounded-md px-3 py-1.5 text-slate-600 shadow-sm hover:border-brand-300 hover:shadow-lg hover:-translate-y-0.5 transition-all shrink-0"
          >
            Visit website
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {company.description && <p className="text-slate-600 mt-4 max-w-2xl">{company.description}</p>}

      <div className="mt-8">
        <Tabs
          tabs={[
            {
              label: "Overview",
              content: (
                <div className="text-sm text-slate-600 space-y-2">
                  {company.locations?.city && (
                    <p className="inline-flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      Headquarters: {company.locations.city}, {company.locations.state_code}
                    </p>
                  )}
                  <p className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    {jobs.length} open job{jobs.length === 1 ? "" : "s"}
                  </p>
                </div>
              ),
            },
            {
              label: `Jobs (${jobs.length})`,
              content:
                jobs.length === 0 ? (
                  <p className="text-sm text-slate-500">No open jobs right now.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {jobs.map((j: any) => (
                      <Link key={j.id} href={`/jobs/${j.slug}`} className="border rounded-lg p-3 bg-white shadow-sm hover:border-brand-300 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                        <p className="font-medium text-slate-900 text-sm">{j.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 capitalize">{j.employment_type?.replace("_", " ")}</p>
                      </Link>
                    ))}
                  </div>
                ),
            },
            {
              label: "Locations",
              content:
                airportLinks.length === 0 ? (
                  <p className="text-sm text-slate-500">No locations listed yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {airportLinks.map((a: any, i: number) => (
                      <li key={i} className="text-sm">
                        <Link href={`/airports/${a.airports?.iata_code}`} className="text-brand-600 hover:underline hover:text-brand-700 transition-colors">
                          {a.airports?.name} ({a.airports?.iata_code})
                        </Link>
                        <RelationshipBadge type={a.relationship_type} className="text-slate-400 ml-2" />
                      </li>
                    ))}
                  </ul>
                ),
            },
            {
              label: `Reviews${reviewCount > 0 ? ` (${reviewCount})` : ""}`,
              content: (
                <CompanyReviewsTab
                  companyId={company.id}
                  companySlug={company.slug}
                  reviews={reviews as any}
                  ownReview={ownReview as any}
                  averageRating={averageRating}
                  count={reviewCount}
                />
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
