// app/admin/jobs/review/RawJobCard.tsx
"use client";

import { useState, useTransition } from "react";
import { approveRawJob, rejectRawJob } from "./actions";
import { decodeHtmlEntities } from "@/lib/html";

interface Career {
  id: string;
  name: string;
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

export function RawJobCard({
  record,
  careers,
  companies,
}: {
  record: RawJobRecord;
  careers: Career[];
  companies: Company[];
}) {
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [careerId, setCareerId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");

  const title = record.raw_data.title ?? "(untitled)";
  const location = record.raw_data.location?.name ?? "";

  function handleApprove() {
    startTransition(async () => {
      const [city, state] = location.split(",").map((s) => s.trim());
      await approveRawJob({
        rawRecordId: record.id,
        title,
        description: record.raw_data.content ?? "",
        careerId: careerId || null,
        companyId: companyId || null,
        newCompanyName: companyId ? null : newCompanyName || null,
        city: city || null,
        state: state || null,
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
          className="text-sm text-blue-600"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? "Hide details" : "Review"}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t pt-4">
          <div>
            <label className="block text-sm font-medium mb-1">Career category</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={careerId}
              onChange={(e) => setCareerId(e.target.value)}
            >
              <option value="">— Select career —</option>
              {careers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
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
              <input
                type="text"
                placeholder="New company name"
                className="w-full border rounded px-2 py-1"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
              />
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
