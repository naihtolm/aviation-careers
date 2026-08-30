// app/admin/jobs/review/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createServerActionClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service";
import { decodeHtmlEntities } from "@/lib/html";
import { findOrCreateLocation } from "@/lib/locations";

async function assertIsAdmin() {
  const supabase = await createServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: isAdmin } = await supabase.rpc("has_role", {
    target_role: "platform_admin",
  });
  if (!isAdmin) throw new Error("Not authorized");

  return user.id;
}

export interface ApproveRawJobInput {
  rawRecordId: string;
  title: string;
  description: string;
  careerId: string | null;
  companyId: string | null;
  newCompanyName: string | null; // set if admin is creating a company inline
  city: string | null;
  state: string | null;
  applicationUrl: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
}

export async function approveRawJob(input: ApproveRawJobInput) {
  const adminUserId = await assertIsAdmin();
  const db = getServiceClient();

  // 1. Resolve or create the company
  let companyId = input.companyId;
  if (!companyId && input.newCompanyName) {
    const slug = input.newCompanyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // status: 'active' -- an admin approving a raw ingested job has already
    // vetted the source company by definition (they're the one clicking
    // Approve). There's no separate "activate this ingestion-created
    // company" screen anywhere in the app, so defaulting to 'pending' here
    // would leave the company (and every job under it) permanently
    // invisible to the public (companies_public_read requires status =
    // 'active') until someone manually fixes it in the database.
    const { data: company, error: companyError } = await db
      .from("companies")
      .insert({
        name: input.newCompanyName,
        slug,
        company_type: "other", // admin can refine later via company management UI
        status: "active",
      })
      .select("id")
      .single();

    if (companyError) throw new Error(`Failed to create company: ${companyError.message}`);
    companyId = company.id;
  }

  if (!companyId) {
    throw new Error("A company must be selected or created before approving.");
  }

  // 2. Create the job
  const jobSlug = input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const { data: job, error: jobError } = await db
    .from("jobs")
    .insert({
      company_id: companyId,
      career_id: input.careerId,
      title: input.title,
      slug: jobSlug,
      // Greenhouse's API returns `content` already HTML-entity-escaped
      // (e.g. "&lt;div&gt;" instead of "<div>") — decode once here so the
      // stored description is real HTML, not escaped text, matching what
      // dangerouslySetInnerHTML on the job detail page expects and
      // keeping search_vector built from actual words, not entity tokens.
      description: decodeHtmlEntities(input.description),
      status: "active",
      source_type: "feed",
      application_type: "external_url",
      application_url: input.applicationUrl,
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (jobError) throw new Error(`Failed to create job: ${jobError.message}`);

  // 3. Location
  if (input.city && input.state) {
    const locationId = await findOrCreateLocation(input.city, input.state);
    await db.from("job_locations").insert({ job_id: job.id, location_id: locationId, is_primary: true });
  }

  // 4. Compensation
  if (input.salaryMin || input.salaryMax) {
    await db.from("job_compensation").insert({
      job_id: job.id,
      pay_type: "base",
      currency: "USD",
      min_amount: input.salaryMin,
      max_amount: input.salaryMax,
      period: "year",
      is_estimated: false,
      is_public: true,
      source: "employer_feed",
    });
  }

  // 5. Mark the raw record processed + audit log
  await db
    .from("raw_job_records")
    .update({ status: "processed", processed_at: new Date().toISOString() })
    .eq("id", input.rawRecordId);

  await db.from("audit_logs").insert({
    actor_user_id: adminUserId,
    action: "approve_raw_job",
    entity_type: "jobs",
    entity_id: job.id,
    new_data: { raw_record_id: input.rawRecordId },
  });

  revalidatePath("/admin/jobs/review");
  return { jobId: job.id };
}

export async function rejectRawJob(rawRecordId: string, reason: string) {
  const adminUserId = await assertIsAdmin();
  const db = getServiceClient();

  await db
    .from("raw_job_records")
    .update({ status: "rejected", processed_at: new Date().toISOString() })
    .eq("id", rawRecordId);

  await db.from("audit_logs").insert({
    actor_user_id: adminUserId,
    action: "reject_raw_job",
    entity_type: "raw_job_records",
    entity_id: rawRecordId,
    new_data: { reason },
  });

  revalidatePath("/admin/jobs/review");
}
