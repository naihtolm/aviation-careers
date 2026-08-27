"use client";

import { useTransition } from "react";
import { deleteResume } from "@/features/resumes/actions";

export function RemoveResumeButton({ resumeId }: { resumeId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    if (!window.confirm("Remove this resume? You can upload a new one right after.")) return;
    startTransition(async () => {
      await deleteResume(resumeId);
    });
  }

  return (
    <button onClick={handleRemove} disabled={isPending} className="text-red-600 hover:underline disabled:opacity-50">
      {isPending ? "Removing…" : "Remove"}
    </button>
  );
}
