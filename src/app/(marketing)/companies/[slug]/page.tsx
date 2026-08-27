import { notFound } from "next/navigation";
import Link from "next/link";
import { getCompanyBySlug } from "@/features/companies/queries";
import { Tabs } from "@/components/ui/Tabs";

export default async function CompanyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getCompanyBySlug(slug);
  if (!result) notFound();
  const { company, jobs, airportLinks } = result;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {company.name}
            {company.verification_status === "approved" && (
              <span className="ml-2 text-sm text-blue-600 align-middle" title="Verified employer">✓ Verified</span>
            )}
          </h1>
          <p className="text-slate-500 mt-1 capitalize">{company.company_type?.replace("_", " ")}</p>
        </div>
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm border rounded-md px-3 py-1.5 text-slate-600 hover:border-slate-400"
          >
            Visit website
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
                    <p>
                      Headquarters: {company.locations.city}, {company.locations.state_code}
                    </p>
                  )}
                  <p>{jobs.length} open job{jobs.length === 1 ? "" : "s"}</p>
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
                      <Link key={j.id} href={`/jobs/${j.slug}`} className="border rounded-lg p-3 bg-white hover:border-slate-400">
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
                        <Link href={`/airports/${a.airports?.iata_code}`} className="text-blue-600 hover:underline">
                          {a.airports?.name} ({a.airports?.iata_code})
                        </Link>
                        <span className="text-slate-400 ml-2 capitalize">{a.relationship_type.replace("_", " ")}</span>
                      </li>
                    ))}
                  </ul>
                ),
            },
          ]}
        />
      </div>
    </div>
  );
}
