import Link from "next/link";
import { Award, Plane, Wrench, HeartPulse, Radio, Shield, type LucideIcon } from "lucide-react";
import { getCertifications } from "@/features/certifications/queries";
import { PageHero } from "@/components/layout/PageHero";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Pilot: Plane,
  Maintenance: Wrench,
  Medical: HeartPulse,
  Communications: Radio,
  Clearance: Shield,
};

export default async function CertificationsPage() {
  const allCertifications = await getCertifications();
  // Rows with no description are unenriched/duplicate stubs (e.g. an old
  // redundant entry) -- excluded rather than shown half-empty next to
  // properly documented ones.
  const certifications = allCertifications.filter((c) => c.description);

  const byCategory = new Map<string, typeof certifications>();
  for (const cert of certifications) {
    const cat = cert.category ?? "Other";
    byCategory.set(cat, [...(byCategory.get(cat) ?? []), cert]);
  }

  return (
    <div>
      <PageHero
        title="Certifications & Licensing Guide"
        description="The credentials that open doors across the industry -- what each one requires and which careers need it."
        icon={Award}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {certifications.length === 0 ? (
          <p className="text-slate-500 mt-8">No certifications published yet.</p>
        ) : (
          <div className="space-y-10">
            {Array.from(byCategory.entries()).map(([category, certs]) => {
              const Icon = CATEGORY_ICONS[category] ?? Award;
              return (
                <section key={category}>
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-4">
                    <Icon className="w-5 h-5 text-brand-600" />
                    {category}
                  </h2>
                  <div className="space-y-3">
                    {certs.map((cert) => (
                      <div key={cert.id} className="border rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <p className="font-medium text-slate-900">{cert.name}</p>
                          {cert.issuing_authority && (
                            <span className="text-xs text-slate-500 shrink-0">{cert.issuing_authority}</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-1.5">{cert.description}</p>
                        {cert.careers.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span className="text-xs text-slate-500">Required for:</span>
                            {cert.careers.map((c) => (
                              <Link
                                key={c.slug}
                                href={`/careers/${c.slug}`}
                                className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full hover:bg-brand-100 transition-colors"
                              >
                                {c.name}
                                {c.requirementType === "preferred" ? " (preferred)" : ""}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
