// lib/ingestion/createJobFromRawRecord.ts
//
// Materializes a raw_job_records row into a real, published jobs row --
// the exact same mechanics whether a human clicked Approve on the review
// page or the auto-approve sweep (lib/ingestion/auto-approve.ts) decided
// the posting was confident enough to publish unattended. Company
// resolution (including creating a brand-new company) is deliberately kept
// out of this function and stays the admin review action's job alone --
// that's a judgment call auto-approve should never make on its own, so it
// only ever calls this with a companyId it already knows from the
// ingestion source mapping.

import { getServiceClient } from "@/lib/supabase/service";
import { decodeHtmlEntities } from "@/lib/html";
import { findOrCreateLocation } from "@/lib/locations";

export interface CreateJobFromRawRecordInput {
  rawRecordId: string;
  title: string;
  description: string;
  careerId: string | null;
  companyId: string;
  city: string | null;
  state: string | null;
  applicationUrl: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPeriod: "hour" | "year";
  employmentType: string | null;
}

export async function createJobFromRawRecord(
  input: CreateJobFromRawRecordInput,
  actor: { userId: string | null; action: "approve_raw_job" | "auto_approve_raw_job" }
): Promise<string> {
  const db = getServiceClient();

  const jobSlug = input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const { data: job, error: jobError } = await db
    .from("jobs")
    .insert({
      company_id: input.companyId,
      career_id: input.careerId,
      title: input.title,
      slug: jobSlug,
      // Greenhouse's API returns `content` already HTML-entity-escaped
      // (e.g. "&lt;div&gt;" instead of "<div>") — decode once here so the
      // stored description is real HTML, not escaped text, matching what
      // dangerouslySetInnerHTML on the job detail page expects and
      // keeping search_vector built from actual words, not entity tokens.
      description: decodeHtmlEntities(input.description),
      employment_type: input.employmentType,
      status: "active",
      source_type: "feed",
      application_type: "external_url",
      application_url: input.applicationUrl,
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (jobError) throw new Error(`Failed to create job: ${jobError.message}`);

  // These four writes don't depend on each other (only on job.id, already
  // in hand) -- running them concurrently instead of one-at-a-time matters
  // a lot when auto-approve calls this in a loop over a couple hundred
  // records in a single serverless invocation with a hard wall-clock limit.
  const tasks: PromiseLike<unknown>[] = [];

  if (input.city && input.state) {
    tasks.push(
      findOrCreateLocation(input.city, input.state).then((locationId) =>
        db.from("job_locations").insert({ job_id: job.id, location_id: locationId, is_primary: true })
      )
    );
  }

  if (input.salaryMin || input.salaryMax) {
    tasks.push(
      db.from("job_compensation").insert({
        job_id: job.id,
        pay_type: "base",
        currency: "USD",
        min_amount: input.salaryMin,
        max_amount: input.salaryMax,
        period: input.salaryPeriod,
        is_estimated: false,
        is_public: true,
        source: "employer_feed",
      })
    );
  }

  tasks.push(
    db.from("raw_job_records").update({ status: "processed", processed_at: new Date().toISOString() }).eq("id", input.rawRecordId)
  );

  tasks.push(
    db.from("audit_logs").insert({
      actor_user_id: actor.userId,
      action: actor.action,
      entity_type: "jobs",
      entity_id: job.id,
      new_data: { raw_record_id: input.rawRecordId },
    })
  );

  await Promise.all(tasks);

  return job.id;
}
