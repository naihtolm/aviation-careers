"use client";

import { useState, useTransition } from "react";
import { logApplyClick, saveJob } from "@/features/jobs/actions";

export function ApplyPanel({
  jobId,
  applicationType,
  applicationUrl,
  companyName,
}: {
  jobId: string;
  applicationType: string;
  applicationUrl: string | null;
  companyName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  function handleApplyClick() {
    setConfirming(true);
  }

  function handleConfirmRedirect() {
    startTransition(async () => {
      await logApplyClick(jobId);
      if (applicationUrl) window.location.href = applicationUrl;
    });
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveJob(jobId);
      setSaveMessage(result.error === "sign_in_required" ? "Sign in to save this job." : "Saved!");
    });
  }

  return (
    <div className="border rounded-lg p-4 bg-white space-y-3">
      {applicationType === "external_url" ? (
        <>
          <button
            onClick={handleApplyClick}
            className="w-full bg-slate-900 text-white py-2.5 rounded-md font-medium hover:bg-slate-700"
          >
            Apply Now
          </button>
          <p className="text-xs text-slate-400 text-center">You'll be redirected to {companyName}'s site.</p>
        </>
      ) : (
        // Native apply for self-posted employer jobs is a Sprint 6 build —
        // this branch just needs to exist now so Sprint 6 isn't retrofitting
        // this page, per the Sprint 2 plan.
        <div className="text-sm text-slate-500 text-center py-2">
          Native application coming soon for this job.
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={isPending}
        className="w-full border border-slate-300 py-2.5 rounded-md font-medium hover:bg-slate-50 disabled:opacity-50"
      >
        Save Job
      </button>
      {saveMessage && <p className="text-xs text-center text-slate-500">{saveMessage}</p>}

      {confirming && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="font-medium text-slate-900">You'll be redirected to {companyName}'s site</h3>
            <p className="text-sm text-slate-500 mt-2">
              We'll track that you clicked apply, but you'll submit your application directly through{" "}
              {companyName}. Sign in first and we can pre-fill your resume and contact info to save you time.
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 border border-slate-300 py-2 rounded-md text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRedirect}
                disabled={isPending}
                className="flex-1 bg-slate-900 text-white py-2 rounded-md text-sm disabled:opacity-50"
              >
                {isPending ? "Redirecting…" : "Continue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
