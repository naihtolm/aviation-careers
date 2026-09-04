"use client";

import { useState, useTransition } from "react";
import { reviewEmployerVerification } from "@/features/employers/admin-actions";
import { companyTypeLabel } from "@/lib/companyType";

export function EmployerVerificationCard({ verification }: { verification: any }) {
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState("");
  const company = verification.companies;

  function handleDecision(decision: "approved" | "rejected" | "needs_information") {
    startTransition(() => reviewEmployerVerification(verification.id, company.id, decision, notes));
  }

  return (
    <div className="border border-white/10 rounded-lg p-4 bg-white/[0.04]">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-white">{company?.name}</h3>
          <p className="text-sm text-slate-400">{companyTypeLabel(company?.company_type)}</p>
          {company?.website && (
            <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-300 hover:underline hover:text-brand-200 transition-colors">
              {company.website}
            </a>
          )}
        </div>
        <p className="text-xs text-slate-500">{new Date(verification.submitted_at).toLocaleDateString()}</p>
      </div>

      {verification.verification_method && (
        <p className="text-sm text-slate-300 mt-2">Verification note: {verification.verification_method}</p>
      )}

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Review notes (optional)"
        rows={2}
        className="w-full bg-white/5 border border-white/15 rounded-md px-2 py-1.5 text-sm text-white placeholder:text-slate-500 mt-3"
      />

      <div className="flex gap-2 mt-2">
        <button
          onClick={() => handleDecision("approved")}
          disabled={isPending}
          className="bg-emerald-600 text-white px-3 py-1.5 rounded-md text-sm disabled:opacity-50"
        >
          Approve
        </button>
        <button
          onClick={() => handleDecision("needs_information")}
          disabled={isPending}
          className="border border-amber-400/40 text-amber-300 px-3 py-1.5 rounded-md text-sm disabled:opacity-50 hover:bg-amber-500/10 transition-colors"
        >
          Needs Info
        </button>
        <button
          onClick={() => handleDecision("rejected")}
          disabled={isPending}
          className="border border-red-400/40 text-red-300 px-3 py-1.5 rounded-md text-sm disabled:opacity-50 hover:bg-red-500/10 transition-colors"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
