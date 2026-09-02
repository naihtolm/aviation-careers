// lib/rawJobParsing.ts
//
// Best-effort extraction of structured fields (location, salary,
// employment type) out of a raw ingested job posting's free-text title and
// HTML description. Framework-agnostic on purpose: the admin review card
// (a client component) uses these for live preview/editing, and the
// server-side auto-approve sweep (lib/ingestion/auto-approve.ts) uses the
// exact same logic to decide whether a posting is confident enough to
// publish unattended -- the two paths would drift out of sync if each kept
// its own copy.

import { decodeHtmlEntities } from "./html";

export const EMPLOYMENT_TYPES = ["full_time", "part_time", "contract", "temporary", "internship"] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const WORK_ARRANGEMENTS = ["on_site", "hybrid", "remote"] as const;
export type WorkArrangement = (typeof WORK_ARRANGEMENTS)[number];

// Greenhouse location strings vary a lot: "Irvine, CA", "Manassas, VA",
// "Manchester, Connecticut, United States", or with a street address
// prefixed on -- "9990 Wakeman Drive, Manassas, VA 20110". A naive
// split(",")[0,1] reads that last one as city="9990 Wakeman Drive",
// state="Manassas". Drop a leading segment that looks like a street
// address, and strip a trailing ZIP off the state segment. A remote
// posting's location is often just "Remote" or "Remote - US" -- that's
// not a real city, so blank it out rather than publishing "Remote" as if
// it were one (detectWorkArrangement below is what actually flags the job
// as remote).
export function parseLocation(raw: string): { city: string; state: string } {
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length > 2 && /^\d/.test(parts[0])) parts.shift();
  let city = parts[0] ?? "";
  const state = (parts[1] ?? "").replace(/\s*\d{5}(-\d{4})?$/, "").trim();
  if (/\bremote\b/i.test(city)) city = "";
  return { city, state };
}

// Location field is the authoritative signal when a source sets it
// ("Remote", "Remote - US", "Hybrid - Austin, TX"); title sometimes
// carries it too ("Senior Engineer (Remote)"). Deliberately doesn't scan
// the full description body -- that risks false positives from unrelated
// mentions ("occasional remote work days" in a benefits blurb) that the
// short, purpose-built location/title fields don't have.
export function detectWorkArrangement(locationRaw: string, title: string): WorkArrangement | null {
  const text = `${locationRaw} ${title}`;
  if (/\bremote\b/i.test(text)) return "remote";
  if (/\bhybrid\b/i.test(text)) return "hybrid";
  return null;
}

function scanSalaryRanges(text: string, pattern: RegExp): { min: number; max: number; period: "hour" | "year" } | null {
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    const min = Number(match[1].replace(/,/g, ""));
    const max = Number(match[2].replace(/,/g, ""));
    if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) continue;

    const after = text.slice(match.index + match[0].length, match.index + match[0].length + 20);
    const isHourly = /^\s*\/?\s*(hr|hour)\b/i.test(after) || /^\s*per\s+hour\b/i.test(after);
    const isAnnual = /^\s*\/?\s*(yr|year)\b/i.test(after) || /^\s*(per\s+year|annually)\b/i.test(after);

    if (isHourly || (!isAnnual && max < 300)) {
      if (min < 5 || max > 500) continue;
      return { min, max, period: "hour" };
    }
    if (min < 10_000 || max > 5_000_000) continue;
    return { min, max, period: "year" };
  }
  return null;
}

// Structured Greenhouse fields never carry compensation, but the
// description text almost always does -- pay-transparency laws mean most
// postings include a line like "targeting a base pay between $144,000 -
// $180,000" or "$28.00 - $35.00 per hour" in the body itself. Decode first:
// Greenhouse's `content` is already HTML-entity-escaped (real tags appear
// as literal "&lt;span&gt;" text, not "<span>"), and a compensation range
// is often split across adjacent tags ("$75,000</span><span>$100,000") --
// without decoding first, the tag-strip regex below doesn't recognize
// those as tags at all, so the escaped markup survives between the two
// numbers and breaks the adjacency this pattern needs. Then strip tags and
// scan for a "$X - $Y" / "$X to $Y" range, using the text right after the
// match ("/hr", "per hour", "/yr", "annually") to tell an hourly rate apart
// from a salary -- and falling back to the numbers' own magnitude when
// there's no unit word at all, since a bare "$18 - $24" is never an annual
// figure. Skips a match that fails a sanity check for its guessed period
// (e.g. "$3 - $4" is too small to be a real hourly rate either) and keeps
// scanning, rather than returning a false positive off the first $ sign in
// the text.
export function parseSalaryFromDescription(html: string): { min: number; max: number; period: "hour" | "year" } | null {
  const text = decodeHtmlEntities(html).replace(/<[^>]+>/g, " ");

  const dashResult = scanSalaryRanges(text, /\$\s*([\d,]+(?:\.\d+)?)\s*(?:-|–|—|to)\s*\$\s*([\d,]+(?:\.\d+)?)/gi);
  if (dashResult) return dashResult;

  // Fallback: some Greenhouse themes render a range as two separately
  // styled <span> elements with no dash character in the text at all --
  // the visual dash between "$155,000" and "$175,000" is drawn by CSS,
  // not present in the underlying content. Once tags are stripped, that's
  // just two dollar amounts a few spaces apart with nothing else between
  // them. Require that tight a gap (not "prose distance") so this doesn't
  // pair up two unrelated dollar mentions elsewhere in the posting.
  return scanSalaryRanges(text, /\$\s*([\d,]+(?:\.\d+)?)\s{1,10}\$\s*([\d,]+(?:\.\d+)?)/g);
}

// Most sources don't have a structured employment-type field either, but
// contract/temp/intern roles are almost always called out explicitly in the
// title or body ("6-month contract", "Summer Internship", "Temporary
// Warehouse Associate"). Checked most-specific first, since a posting can
// mention more than one of these words in unrelated contexts. Anything with
// no signal at all returns null -- callers default to Full Time themselves,
// rather than guessing here.
export function detectEmploymentType(title: string, html: string): EmploymentType | null {
  const text = `${title} ${decodeHtmlEntities(html).replace(/<[^>]+>/g, " ")}`;
  if (/\bintern(ship)?\b/i.test(text)) return "internship";
  if (/\btemporary\b|\bseasonal\b/i.test(text)) return "temporary";
  if (/\bcontract(or)?\b|\bcontract-to-hire\b|\bc2h\b|\bfixed[- ]term\b/i.test(text)) return "contract";
  if (/\bpart[- ]time\b/i.test(text)) return "part_time";
  return null;
}
