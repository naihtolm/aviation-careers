"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateApplicationStatus, updateApplicationNotes } from "@/features/applications/actions";
import { STATUSES } from "@/features/applications/constants";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { titleCase } from "@/lib/text";

export function ApplicationCard({ application }: { application: any }) {
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState(application.notes ?? "");
  const [savedNotes, setSavedNotes] = useState(application.notes ?? "");

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    startTransition(() => updateApplicationStatus(application.id, e.target.value));
  }

  function handleNotesBlur() {
    if (notes === savedNotes) return;
    startTransition(async () => {
      await updateApplicationNotes(application.id, notes);
      setSavedNotes(notes);
    });
  }

  return (
    <div className="border border-white/10 rounded-lg p-3 bg-white/[0.04] hover:bg-white/[0.07] transition-all">
      <div className="flex items-start gap-2">
        <CompanyLogo name={application.jobs?.companies?.name ?? "?"} website={application.jobs?.companies?.website} size={28} />
        <div className="min-w-0">
          <Link href={`/jobs/${application.jobs?.slug}`} className="font-medium text-sm text-white hover:underline hover:text-brand-300 transition-colors">
            {application.jobs?.title}
          </Link>
          <p className="text-xs text-slate-400">{application.jobs?.companies?.name}</p>
        </div>
      </div>

      <select
        value={application.status}
        onChange={handleStatusChange}
        disabled={isPending}
        className="w-full bg-white/5 border border-white/15 rounded px-2 py-1 text-xs mt-2 text-white"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s} className="text-slate-900">
            {titleCase(s)}
          </option>
        ))}
      </select>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={handleNotesBlur}
        placeholder="Notes…"
        rows={2}
        className="w-full bg-white/5 border border-white/15 rounded px-2 py-1 text-xs mt-2 text-white placeholder:text-slate-500"
      />
    </div>
  );
}
