"use client";

import { useState, useTransition } from "react";
import { saveJob, unsaveJob } from "@/features/jobs/actions";
import { trackApplyClick, confirmApplied } from "@/features/applications/actions";

type ModalState = "closed" | "confirming" | "didYouApply";

export function ApplyPanel({
  jobId,
  applicationType,
  applicationUrl,
  companyName,
  initialSaved = false,
}: {
  jobId: string;
  applicationType: string;
  applicationUrl: string | null;
  companyName: string;
  initialSaved?: boolean;
}) {
  const [modal, setModal] = useState<ModalState>("closed");
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(initialSaved);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  function handleConfirmRedirect() {
    startTransition(async () => {
      const { applicationId } = await trackApplyClick(jobId, applicationUrl);
      setApplicationId(applicationId);
      // New tab, not a full-page redirect — this is what makes the
      // post-redirect "did you apply?" prompt possible at all, since
      // our own page stays open instead of navigating away.
      if (applicationUrl) window.open(applicationUrl, "_blank", "noopener,noreferrer");
      setModal(applicationId ? "didYouApply" : "closed");
    });
  }

  function handleConfirmApplied() {
    startTransition(async () => {
      if (applicationId) await confirmApplied(applicationId);
      setModal("closed");
    });
  }

  function handleSave() {
    startTransition(async () => {
      if (saved) {
        const result = await unsaveJob(jobId);
        if (!result.error) setSaved(false);
        return;
      }
      const result = await saveJob(jobId);
      if (result.error === "sign_in_required") {
        setSaveMessage("Sign in to save this job.");
        return;
      }
      if (!result.error) setSaved(true);
    });
  }

  return (
    <div className="border rounded-lg p-4 bg-white space-y-3">
      {applicationType === "external_url" ? (
        <>
          <button
            onClick={() => setModal("confirming")}
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
        className={`w-full py-2.5 rounded-md font-medium disabled:opacity-50 ${
          saved ? "bg-slate-900 text-white" : "border border-slate-300 hover:bg-slate-50"
        }`}
      >
        {saved ? "Saved ✓" : "Save Job"}
      </button>
      {saveMessage && <p className="text-xs text-center text-slate-500">{saveMessage}</p>}

      {modal === "confirming" && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="font-medium text-slate-900">You'll be redirected to {companyName}'s site</h3>
            <p className="text-sm text-slate-500 mt-2">
              We'll track that you clicked apply, but you'll submit your application directly through{" "}
              {companyName}. Sign in first and we can pre-fill your resume and contact info to save you time.
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setModal("closed")}
                className="flex-1 border border-slate-300 py-2 rounded-md text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRedirect}
                disabled={isPending}
                className="flex-1 bg-slate-900 text-white py-2 rounded-md text-sm disabled:opacity-50"
              >
                {isPending ? "Opening…" : "Continue"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "didYouApply" && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="font-medium text-slate-900">Did you apply to this job?</h3>
            <p className="text-sm text-slate-500 mt-2">
              We opened {companyName}'s application page in a new tab. Let us know if you finished applying so we
              can track it for you.
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setModal("closed")}
                className="flex-1 border border-slate-300 py-2 rounded-md text-sm"
              >
                Not yet
              </button>
              <button
                onClick={handleConfirmApplied}
                disabled={isPending}
                className="flex-1 bg-slate-900 text-white py-2 rounded-md text-sm disabled:opacity-50"
              >
                {isPending ? "Saving…" : "Yes, I applied"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
