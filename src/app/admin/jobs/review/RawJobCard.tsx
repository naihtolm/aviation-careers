// app/admin/jobs/review/RawJobCard.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { MapPin, Clock, Building2, ChevronDown, Check, X } from "lucide-react";
import { approveRawJob, rejectRawJob } from "./actions";
import { decodeHtmlEntities } from "@/lib/html";
import { groupCareers, suggestCareerId } from "@/lib/careerMatching";

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

// Roughly matches the site's job-card treatment elsewhere (e.g. the
// companies directory), so this admin screen looks like part of the same
// product instead of a bare internal tool.
function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Greenhouse location strings vary a lot: "Irvine, CA", "Manassas, VA",
// "Manchester, Connecticut, United States", or with a street address
// prefixed on -- "9990 Wakeman Drive, Manassas, VA 20110". A naive
// split(",")[0,1] reads that last one as city="9990 Wakeman Drive",
// state="Manassas". Drop a leading segment that looks like a street
// address, and strip a trailing ZIP off the state segment.
function parseLocation(raw: string): { city: string; state: string } {
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length > 2 && /^\d/.test(parts[0])) parts.shift();
  const city = parts[0] ?? "";
  const state = (parts[1] ?? "").replace(/\s*\d{5}(-\d{4})?$/, "").trim();
  return { city, state };
}

export function RawJobCard({
  record,
  careers,
  companies,
  defaultCompanyId,
}: {
  record: RawJobRecord;
  careers: Career[];
  companies: Company[];
  defaultCompanyId?: string | null;
}) {
  const title = record.raw_data.title ?? "(untitled)";
  const suggestedCareerId = suggestCareerId(title, careers);
  const careerGroups = groupCareers(careers);
  const matchedCompany = defaultCompanyId ? companies.find((c) => c.id === defaultCompanyId) : undefined;
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [careerId, setCareerId] = useState(suggestedCareerId ?? "");
  // Every ingestion source maps to exactly one real employer (migration
  // 028), so defaultCompanyId is reliable — no need to fuzzy-match
  // raw_data.company_name ("Archer") against the company's display name
  // ("Archer Aviation"), which often wouldn't line up anyway.
  const [companyId, setCompanyId] = useState(defaultCompanyId ?? "");
  const [newCompanyName, setNewCompanyName] = useState(defaultCompanyId ? "" : record.raw_data.company_name ?? "");
  const [newCompanyWebsite, setNewCompanyWebsite] = useState("");
  const [websiteEdited, setWebsiteEdited] = useState(false);
  const [suggestingWebsite, setSuggestingWebsite] = useState(false);
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
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

  function handleApprove() {
    startTransition(async () => {
      await approveRawJob({
        rawRecordId: record.id,
        title,
        description: record.raw_data.content ?? "",
        careerId: careerId || null,
        companyId: companyId || null,
        newCompanyName: companyId ? null : newCompanyName || null,
        newCompanyWebsite: companyId ? null : newCompanyWebsite.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        applicationUrl: record.raw_data.absolute_url ?? null,
        salaryMin: salaryMin ? Number(salaryMin) : null,
        salaryMax: salaryMax ? Number(salaryMax) : null,
      });
    });
  }

  function handleReject() {
    const reason = prompt("Reason for rejecting (optional):") ?? "";
    startTransition(async () => {
      await rejectRawJob(record.id, reason);
    });
  }

  const fieldClass =
    "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-colors";

  return (
    <div
      className={`border rounded-xl bg-white shadow-sm transition-all ${
        expanded ? "border-brand-200 shadow-md" : "border-slate-200"
      }`}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-start justify-between gap-4 p-4 text-left"
      >
        <div className="min-w-0">
          <h3 className="font-medium text-slate-900 truncate">{title}</h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {location || "No location provided"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              {matchedCompany?.name ?? record.raw_data.company_name ?? "Unknown company"}
            </span>
            <span className="inline-flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              {timeAgo(record.received_at)}
            </span>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 shrink-0 mt-0.5 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Career role</label>
            <select className={fieldClass} value={careerId} onChange={(e) => setCareerId(e.target.value)}>
              <option value="">— Select career role —</option>
              {careerGroups.map((group) => (
                <optgroup key={group.category} label={group.category}>
                  {group.options.map((career) => (
                    <option key={career.id} value={career.id}>{career.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            {suggestedCareerId && careerId === suggestedCareerId && (
              <p className="text-xs text-emerald-700 mt-1.5 inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Suggested from the job title — please confirm before publishing.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
              <input type="text" className={fieldClass} value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
              <input type="text" className={fieldClass} value={state} onChange={(e) => setState(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
            {matchedCompany && !overrideCompany ? (
              <div className="flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                <span className="inline-flex items-center gap-1.5 text-sm text-emerald-800">
                  <Check className="w-4 h-4" />
                  {matchedCompany.name}
                  <span className="text-emerald-600 font-normal">— matched from this job's source</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setOverrideCompany(true);
                    setCompanyId("");
                  }}
                  className="text-xs text-emerald-700 underline underline-offset-2 shrink-0"
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
                  <option value="">— Create new company below —</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Salary <span className="font-normal text-slate-400">(optional — not provided by this source)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Min"
                className={fieldClass}
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
              />
              <input
                type="number"
                placeholder="Max"
                className={fieldClass}
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
              />
            </div>
          </div>

          <details className="group">
            <summary className="text-sm text-brand-600 cursor-pointer list-none inline-flex items-center gap-1">
              <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
              View raw description
            </summary>
            <div
              className="text-sm mt-2 prose max-w-none prose-sm bg-slate-50 rounded-lg p-3"
              dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(record.raw_data.content ?? "") }}
            />
          </details>

          <div className="flex gap-2 pt-1">
            <button
              disabled={isPending || (!careerId && !companyId && !newCompanyName)}
              onClick={handleApprove}
              className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isPending ? "Working…" : "Approve & Publish"}
            </button>
            <button
              disabled={isPending}
              onClick={handleReject}
              className="inline-flex items-center gap-1.5 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
