// app/admin/jobs/review/page.tsx
import { redirect } from "next/navigation";
import { createServerActionClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service";
import { RawJobCard } from "./RawJobCard";

interface RawJobRecord {
  id: string;
  external_id: string | null;
  raw_data: {
    title?: string;
    location?: { name?: string } | null;
    content?: string;
    absolute_url?: string;
  };
  received_at: string;
  source_id: string;
}

export default async function JobReviewPage() {
  const supabase = await createServerActionClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: isAdmin } = await supabase.rpc("has_role", {
    target_role: "platform_admin",
  });
  if (!isAdmin) redirect("/");

  // raw_job_records has no client-facing RLS policy at all (service-role
  // only, by design — see supabase/migrations/010_rls_policies.sql) so
  // this read has to go through the service client. The role check above,
  // using the user's own session, is what stands in for RLS here.
  const db = getServiceClient();

  // Pending raw records, oldest first — process the backlog in order.
  const { data: rawRecords, error } = await db
    .from("raw_job_records")
    .select("id, external_id, raw_data, received_at, source_id")
    .eq("status", "received")
    .order("received_at", { ascending: true })
    .limit(50);

  // Careers list for the approve-form dropdown.
  const { data: careers } = await supabase
    .from("careers")
    .select("id, name")
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

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">Failed to load raw job records: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-2">Job Ingestion Review</h1>
      <p className="text-sm text-gray-500 mb-6">
        {rawRecords?.length ?? 0} pending job(s) awaiting review, oldest first.
      </p>

      {(!rawRecords || rawRecords.length === 0) && (
        <p className="text-gray-500">Nothing waiting for review right now.</p>
      )}

      <div className="space-y-4">
        {rawRecords?.map((record: RawJobRecord) => (
          <RawJobCard
            key={record.id}
            record={record}
            careers={careers ?? []}
            companies={companies ?? []}
          />
        ))}
      </div>
    </div>
  );
}
