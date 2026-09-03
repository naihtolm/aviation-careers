"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { saveJob, unsaveJob } from "@/features/jobs/actions";
import { trackApplyClick, confirmApplied, submitNativeApplication } from "@/features/applications/actions";

type ModalState = "closed" | "confirming" | "didYouApply" | "nativeApply" | "appliedConfirmation";

interface ScreeningQuestion {
  id: string;
  type: "yes_no" | "short_text" | "multiple_choice";
  label: string;
  options?: string[];
}

export function ApplyPanel({
  jobId,
  applicationType,
  applicationUrl,
  companyName,
  initialSaved = false,
  screeningQuestions = [],
  alreadyApplied = false,
}: {
  jobId: string;
  applicationType: string;
  applicationUrl: string | null;
  companyName: string;
  initialSaved?: boolean;
  screeningQuestions?: ScreeningQuestion[];
  alreadyApplied?: boolean;
}) {
  const [modal, setModal] = useState<ModalState>("closed");
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(initialSaved);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [nativeApplyError, setNativeApplyError] = useState<string | null>(null);
  const [applied, setApplied] = useState(alreadyApplied);

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

  function handleNativeApplySubmit() {
    setNativeApplyError(null);
    startTransition(async () => {
      const result = await submitNativeApplication(jobId, answers);
      if (result.error === "sign_in_required") {
        setNativeApplyError("Sign in to apply.");
        return;
      }
      if (result.error === "resume_required") {
        setNativeApplyError("resume_required");
        return;
      }
      if (result.error === "already_applied") {
        setApplied(true);
        setModal("closed");
        return;
      }
      if (result.error) {
        setNativeApplyError(result.error);
        return;
      }
      setApplied(true);
      setModal("appliedConfirmation");
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

  // One step's inner content -- title, body, controls -- for whichever
  // `modal` state is current. Deliberately NOT the backdrop/box itself:
  // those mount once for the whole flow (see modalContent below) so
  // moving between steps (e.g. confirming -> didYouApply) cross-fades the
  // content in place instead of the modal visibly closing and reopening
  // four separate times.
  function renderStepContent() {
    switch (modal) {
      case "confirming":
        return (
          <>
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
                className="flex-1 bg-accent-200 text-board hover:bg-accent-100 transition-colors py-2 rounded-md text-sm disabled:opacity-50"
              >
                {isPending ? "Opening…" : "Continue"}
              </button>
            </div>
          </>
        );

      case "didYouApply":
        return (
          <>
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
                className="flex-1 bg-accent-200 text-board hover:bg-accent-100 transition-colors py-2 rounded-md text-sm disabled:opacity-50"
              >
                {isPending ? "Saving…" : "Yes, I applied"}
              </button>
            </div>
          </>
        );

      case "nativeApply":
        return (
          <>
            <h3 className="font-medium text-slate-900">Apply to {companyName}</h3>
            <p className="text-sm text-slate-500 mt-2">
              Your saved resume and profile will be sent with this application.
            </p>

            {nativeApplyError === "resume_required" ? (
              <div className="mt-4">
                <p className="text-sm text-amber-700 bg-amber-50 rounded-md p-3">
                  You need a resume on file before applying. Upload one, then come back.
                </p>
                <Link
                  href="/dashboard/resume"
                  className="block text-center mt-3 bg-accent-200 text-board hover:bg-accent-100 transition-colors py-2 rounded-md text-sm"
                >
                  Upload resume
                </Link>
                <button
                  onClick={() => setModal("closed")}
                  className="w-full border border-slate-300 py-2 rounded-md text-sm mt-2"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                {screeningQuestions.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {screeningQuestions.map((q) => (
                      <div key={q.id}>
                        <label className="block text-sm text-slate-700 mb-1">{q.label}</label>
                        {q.type === "yes_no" ? (
                          <select
                            value={answers[q.label] ?? ""}
                            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.label]: e.target.value }))}
                            className="w-full border rounded-md px-2 py-1.5 text-sm"
                          >
                            <option value="">Select…</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        ) : q.type === "multiple_choice" ? (
                          <select
                            value={answers[q.label] ?? ""}
                            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.label]: e.target.value }))}
                            className="w-full border rounded-md px-2 py-1.5 text-sm"
                          >
                            <option value="">Select…</option>
                            {(q.options ?? []).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            value={answers[q.label] ?? ""}
                            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.label]: e.target.value }))}
                            className="w-full border rounded-md px-2 py-1.5 text-sm"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {nativeApplyError && nativeApplyError !== "resume_required" && (
                  <p className="text-sm text-red-600 mt-3">{nativeApplyError}</p>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setModal("closed")}
                    className="flex-1 border border-slate-300 py-2 rounded-md text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNativeApplySubmit}
                    disabled={isPending}
                    className="flex-1 bg-accent-200 text-board hover:bg-accent-100 transition-colors py-2 rounded-md text-sm disabled:opacity-50"
                  >
                    {isPending ? "Submitting…" : "Submit Application"}
                  </button>
                </div>
              </>
            )}
          </>
        );

      case "appliedConfirmation":
        return (
          <div className="text-center">
            <h3 className="font-medium text-slate-900">Application submitted</h3>
            <p className="text-sm text-slate-500 mt-2">
              {companyName} will review your application. You can track its status from your dashboard.
            </p>
            <button
              onClick={() => setModal("closed")}
              className="w-full bg-accent-200 text-board hover:bg-accent-100 transition-colors py-2 rounded-md text-sm mt-4"
            >
              Done
            </button>
          </div>
        );

      default:
        return null;
    }
  }

  // Built up-front, then portalled straight to document.body below rather
  // than rendered inline. This panel lives inside a `position: sticky`
  // sidebar (see app/jobs/[slug]/page.tsx) -- a `fixed` modal nested that
  // deep is a well-known cross-browser stacking-context footgun (sticky
  // ancestors don't reliably keep fixed descendants painting above
  // unrelated siblings in every browser, which is exactly what caused the
  // "Similar jobs" cards to render on top of this modal). Portalling to
  // body sidesteps the whole class of bug instead of chasing it
  // ancestor-by-ancestor.
  //
  // The backdrop and box below mount exactly once per open (the whole
  // `modal !== "closed"` block), so they only ever play their entrance
  // animation on open, not on every step change -- .animate-modal-content
  // is keyed on `modal` so just the content fades in fresh each step,
  // which is what makes this read as one continuous flow instead of four
  // popups closing and reopening.
  const modalContent = (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 animate-modal-backdrop">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full max-h-[85vh] overflow-y-auto animate-modal-box">
        <div key={modal} className="animate-modal-content">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );

  return (
    <div className="border rounded-lg p-4 bg-white space-y-3">
      {applicationType === "external_url" ? (
        <>
          <button
            onClick={() => setModal("confirming")}
            className="w-full bg-accent-200 text-board py-2.5 rounded-md font-medium hover:bg-accent-100 transition-colors"
          >
            Apply Now
          </button>
          <p className="text-xs text-slate-400 text-center">You'll be redirected to {companyName}'s site.</p>
        </>
      ) : applied ? (
        <div className="text-sm text-emerald-700 bg-emerald-50 rounded-md text-center py-2.5 font-medium">
          Applied ✓
        </div>
      ) : (
        <button
          onClick={() => setModal("nativeApply")}
          className="w-full bg-accent-200 text-board py-2.5 rounded-md font-medium hover:bg-accent-100 transition-colors"
        >
          Apply Now
        </button>
      )}

      <button
        onClick={handleSave}
        disabled={isPending}
        className={`w-full py-2.5 rounded-md font-medium disabled:opacity-50 ${
          saved ? "bg-accent-200 text-board hover:bg-accent-100 transition-colors" : "border border-slate-300 hover:bg-slate-50"
        }`}
      >
        {saved ? "Saved ✓" : "Save Job"}
      </button>
      {saveMessage && <p className="text-xs text-center text-slate-500">{saveMessage}</p>}

      {modal !== "closed" && typeof document !== "undefined" && createPortal(modalContent, document.body)}
    </div>
  );
}
