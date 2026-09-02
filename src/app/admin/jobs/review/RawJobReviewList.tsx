// app/admin/jobs/review/RawJobReviewList.tsx
"use client";

import { useState } from "react";
import { Inbox } from "lucide-react";
import { RawJobCard } from "./RawJobCard";

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
}: {
  initialRecords: RawJobRecord[];
  careers: Career[];
  companies: Company[];
  companyIdBySource: Record<string, string | null>;
}) {
  const [records, setRecords] = useState(initialRecords);

  function handleSettled(id: string) {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center text-center gap-2 border border-dashed rounded-xl py-16 text-slate-500">
        <Inbox className="w-8 h-8 text-slate-300" />
        <p>Nothing waiting for review right now.</p>
      </div>
    );
  }

  return (
    <div>
      {records.map((record) => (
        <RawJobCard
          key={record.id}
          record={record}
          careers={careers}
          companies={companies}
          defaultCompanyId={companyIdBySource[record.source_id] ?? null}
          onSettled={handleSettled}
        />
      ))}
    </div>
  );
}
