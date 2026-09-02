// lib/ingestion/auto-approve.ts
//
// Publishes an ingested raw job record straight to the live site, with no
// human review, but only when every field that would otherwise need a
// judgment call is confidently resolved. Called after every ingestion cron
// run, and manually from the review page (runAutoApproveNow) to sweep the
// existing backlog.
//
// The bar, deliberately conservative:
//   - the source's own company is known (always true in practice -- every
//     ingestion source maps 1:1 to a company, migration 028)
//   - a *specific* career-role match (TITLE_RULES confidence: "high" in
//     careerMatching.ts) -- the broad engineer/technician/manager
//     catch-alls are real guesses and are excluded on purpose
//   - a parseable city and state
//   - a salary or hourly rate actually stated in the posting
// Employment type is auto-filled/defaulted when detected but never gates
// approval -- unlike the above, an imprecise employment type doesn't
// misrepresent the listing the way a wrong career category or a
// fabricated location would.
//
// Anything that doesn't clear this bar is left in raw_job_records with
// status 'received', same as before this existed -- the review queue then
// only shows what genuinely needs a human.

import { getServiceClient } from "@/lib/supabase/service";
import { parseLocation, parseSalaryFromDescription, detectEmploymentType } from "@/lib/rawJobParsing";
import { suggestCareerMatch } from "@/lib/careerMatching";
import { createJobFromRawRecord } from "./createJobFromRawRecord";

export interface AutoApproveResult {
  evaluated: number;
  approved: number;
  jobIds: string[];
  rawRecordIds: string[];
}

interface RawJobRecordRow {
  id: string;
  source_id: string;
  raw_data: {
    title?: string;
    content?: string;
    location?: { name?: string } | null;
    absolute_url?: string;
  };
}

export async function autoApproveQualifyingRawJobs(): Promise<AutoApproveResult> {
  const db = getServiceClient();

  const [{ data: rawRecords }, { data: sources }, { data: careers }] = await Promise.all([
    db.from("raw_job_records").select("id, source_id, raw_data").eq("status", "received"),
    db.from("job_ingestion_sources").select("id, company_id"),
    db.from("careers").select("id, name").eq("active", true),
  ]);

  const companyIdBySource = new Map((sources ?? []).map((s) => [s.id, s.company_id]));
  const careerOptions = careers ?? [];
  const jobIds: string[] = [];
  const rawRecordIds: string[] = [];

  for (const record of (rawRecords ?? []) as RawJobRecordRow[]) {
    const title = record.raw_data.title?.trim() ?? "";
    const content = record.raw_data.content?.trim() ?? "";
    if (!title || !content) continue;

    const companyId = companyIdBySource.get(record.source_id);
    if (!companyId) continue;

    const { city, state } = parseLocation(record.raw_data.location?.name ?? "");
    if (!city.trim() || !state.trim()) continue;

    const careerMatch = suggestCareerMatch(title, careerOptions);
    if (!careerMatch || careerMatch.confidence !== "high") continue;

    const salary = parseSalaryFromDescription(content);
    if (!salary) continue;

    const employmentType = detectEmploymentType(title, content) ?? "full_time";

    const jobId = await createJobFromRawRecord(
      {
        rawRecordId: record.id,
        title,
        description: content,
        careerId: careerMatch.id,
        companyId,
        city,
        state,
        applicationUrl: record.raw_data.absolute_url ?? null,
        salaryMin: salary.min,
        salaryMax: salary.max,
        salaryPeriod: salary.period,
        employmentType,
      },
      { userId: null, action: "auto_approve_raw_job" }
    );
    jobIds.push(jobId);
    rawRecordIds.push(record.id);
  }

  return { evaluated: rawRecords?.length ?? 0, approved: jobIds.length, jobIds, rawRecordIds };
}
