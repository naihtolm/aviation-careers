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
//   - a parseable city and state -- UNLESS the posting is confidently
//     remote (detectWorkArrangement), in which case there's no real city
//     to require: publishing with a blank location is correct, not missing
//     data
//   - a salary or hourly rate actually stated in the posting
// Employment type and work arrangement auto-fill/default when detected but
// never gate approval -- unlike the above, an imprecise employment type or
// work arrangement doesn't misrepresent the listing the way a wrong career
// category or a fabricated location would.
//
// Anything that doesn't clear this bar is left in raw_job_records with
// status 'received', same as before this existed -- the review queue then
// only shows what genuinely needs a human.

import { getServiceClient } from "@/lib/supabase/service";
import { parseLocation, parseSalaryFromDescription, detectEmploymentType, detectWorkArrangement } from "@/lib/rawJobParsing";
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

// Upper bound on how many raw records a single call inspects, ordered
// oldest-first with no offset -- so this isn't just a throughput cap.
// Non-qualifying records never leave 'received' on their own, which means
// a cap too close to the real backlog size permanently blocks the sweep
// from ever reaching anything past it: with a 150 backlog sitting at ~190
// pending and only a handful qualifying per run, a 150 cap re-scanned the
// same oldest 150 every single time and could never reach records 151+.
// The actual cost that matters here is the concurrent DB-write phase for
// records that qualify (see CONCURRENCY below) -- scanning is cheap even
// at four figures -- so this only needs to be large enough that a single
// run can see the whole realistic backlog, not tuned for wall-clock safety.
const MAX_RECORDS_PER_RUN = 2000;
// How many qualifying records get created concurrently. Each one is a
// handful of independent Supabase round trips (see
// createJobFromRawRecord) -- doing them one record at a time in a loop is
// what actually risked timing out a run over a large backlog.
const CONCURRENCY = 8;

export async function autoApproveQualifyingRawJobs(): Promise<AutoApproveResult> {
  const db = getServiceClient();

  const [{ data: rawRecords }, { data: sources }, { data: careers }] = await Promise.all([
    // Ordered oldest-first, same as the review page's own query -- without
    // an explicit order, which ~150 of a large backlog land in a given run
    // isn't guaranteed, so a job visibly sitting at the top of the review
    // queue could keep getting skipped by runs that happen to fetch a
    // different slice than the one shown on screen.
    db.from("raw_job_records").select("id, source_id, raw_data").eq("status", "received").order("received_at", { ascending: true }).limit(MAX_RECORDS_PER_RUN),
    db.from("job_ingestion_sources").select("id, company_id"),
    db.from("careers").select("id, name").eq("active", true),
  ]);

  const companyIdBySource = new Map((sources ?? []).map((s) => [s.id, s.company_id]));
  const careerOptions = careers ?? [];

  const qualifying: {
    record: RawJobRecordRow;
    companyId: string;
    city: string;
    state: string;
    careerId: string;
    salary: { min: number; max: number; period: "hour" | "year" };
    employmentType: string;
    workArrangement: string;
  }[] = [];

  for (const record of (rawRecords ?? []) as RawJobRecordRow[]) {
    const title = record.raw_data.title?.trim() ?? "";
    const content = record.raw_data.content?.trim() ?? "";
    if (!title || !content) continue;

    const companyId = companyIdBySource.get(record.source_id);
    if (!companyId) continue;

    const locationRaw = record.raw_data.location?.name ?? "";
    const workArrangement = detectWorkArrangement(locationRaw, title) ?? "on_site";
    const { city, state } = parseLocation(locationRaw);
    const hasLocation = city.trim() && state.trim();
    if (!hasLocation && workArrangement !== "remote") continue;

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
      workArrangement,
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
            workArrangement: q.workArrangement,
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
