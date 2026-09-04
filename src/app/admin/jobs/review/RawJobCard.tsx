// app/admin/jobs/review/RawJobCard.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { MapPin, Clock, Building2, ChevronDown, Check, X } from "lucide-react";
import { approveRawJob, rejectRawJob } from "./actions";
import { decodeHtmlEntities } from "@/lib/html";
import { groupCareers, suggestCareerMatch } from "@/lib/careerMatching";
import { titleCase } from "@/lib/text";
import {
  EMPLOYMENT_TYPES,
  WORK_ARRANGEMENTS,
  parseLocation,
  parseSalaryFromDescription,
  detectEmploymentType,
  detectWorkArrangement,
} from "@/lib/rawJobParsing";

// Clearbit's free, unauthenticated company-lookup API -- used only to
// suggest a website domain as the admin types a new company name so they
// don't have to go look it up themselves. Best-effort: if it's down, rate
// limited, or finds nothing, the admin just types the website manually
// like before.
async function suggestWebsite(companyName: string): Promise<string | null> {
  try {
    const res = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(companyName)}`);
    if (!res.ok) return null;
    const results = await res.json();
    return results?.[0]?.domain ? `https://${results[0].domain}` : null;
  } catch {
    return null;
  }
}

interface Career {
  id: string;
  name: string;
  categoryName?: string | null;
}

interface Company {
  id: string;
  name: string;
}

interface CareerCategory {
  id: string;
  name: string;
}

interface RawJobRecord {
  id: string;
  external_id: string | null;
  raw_data: {
    title?: string;
    location?: { name?: string } | null;
    content?: string;
    absolute_url?: string;
    company_name?: string;
  };
  received_at: string;
  source_id: string;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Date.now() returns a different value on the server (at request time) than
// on the client (at hydration time) -- with 300+ records on this page, the
// odds that at least one crosses an hour/day boundary in between are high
// enough that it reliably triggered a React hydration mismatch. Computing
// it only after mount keeps the server-rendered HTML and the first client
// render identical; the real value fills in a moment later.
function TimeAgo({ iso }: { iso: string }) {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => setLabel(timeAgo(iso)), [iso]);
  return <>{label ?? "…"}</>;
}

export function RawJobCard({
  record,
  careers,
  careerCategories,
  companies,
  defaultCompanyId,
  onSettled,
  onCareerCreated,
}: {
  record: RawJobRecord;
  careers: Career[];
  careerCategories: CareerCategory[];
  companies: Company[];
  defaultCompanyId?: string | null;
  onSettled: (id: string) => void;
  onCareerCreated: (career: Career) => void;
}) {
  const title = record.raw_data.title ?? "(untitled)";
  const suggestedCareer = suggestCareerMatch(title, careers);
  const suggestedCareerId = suggestedCareer?.id ?? null;
  const careerGroups = groupCareers(careers);
  const matchedCompany = defaultCompanyId ? companies.find((c) => c.id === defaultCompanyId) : undefined;
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  // Approve/reject don't just remove the card -- they flash a confirmation
  // color first, then collapse it away, so the outcome of a click actually
  // registers before the item disappears. `outcome` drives the color/label,
  // `collapsing` (set a beat later) drives the height/fade-out; onSettled
  // (which removes this record from the parent's list) fires only once the
  // collapse transition has actually finished.
  const [outcome, setOutcome] = useState<"approved" | "rejected" | null>(null);
  const [collapsing, setCollapsing] = useState(false);

  useEffect(() => {
    if (!collapsing) return;
    const timer = setTimeout(() => onSettled(record.id), 260);
    return () => clearTimeout(timer);
  }, [collapsing, onSettled, record.id]);
  const [careerId, setCareerId] = useState(suggestedCareerId ?? "");
  // No existing career fit at all -- rather than force a pick from the
  // list or leave it uncategorized forever, let the admin add a new one
  // right here (mirrors the inline "create a new company" flow below).
  // Only reachable when nothing was suggested; a low-confidence guess
  // still shows in the select so switching to it stays one click either
  // way instead of retyping a name that's already right there.
  //
  // newCareerName deliberately does NOT default to the raw job title --
  // that produced a real published career called "Associate General
  // Counsel, Employment" (the literal req title) instead of a reusable
  // category, because it was one less thing to type so the exact title
  // just got approved as-is. Starting blank forces a deliberate, general
  // name -- this is a permanent public taxonomy entry, not per-job data.
  const [creatingCareer, setCreatingCareer] = useState(false);
  const [newCareerName, setNewCareerName] = useState("");
  const [newCareerCategoryId, setNewCareerCategoryId] = useState("");
  // Every ingestion source maps to exactly one real employer (migration
  // 028), so defaultCompanyId is reliable — no need to fuzzy-match
  // raw_data.company_name ("Archer") against the company's display name
  // ("Archer Aviation"), which often wouldn't line up anyway.
  const [companyId, setCompanyId] = useState(defaultCompanyId ?? "");
  const [newCompanyName, setNewCompanyName] = useState(defaultCompanyId ? "" : record.raw_data.company_name ?? "");
  const [newCompanyWebsite, setNewCompanyWebsite] = useState("");
  const [websiteEdited, setWebsiteEdited] = useState(false);
  const [suggestingWebsite, setSuggestingWebsite] = useState(false);
  const parsedSalary = parseSalaryFromDescription(record.raw_data.content ?? "");
  const [salaryMin, setSalaryMin] = useState(parsedSalary ? String(parsedSalary.min) : "");
  const [salaryMax, setSalaryMax] = useState(parsedSalary ? String(parsedSalary.max) : "");
  const [salaryPeriod, setSalaryPeriod] = useState<"hour" | "year">(parsedSalary?.period ?? "year");
  const detectedEmploymentType = detectEmploymentType(title, record.raw_data.content ?? "");
  const [employmentType, setEmploymentType] = useState(detectedEmploymentType ?? "full_time");
  // Once a company is auto-matched via the ingestion source, show it as a
  // confirmed fact rather than an editable dropdown -- "Change" drops back
  // to the old picker for the rare case the source's default is wrong.
  const [overrideCompany, setOverrideCompany] = useState(false);

  // Debounced auto-suggest: once the admin pauses typing a new company
  // name, look up a likely website domain and fill it in -- unless they've
  // already typed/edited the website field themselves.
  useEffect(() => {
    if (companyId || websiteEdited || newCompanyName.trim().length < 3) return;
    const timer = setTimeout(async () => {
      setSuggestingWebsite(true);
      const suggestion = await suggestWebsite(newCompanyName.trim());
      setSuggestingWebsite(false);
      if (suggestion && !websiteEdited) setNewCompanyWebsite(suggestion);
    }, 600);
    return () => clearTimeout(timer);
  }, [newCompanyName, companyId, websiteEdited]);

  const location = record.raw_data.location?.name ?? "";
  const parsedLocation = parseLocation(location);
  const [city, setCity] = useState(parsedLocation.city);
  const [state, setState] = useState(parsedLocation.state);
  const detectedWorkArrangement = detectWorkArrangement(location, title);
  const [workArrangement, setWorkArrangement] = useState(detectedWorkArrangement ?? "on_site");

  function handleApprove() {
    startTransition(async () => {
      const result = await approveRawJob({
        rawRecordId: record.id,
        title,
        description: record.raw_data.content ?? "",
        careerId: careerId || null,
        newCareerName: careerId ? null : newCareerName.trim() || null,
        newCareerCategoryId: careerId ? null : newCareerCategoryId || null,
        companyId: companyId || null,
        newCompanyName: companyId ? null : newCompanyName || null,
        newCompanyWebsite: companyId ? null : newCompanyWebsite.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        applicationUrl: record.raw_data.absolute_url ?? null,
        salaryMin: salaryMin ? Number(salaryMin) : null,
        salaryMax: salaryMax ? Number(salaryMax) : null,
        salaryPeriod,
        employmentType,
        workArrangement,
      });
      if (result.createdCareer) onCareerCreated(result.createdCareer);
      setOutcome("approved");
      setTimeout(() => setCollapsing(true), 220);
    });
  }

  function handleReject() {
    const reason = prompt("Reason for rejecting (optional):") ?? "";
    startTransition(async () => {
      await rejectRawJob(record.id, reason);
      setOutcome("rejected");
      setTimeout(() => setCollapsing(true), 220);
    });
  }

  const fieldClass =
    "w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition-colors";

  return (
    // The grid/overflow-hidden pair is what makes the collapse smooth without
    // a fixed pixel height: animating grid-template-rows from 1fr to 0fr
    // shrinks this row's track to nothing, and overflow-hidden clips the
    // content (border, padding, the pb-3 gap below) along with it, so there's
    // no leftover space once the card is actually removed from the list.
    <div className={`grid transition-[grid-template-rows] duration-[260ms] ease-in-out ${collapsing ? "grid-rows-[0fr]" : "grid-rows-[1fr]"}`}>
      <div className="overflow-hidden">
        <div className="pb-3">
          <div
            className={`border rounded-xl transition-all duration-200 ${
              collapsing
                ? "opacity-0 scale-[0.97]"
                : outcome === "approved"
                  ? "bg-emerald-500/10 border-emerald-400/30"
                  : outcome === "rejected"
                    ? "bg-white/[0.06] border-white/15"
                    : expanded
                      ? "bg-white/[0.05] border-brand-400/30"
                      : "bg-white/[0.04] border-white/10"
            }`}
          >
      <button
        onClick={() => !outcome && setExpanded((e) => !e)}
        className="w-full flex items-start justify-between gap-4 p-4 text-left"
      >
        <div className="min-w-0">
          <h3 className="font-medium text-white truncate">{title}</h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm text-slate-400">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              {location || "No location provided"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              {matchedCompany?.name ?? record.raw_data.company_name ?? "Unknown company"}
            </span>
            <span className="inline-flex items-center gap-1 text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              <TimeAgo iso={record.received_at} />
            </span>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-500 shrink-0 mt-0.5 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/10 pt-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Career role</label>
            <select className={fieldClass} value={careerId} onChange={(e) => setCareerId(e.target.value)}>
              <option value="" className="text-slate-900">— Select career role —</option>
              {careerGroups.map((group) => (
                <optgroup key={group.category} label={group.category} className="text-slate-900">
                  {group.options.map((career) => (
                    <option key={career.id} value={career.id} className="text-slate-900">{career.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            {suggestedCareerId && careerId === suggestedCareerId && (
              suggestedCareer?.confidence === "high" ? (
                <p className="text-xs text-emerald-300 mt-1.5 inline-flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Suggested from the job title — please confirm before publishing.
                </p>
              ) : (
                <p className="text-xs text-amber-300 mt-1.5 inline-flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Broad guess from the job title, not an exact match — please double-check this one. (Suggestions
                  this loose don't qualify for auto-publish.)
                </p>
              )
            )}

            {!creatingCareer ? (
              <button
                type="button"
                onClick={() => setCreatingCareer(true)}
                className="text-xs text-brand-300 underline underline-offset-2 mt-1.5"
              >
                Can't find the right fit? Create a new career role
              </button>
            ) : (
              <div className="mt-2 space-y-2 border border-white/10 rounded-lg p-3 bg-white/[0.03]">
                <input
                  type="text"
                  placeholder="New career role name"
                  className={fieldClass}
                  value={newCareerName}
                  onChange={(e) => setNewCareerName(e.target.value)}
                />
                <select
                  className={fieldClass}
                  value={newCareerCategoryId}
                  onChange={(e) => setNewCareerCategoryId(e.target.value)}
                >
                  <option value="" className="text-slate-900">— Select a category —</option>
                  {careerCategories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="text-slate-900">{cat.name}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-400">
                  Adds this as a new career role (with no guide content yet — refine it later) and links this job to
                  it. It'll be selectable for every other job going forward.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCreatingCareer(false);
                    setNewCareerCategoryId("");
                  }}
                  className="text-xs text-slate-500 underline underline-offset-2"
                >
                  Cancel — pick from the list instead
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Employment type</label>
            <select className={fieldClass} value={employmentType} onChange={(e) => setEmploymentType(e.target.value as typeof employmentType)}>
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t} value={t} className="text-slate-900">{titleCase(t)}</option>
              ))}
            </select>
            {detectedEmploymentType && employmentType === detectedEmploymentType && (
              <p className="text-xs text-emerald-300 mt-1.5 inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Detected from the posting — please confirm before publishing.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Work arrangement</label>
            <select className={fieldClass} value={workArrangement} onChange={(e) => setWorkArrangement(e.target.value as typeof workArrangement)}>
              {WORK_ARRANGEMENTS.map((w) => (
                <option key={w} value={w} className="text-slate-900">{titleCase(w)}</option>
              ))}
            </select>
            {detectedWorkArrangement && workArrangement === detectedWorkArrangement && (
              <p className="text-xs text-emerald-300 mt-1.5 inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Detected from the posting — please confirm before publishing.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                City {workArrangement === "remote" && <span className="font-normal text-slate-400">(optional — remote)</span>}
              </label>
              <input type="text" className={fieldClass} value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                State {workArrangement === "remote" && <span className="font-normal text-slate-400">(optional — remote)</span>}
              </label>
              <input type="text" className={fieldClass} value={state} onChange={(e) => setState(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Company</label>
            {matchedCompany && !overrideCompany ? (
              <div className="flex items-center justify-between gap-3 bg-emerald-500/10 border border-emerald-400/30 rounded-lg px-3 py-2">
                <span className="inline-flex items-center gap-1.5 text-sm text-emerald-200">
                  <Check className="w-4 h-4" />
                  {matchedCompany.name}
                  <span className="text-emerald-400 font-normal">— matched from this job's source</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setOverrideCompany(true);
                    setCompanyId("");
                  }}
                  className="text-xs text-emerald-300 underline underline-offset-2 shrink-0"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <select
                  className={`${fieldClass} mb-2`}
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                >
                  <option value="" className="text-slate-900">— Create new company below —</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id} className="text-slate-900">
                      {c.name}
                    </option>
                  ))}
                </select>
                {!companyId && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="New company name"
                      className={fieldClass}
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                    />
                    <div className="relative">
                      <input
                        type="url"
                        placeholder="Website (auto-suggested from the name above)"
                        className={fieldClass}
                        value={newCompanyWebsite}
                        onChange={(e) => {
                          setNewCompanyWebsite(e.target.value);
                          setWebsiteEdited(true);
                        }}
                      />
                      {suggestingWebsite && (
                        <span className="absolute right-3 top-2.5 text-xs text-slate-400">Looking up…</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      Used to show the employer's real logo across the site — double-check it before approving.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Salary <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <div className="flex gap-3 mb-2">
              {(["year", "hour"] as const).map((p) => (
                <label key={p} className="inline-flex items-center gap-1.5 text-sm text-slate-300">
                  <input type="radio" name={`salaryPeriod-${record.id}`} checked={salaryPeriod === p} onChange={() => setSalaryPeriod(p)} />
                  {p === "year" ? "Yearly salary" : "Hourly rate"}
                </label>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder={salaryPeriod === "hour" ? "Min $/hr" : "Min $/yr"}
                className={fieldClass}
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
              />
              <input
                type="number"
                placeholder={salaryPeriod === "hour" ? "Max $/hr" : "Max $/yr"}
                className={fieldClass}
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
              />
            </div>
            {parsedSalary ? (
              <p className="text-xs text-emerald-300 mt-1.5 inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Detected {parsedSalary.period === "hour" ? "an hourly rate" : "a salary range"} from the job description — please confirm before publishing.
              </p>
            ) : (
              <p className="text-xs text-slate-400 mt-1.5">Not mentioned anywhere in this source.</p>
            )}
          </div>

          <details className="group">
            <summary className="text-sm text-brand-300 cursor-pointer list-none inline-flex items-center gap-1">
              <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
              View raw description
            </summary>
            <div
              className="text-sm mt-2 prose prose-invert max-w-none prose-sm bg-white/[0.03] rounded-lg p-3"
              dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(record.raw_data.content ?? "") }}
            />
          </details>

          <div className="flex gap-2 pt-1">
            <button
              disabled={
                isPending ||
                outcome !== null ||
                (!careerId && !companyId && !newCompanyName) ||
                (creatingCareer && (!newCareerName.trim() || !newCareerCategoryId))
              }
              onClick={handleApprove}
              className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {outcome === "approved" ? "Approved" : isPending ? "Working…" : "Approve & Publish"}
            </button>
            <button
              disabled={isPending || outcome !== null}
              onClick={handleReject}
              className="inline-flex items-center gap-1.5 border border-red-400/30 text-red-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-500/10 disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              {outcome === "rejected" ? "Rejected" : "Reject"}
            </button>
          </div>
        </div>
      )}
          </div>
        </div>
      </div>
    </div>
  );
}
