import Link from "next/link";
import { getDataQualityIssues } from "@/features/admin/queries";

function IssueSection({
  title,
  description,
  items,
  renderItem,
}: {
  title: string;
  description: string;
  items: { id: string }[];
  renderItem: (item: any) => React.ReactNode;
}) {
  return (
    <section className="border rounded-lg bg-white p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-medium text-slate-900">{title}</h3>
        <span className={`text-sm font-medium ${items.length > 0 ? "text-amber-700" : "text-emerald-700"}`}>
          {items.length}
        </span>
      </div>
      <p className="text-xs text-slate-500 mt-0.5 mb-3">{description}</p>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">None — looks good.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {items.slice(0, 10).map((item) => (
            <li key={item.id}>{renderItem(item)}</li>
          ))}
          {items.length > 10 && <li className="text-slate-400">+ {items.length - 10} more</li>}
        </ul>
      )}
    </section>
  );
}

export default async function AdminDataQualityPage() {
  const issues = await getDataQualityIssues();

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Data Quality</h2>
      <p className="text-sm text-slate-500 mb-6">
        Concrete completeness gaps across active listings and companies — not a synthetic score.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <IssueSection
          title="Active jobs missing a location"
          description="No job_locations row — will show as location not specified."
          items={issues.missingLocation}
          renderItem={(j) => (
            <Link href={`/admin/jobs?q=${encodeURIComponent(j.title)}`} className="text-brand-600 hover:underline">
              {j.title}
            </Link>
          )}
        />
        <IssueSection
          title="Active jobs missing compensation"
          description="No salary range on file at all."
          items={issues.missingCompensation}
          renderItem={(j) => (
            <Link href={`/admin/jobs?q=${encodeURIComponent(j.title)}`} className="text-brand-600 hover:underline">
              {j.title}
            </Link>
          )}
        />
        <IssueSection
          title="Active jobs with a thin description"
          description="Under 40 characters, or missing entirely."
          items={issues.missingDescription}
          renderItem={(j) => (
            <Link href={`/admin/jobs?q=${encodeURIComponent(j.title)}`} className="text-brand-600 hover:underline">
              {j.title}
            </Link>
          )}
        />
        <IssueSection
          title="Companies missing a description"
          description="Blank company profile — thin on their public page."
          items={issues.companiesMissingDescription}
          renderItem={(c) => <span>{c.name}</span>}
        />
        <IssueSection
          title="Companies missing a logo"
          description="No logo uploaded yet."
          items={issues.companiesMissingLogo}
          renderItem={(c) => <span>{c.name}</span>}
        />
        <IssueSection
          title="Stale ingestion backlog"
          description="Raw job records received more than 3 days ago, still unreviewed."
          items={issues.stalePendingIngestion}
          renderItem={(r) => (
            <Link href="/admin/jobs/review" className="text-brand-600 hover:underline">
              Received {new Date(r.received_at).toLocaleDateString()}
            </Link>
          )}
        />
      </div>
    </div>
  );
}
