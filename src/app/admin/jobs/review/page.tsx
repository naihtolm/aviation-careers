// app/admin/jobs/review/page.tsx
import { createServerActionClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service";
import { RawJobCard } from "./RawJobCard";
import { Inbox } from "lucide-react";

interface RawJobRecord {
  id: string;
  external_id: string | null;
  raw_data: {
    title?: string;
    location?: { name?: string } | null;
    content?: string;
    absolute_url?: string;
    company_name?: string;
  };
  received_at: string;
  source_id: string;
}

export default async function JobReviewPage() {
  // Admin auth is checked once in app/admin/layout.tsx (requireAdmin()) --
  // no need to repeat it here.
  const supabase = await createServerActionClient();

  // raw_job_records has no client-facing RLS policy at all (service-role
  // only, by design — see supabase/migrations/010_rls_policies.sql) so
  // this read has to go through the service client. The role check above,
  // using the user's own session, is what stands in for RLS here.
  const db = getServiceClient();

  // Pending raw records, oldest first — process the backlog in order.
  const { data: rawRecords, error, count } = await db
    .from("raw_job_records")
    .select("id, external_id, raw_data, received_at, source_id", { count: "exact" })
    .eq("status", "received")
    .order("received_at", { ascending: true })
    .limit(50);

  // Careers list for the approve-form dropdown.
  const { data: careers } = await supabase
    .from("careers")
    .select("id, name, career_categories ( name )")
    .eq("active", true)
    .order("name");

  // Companies list for matching against an existing employer. Uses the
  // service client (not the RLS-respecting one) because new companies
  // default to status='pending' — the public-read policy only shows
  // 'active' ones, so the admin's own dropdown would never see a company
  // it just created, forcing a duplicate on every subsequent approval.
  const { data: companies } = await db
    .from("companies")
    .select("id, name")
    .order("name");

  // Every ingestion source is one real employer's job board (see migration
  // 028) — resolving that link here means the reviewer never has to pick or
  // type the company by hand for an ingested job, only confirm it.
  const { data: sources } = await db.from("job_ingestion_sources").select("id, company_id");
  const companyIdBySource = new Map((sources ?? []).map((s) => [s.id, s.company_id]));

  if (error) {
    return <p className="text-red-600">Failed to load raw job records: {error.message}</p>;
  }

  const pendingCount = count ?? rawRecords?.length ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-slate-900">Job Ingestion Review</h2>
          <p className="text-sm text-slate-500 mt-1">
            Confirm the details below and publish — career role and company are pre-filled where possible.
          </p>
        </div>
        <div className="shrink-0 text-center bg-brand-50 border border-brand-100 rounded-xl px-5 py-2.5">
          <p className="text-2xl font-display font-semibold text-brand-700 leading-none">{pendingCount}</p>
          <p className="text-xs text-brand-600 mt-1">pending</p>
        </div>
      </div>

      {(!rawRecords || rawRecords.length === 0) && (
        <div className="flex flex-col items-center text-center gap-2 border border-dashed rounded-xl py-16 text-slate-500">
          <Inbox className="w-8 h-8 text-slate-300" />
          <p>Nothing waiting for review right now.</p>
        </div>
      )}

      <div className="space-y-3">
        {rawRecords?.map((record: RawJobRecord) => (
          <RawJobCard
            key={record.id}
            record={record}
            careers={(careers ?? []).map((career: any) => ({
              id: career.id,
              name: career.name,
              categoryName: career.career_categories?.name ?? null,
            }))}
            companies={companies ?? []}
            defaultCompanyId={companyIdBySource.get(record.source_id) ?? null}
          />
        ))}
      </div>
    </div>
  );
}
