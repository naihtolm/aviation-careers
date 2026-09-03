import Link from "next/link";
import { Medal, Briefcase, ArrowRight } from "lucide-react";
import { getVeteranFriendlyCompanies } from "@/features/companies/queries";
import { PageHero } from "@/components/layout/PageHero";
import { CompanyLogo } from "@/components/ui/CompanyLogo";

const TRANSLATIONS: {
  militaryRole: string;
  blurb: string;
  civilianCareers: { name: string; slug: string }[];
}[] = [
  {
    militaryRole: "Military Pilot (fixed-wing or rotary)",
    blurb: "Combat, transport, or training flight hours translate directly into commercial flight time.",
    civilianCareers: [
      { name: "Airline Pilot", slug: "airline-pilot" },
      { name: "Cargo Pilot", slug: "cargo-pilot" },
      { name: "Corporate Pilot", slug: "corporate-pilot" },
      { name: "Law Enforcement Pilot", slug: "law-enforcement-pilot" },
    ],
  },
  {
    militaryRole: "Aircraft Maintenance / Crew Chief",
    blurb: "Military airframe and powerplant experience is one of the most direct paths to FAA A&P certification.",
    civilianCareers: [{ name: "Aircraft Mechanic (A&P)", slug: "aircraft-mechanic-ap" }],
  },
  {
    militaryRole: "Avionics / Weapons Systems Technician",
    blurb: "Systems troubleshooting and a security clearance are exactly what defense contractors are hiring for.",
    civilianCareers: [
      { name: "Defense Systems Technician", slug: "defense-systems-technician" },
      { name: "Aircraft Mechanic (A&P)", slug: "aircraft-mechanic-ap" },
    ],
  },
  {
    militaryRole: "Aircrew / Loadmaster / Boom Operator",
    blurb: "Hands-on cargo, weight and balance, and ground operations experience carries straight over.",
    civilianCareers: [{ name: "Ramp Agent", slug: "ramp-agent" }],
  },
  {
    militaryRole: "Flight Medic / Independent Duty Medical Technician",
    blurb: "In-flight trauma and critical care experience is the core of civilian air medical transport.",
    civilianCareers: [{ name: "Flight Paramedic", slug: "flight-paramedic" }],
  },
  {
    militaryRole: "Aviation Engineering / Test Officer",
    blurb: "Systems design and flight test experience map directly onto civilian aerospace engineering roles.",
    civilianCareers: [{ name: "Aerospace Engineer", slug: "aerospace-engineer" }],
  },
];

export default async function VeteransPage() {
  const companies = await getVeteranFriendlyCompanies();

  return (
    <div>
      <PageHero
        title="Veterans in Aviation"
        description="Your military aviation experience translates directly into a civilian career. Here's how."
        icon={Medal}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Translate your experience</h2>
          <p className="text-sm text-slate-500 mb-5">
            Common military aviation roles and the civilian careers they lead into.
          </p>
          <div className="space-y-3">
            {TRANSLATIONS.map((row) => (
              <div key={row.militaryRole} className="border rounded-lg p-4 bg-white shadow-sm">
                <p className="font-medium text-slate-900">{row.militaryRole}</p>
                <p className="text-sm text-slate-500 mt-1">{row.blurb}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {row.civilianCareers.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/careers/${c.slug}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 bg-brand-50 px-3 py-1.5 rounded-full hover:bg-brand-100 transition-colors"
                    >
                      {c.name}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 pt-8 border-t">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Explore veteran-relevant sectors</h2>
          <p className="text-sm text-slate-500 mb-5">
            These sectors are where military aviation experience is most directly valued.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/sectors/military-defense"
              className="text-sm font-medium text-slate-700 border rounded-full px-4 py-2 hover:border-brand-300 hover:bg-slate-50 transition-colors"
            >
              Military & Defense →
            </Link>
            <Link
              href="/sectors/law-enforcement"
              className="text-sm font-medium text-slate-700 border rounded-full px-4 py-2 hover:border-brand-300 hover:bg-slate-50 transition-colors"
            >
              Law Enforcement →
            </Link>
            <Link
              href="/sectors/ems-air-ambulance"
              className="text-sm font-medium text-slate-700 border rounded-full px-4 py-2 hover:border-brand-300 hover:bg-slate-50 transition-colors"
            >
              EMS / Air Ambulance →
            </Link>
            <Link
              href="/sectors/cargo-logistics"
              className="text-sm font-medium text-slate-700 border rounded-full px-4 py-2 hover:border-brand-300 hover:bg-slate-50 transition-colors"
            >
              Cargo & Logistics →
            </Link>
          </div>
        </section>

        <section className="mt-10 pt-8 border-t">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Veteran-friendly employers</h2>
          <p className="text-sm text-slate-500 mb-5">Companies that have told us they actively welcome veteran applicants.</p>
          {companies.length === 0 ? (
            <div className="border rounded-lg p-6 bg-white text-center">
              <p className="text-slate-900 font-medium">No employers listed yet</p>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                We're actively growing this list. If your company welcomes veteran applicants, say so when you register
                and you'll show up here.
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
              {companies.map((c) => (
                <Link
                  key={c.id}
                  href={`/companies/${c.slug}`}
                  className="flex items-center gap-3 border rounded-xl p-4 bg-white shadow-sm hover:border-brand-300 hover:shadow-lg hover:-translate-y-0.5 transition-all"
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
        </section>
      </div>
    </div>
  );
}
