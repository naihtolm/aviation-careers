// app/admin/jobs/review/RawJobReviewList.tsx
"use client";

import { useState, useTransition } from "react";
import { Inbox, Sparkles } from "lucide-react";
import { RawJobCard } from "./RawJobCard";
import { runAutoApproveNow } from "./actions";

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

// Holds its own copy of the queue so an approved/rejected card can play its
// exit animation and be removed locally, instead of waiting on the
// server-refreshed page to swap the whole list at once (which is what
// produced the old "card just vanishes" behavior). Deliberately never
// re-syncs from the `initialRecords` prop after mount -- the admin works
// through whatever batch loaded, and the pending-count badge above (a
// separate, plain server value) is what stays live-accurate as approvals
// land, without reshuffling the list mid-review.
export function RawJobReviewList({
  initialRecords,
  careers,
  companies,
  companyIdBySource,
  careerCategories,
}: {
  initialRecords: RawJobRecord[];
  careers: Career[];
  companies: Company[];
  companyIdBySource: Record<string, string | null>;
  careerCategories: CareerCategory[];
}) {
  const [records, setRecords] = useState(initialRecords);
  // Local copy, not just the prop -- when a card creates a brand-new career
  // role (no existing one fit), every other card still in this batch
  // should see it in their own dropdown immediately, instead of each one
  // independently creating a duplicate for the same role.
  const [careerOptions, setCareerOptions] = useState(careers);
  const [isPending, startTransition] = useTransition();
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  function handleSettled(id: string) {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }

  function handleCareerCreated(career: Career) {
    setCareerOptions((prev) => [...prev, career]);
  }

  function handleAutoApprove() {
    setResultMessage(null);
    startTransition(async () => {
      const result = await runAutoApproveNow();
      setRecords((prev) => prev.filter((r) => !result.rawRecordIds.includes(r.id)));
      if (result.createdCareers.length > 0) {
        setCareerOptions((prev) => [...prev, ...result.createdCareers]);
      }
      const careerNote =
        result.createdCareers.length > 0
          ? ` Added ${result.createdCareers.length} new career role${result.createdCareers.length === 1 ? "" : "s"} along the way: ${result.createdCareers.map((c) => c.name).join(", ")}.`
          : "";
      setResultMessage(
        (result.approved > 0
          ? `Auto-published ${result.approved} of ${result.evaluated} pending jobs — the rest still need a look.`
          : `None of the ${result.evaluated} pending jobs cleared the auto-publish bar — nothing changed.`) + careerNote
      );
    });
  }

  const autoApproveButton = (
    <div className="mb-4">
      <button
        onClick={handleAutoApprove}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 border border-accent-200 bg-accent-200 text-board px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-accent-100 disabled:opacity-50"
      >
        <Sparkles className="w-3.5 h-3.5" />
        {isPending ? "Checking the backlog…" : "Auto-publish qualifying jobs now"}
      </button>
      {resultMessage && <p className="text-sm text-slate-400 mt-1.5">{resultMessage}</p>}
    </div>
  );

  if (records.length === 0) {
    return (
      <div>
        {autoApproveButton}
        <div className="flex flex-col items-center text-center gap-2 border border-dashed border-white/15 rounded-xl py-16 text-slate-400">
          <Inbox className="w-8 h-8 text-slate-500" />
          <p>Nothing waiting for review right now.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {autoApproveButton}
      {records.map((record) => (
        <RawJobCard
          key={record.id}
          record={record}
          careers={careerOptions}
          careerCategories={careerCategories}
          companies={companies}
          defaultCompanyId={companyIdBySource[record.source_id] ?? null}
          onSettled={handleSettled}
          onCareerCreated={handleCareerCreated}
        />
      ))}
    </div>
  );
}
