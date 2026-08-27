// app/admin/jobs/review/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createServerActionClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service";

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

    const { data: company, error: companyError } = await db
      .from("companies")
      .insert({
        name: input.newCompanyName,
        slug,
        company_type: "other", // admin can refine later via company management UI
        status: "pending",
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
      description: input.description,
      status: "active",
      source_type: "feed",
      application_type: "external_url",
      application_url: input.applicationUrl,
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (jobError) throw new Error(`Failed to create job: ${jobError.message}`);

  // 3. Location (free text for now — normalized `locations` matching is Phase 1.5+)
  if (input.city || input.state) {
    await db.from("job_locations").insert({
      job_id: job.id,
      is_primary: true,
      // location_id intentionally left null until we run city/state through
      // the `locations` table matcher; storing the raw text on job_events
      // metadata or a future job_locations.raw_text column is the
      // Phase 1.5 follow-up if this manual step turns out to be common.
    });
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
