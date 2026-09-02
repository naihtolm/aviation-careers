// app/admin/jobs/review/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createServerActionClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service";
import { createJobFromRawRecord } from "@/lib/ingestion/createJobFromRawRecord";
import { autoApproveQualifyingRawJobs } from "@/lib/ingestion/auto-approve";

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
  newCompanyWebsite: string | null;
  city: string | null;
  state: string | null;
  applicationUrl: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPeriod: "hour" | "year";
  employmentType: string | null;
  workArrangement: string;
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
        website: input.newCompanyWebsite || null,
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

  const jobId = await createJobFromRawRecord(
    {
      rawRecordId: input.rawRecordId,
      title: input.title,
      description: input.description,
      careerId: input.careerId,
      companyId,
      city: input.city,
      state: input.state,
      applicationUrl: input.applicationUrl,
      salaryMin: input.salaryMin,
      salaryMax: input.salaryMax,
      salaryPeriod: input.salaryPeriod,
      employmentType: input.employmentType,
      workArrangement: input.workArrangement,
    },
    { userId: adminUserId, action: "approve_raw_job" }
  );

  revalidatePath("/admin/jobs/review");
  return { jobId };
}

// Manual trigger for the same sweep the ingestion cron runs automatically --
// lets the admin clear the *existing* backlog against the current matching
// rules right now, instead of waiting for tomorrow's cron run.
export async function runAutoApproveNow() {
  await assertIsAdmin();
  const result = await autoApproveQualifyingRawJobs();
  revalidatePath("/admin/jobs/review");
  return result;
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
