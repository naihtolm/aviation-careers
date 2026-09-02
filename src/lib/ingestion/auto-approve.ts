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

// Upper bound on how many raw records a single call inspects. Matched
// records are marked 'processed' as they're created, so a batch this size
// isn't a hard cap on throughput -- it just means a backlog bigger than
// this takes more than one call (one cron run, or one click of "Auto-publish
// qualifying jobs now") to fully clear, which keeps each individual call
// comfortably inside a serverless function's wall-clock limit.
const MAX_RECORDS_PER_RUN = 150;
// How many qualifying records get created concurrently. Each one is a
// handful of independent Supabase round trips (see
// createJobFromRawRecord) -- doing them one record at a time in a loop is
// what actually risked timing out a run over a large backlog.
const CONCURRENCY = 8;

export async function autoApproveQualifyingRawJobs(): Promise<AutoApproveResult> {
  const db = getServiceClient();

  const [{ data: rawRecords }, { data: sources }, { data: careers }] = await Promise.all([
    db.from("raw_job_records").select("id, source_id, raw_data").eq("status", "received").limit(MAX_RECORDS_PER_RUN),
    db.from("job_ingestion_sources").select("id, company_id"),
    db.from("careers").select("id, name").eq("active", true),
  ]);

  const companyIdBySource = new Map((sources ?? []).map((s) => [s.id, s.company_id]));
  const careerOptions = careers ?? [];

  const qualifying: { record: RawJobRecordRow; companyId: string; city: string; state: string; careerId: string; salary: { min: number; max: number; period: "hour" | "year" }; employmentType: string }[] = [];

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

    qualifying.push({
      record,
      companyId,
      city,
      state,
      careerId: careerMatch.id,
      salary,
      employmentType: detectEmploymentType(title, content) ?? "full_time",
    });
  }

  const jobIds: string[] = [];
  const rawRecordIds: string[] = [];

  for (let i = 0; i < qualifying.length; i += CONCURRENCY) {
    const batch = qualifying.slice(i, i + CONCURRENCY);
    // allSettled, not all -- one record failing (a transient DB hiccup, a
    // slug collision) shouldn't take the rest of the batch down with it.
    // A failed record simply stays 'received' and shows up in the review
    // queue like any other unqualified job, instead of the whole sweep
    // erroring out.
    const results = await Promise.allSettled(
      batch.map((q) =>
        createJobFromRawRecord(
          {
            rawRecordId: q.record.id,
            title: q.record.raw_data.title!.trim(),
            description: q.record.raw_data.content!.trim(),
            careerId: q.careerId,
            companyId: q.companyId,
            city: q.city,
            state: q.state,
            applicationUrl: q.record.raw_data.absolute_url ?? null,
            salaryMin: q.salary.min,
            salaryMax: q.salary.max,
            salaryPeriod: q.salary.period,
            employmentType: q.employmentType,
          },
          { userId: null, action: "auto_approve_raw_job" }
        ).then((jobId) => ({ jobId, rawRecordId: q.record.id }))
      )
    );
    for (const r of results) {
      if (r.status === "fulfilled") {
        jobIds.push(r.value.jobId);
        rawRecordIds.push(r.value.rawRecordId);
      }
    }
  }

  return { evaluated: rawRecords?.length ?? 0, approved: jobIds.length, jobIds, rawRecordIds };
}
