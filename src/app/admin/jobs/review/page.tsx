// app/admin/jobs/review/page.tsx
import { createServerActionClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service";
import { normalizeRawData } from "@/lib/ingestion/normalizeRawData";
import { RawJobReviewList } from "./RawJobReviewList";

// "Auto-publish qualifying jobs now" (RawJobReviewList) invokes
// runAutoApproveNow, which can walk up to ~150 raw records -- Server
// Actions inherit the route segment's maxDuration, and the platform
// default is too short for that sweep, same reason the cron routes that
// call the same code declare this.
export const maxDuration = 60;

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

  // Categories for the "create a new career role" picker -- a career
  // needs one (career.category_id is required), so an admin creating a
  // role that doesn't fit anything existing still has to place it
  // somewhere in the taxonomy.
  const { data: careerCategories } = await supabase
    .from("career_categories")
    .select("id, name")
    .order("display_order");

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
  const { data: sources } = await db.from("job_ingestion_sources").select("id, company_id, source_type");
  // Plain object, not a Map -- this crosses the server/client boundary as a
  // prop to RawJobReviewList, and Maps aren't serializable there.
  const companyIdBySource: Record<string, string | null> = Object.fromEntries(
    (sources ?? []).map((s) => [s.id, s.company_id])
  );
  const sourceTypeBySource: Record<string, string> = Object.fromEntries(
    (sources ?? []).map((s) => [s.id, s.source_type])
  );

  if (error) {
    return <p className="text-red-400">Failed to load raw job records: {error.message}</p>;
  }

  const pendingCount = count ?? rawRecords?.length ?? 0;

  // Every source's raw payload gets reshaped into the one shape the review
  // UI already knows how to render, right here, once -- see
  // normalizeRawData.ts for why this lives here instead of in the
  // component. The DB row itself (raw_job_records.raw_data) is untouched.
  const normalizedRecords = (rawRecords ?? []).map((r) => ({
    ...r,
    raw_data: normalizeRawData(sourceTypeBySource[r.source_id] ?? "greenhouse", r.raw_data),
  }));

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-white">Job Ingestion Review</h2>
          <p className="text-sm text-slate-400 mt-1">
            Confirm the details below and publish — career role and company are pre-filled where possible.
          </p>
        </div>
        <div className="shrink-0 text-center bg-brand-400/10 border border-brand-400/20 rounded-xl px-5 py-2.5">
          <p className="text-2xl font-display font-semibold text-brand-300 leading-none">{pendingCount}</p>
          <p className="text-xs text-brand-300 mt-1">pending</p>
        </div>
      </div>

      <RawJobReviewList
        initialRecords={normalizedRecords}
        careers={(careers ?? []).map((career: any) => ({
          id: career.id,
          name: career.name,
          categoryName: career.career_categories?.name ?? null,
        }))}
        companies={companies ?? []}
        companyIdBySource={companyIdBySource}
        careerCategories={careerCategories ?? []}
      />
    </div>
  );
}
