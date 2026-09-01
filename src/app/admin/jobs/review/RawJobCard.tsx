// app/admin/jobs/review/RawJobCard.tsx
"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
  };
  received_at: string;
  source_id: string;
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
}: {
  record: RawJobRecord;
  careers: Career[];
  companies: Company[];
}) {
  const title = record.raw_data.title ?? "(untitled)";
  const suggestedCareerId = suggestCareerId(title, careers);
  const careerGroups = groupCareers(careers);
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [careerId, setCareerId] = useState(suggestedCareerId ?? "");
  const [companyId, setCompanyId] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyWebsite, setNewCompanyWebsite] = useState("");
  const [websiteEdited, setWebsiteEdited] = useState(false);
  const [suggestingWebsite, setSuggestingWebsite] = useState(false);
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");

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

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-gray-500">{location || "No location provided"}</p>
          <p className="text-xs text-gray-400">
            Received {new Date(record.received_at).toLocaleString()}
          </p>
        </div>
        <button
          className="text-sm text-brand-600"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? "Hide details" : "Review"}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t pt-4">
          <div>
            <label className="block text-sm font-medium mb-1">Career role</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={careerId}
              onChange={(e) => setCareerId(e.target.value)}
            >
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
              <p className="text-xs text-emerald-700 mt-1">Suggested from the job title — please confirm before publishing.</p>
            )}
          </div>

          <div className="flex gap-2">
            <div className="w-full">
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                type="text"
                className="w-full border rounded px-2 py-1"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="w-full">
              <label className="block text-sm font-medium mb-1">State</label>
              <input
                type="text"
                className="w-full border rounded px-2 py-1"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Company</label>
            <select
              className="w-full border rounded px-2 py-1 mb-2"
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
                  className="w-full border rounded px-2 py-1"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                />
                <div className="relative">
                  <input
                    type="url"
                    placeholder="Website (auto-suggested from the name above)"
                    className="w-full border rounded px-2 py-1"
                    value={newCompanyWebsite}
                    onChange={(e) => {
                      setNewCompanyWebsite(e.target.value);
                      setWebsiteEdited(true);
                    }}
                  />
                  {suggestingWebsite && (
                    <span className="absolute right-2 top-1.5 text-xs text-gray-400">Looking up…</span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  Used to show the employer's real logo across the site — double-check it before approving.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Salary min"
              className="w-full border rounded px-2 py-1"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
            />
            <input
              type="number"
              placeholder="Salary max"
              className="w-full border rounded px-2 py-1"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
            />
          </div>

          <details>
            <summary className="text-sm text-gray-500 cursor-pointer">
              View raw description
            </summary>
            <div
              className="text-sm mt-2 prose max-w-none"
              dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(record.raw_data.content ?? "") }}
            />
          </details>

          <div className="flex gap-2 pt-2">
            <button
              disabled={isPending || (!careerId && !companyId && !newCompanyName)}
              onClick={handleApprove}
              className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {isPending ? "Working…" : "Approve & Publish"}
            </button>
            <button
              disabled={isPending}
              onClick={handleReject}
              className="border border-red-600 text-red-600 px-4 py-2 rounded disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
