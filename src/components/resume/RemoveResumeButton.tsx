"use client";

import { useState, useTransition } from "react";
import { deleteResume } from "@/features/resumes/actions";

// No native confirm() dialog -- browsers can silently suppress repeated
// dialogs from a page ("prevent this page from creating additional
// dialogs"), which is indistinguishable from the button doing nothing.
// A two-click in-page confirm has no such failure mode.
export function RemoveResumeButton({ resumeId }: { resumeId: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function handleClick() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      await deleteResume(resumeId);
    });
  }

  if (confirming) {
    return (
      <span>
        <button onClick={handleClick} disabled={isPending} className="text-red-400 font-medium hover:underline disabled:opacity-50 hover:text-red-300 transition-colors">
          {isPending ? "Removing…" : "Confirm remove?"}
        </button>
        {" · "}
        <button onClick={() => setConfirming(false)} disabled={isPending} className="text-slate-500 hover:underline hover:text-white transition-colors">
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button onClick={handleClick} className="text-red-400 hover:underline hover:text-red-300 transition-colors">
      Remove
    </button>
  );
}
