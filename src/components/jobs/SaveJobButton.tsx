"use client";

import { useState, useTransition } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { saveJob, unsaveJob } from "@/features/jobs/actions";

export function SaveJobButton({ jobId, initialSaved = false }: { jobId: string; initialSaved?: boolean }) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  // Bumped on every successful toggle and used as the icon's `key` --
  // remounting it is what replays .animate-pop each click, instead of the
  // animation only ever playing once. The click needs to read as landed
  // every time, not just the first time.
  const [popKey, setPopKey] = useState(0);

  function handleClick(e: React.MouseEvent) {
    // JobCard wraps this in a <Link> for the card-click-through; stop the
    // click from also triggering navigation.
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      if (saved) {
        const result = await unsaveJob(jobId);
        if (!result.error) {
          setSaved(false);
          setPopKey((k) => k + 1);
        }
        return;
      }
      const result = await saveJob(jobId);
      if (result.error === "sign_in_required") {
        setMessage("Sign in to save jobs.");
        return;
      }
      if (!result.error) {
        setSaved(true);
        setPopKey((k) => k + 1);
      }
    });
  }

  return (
    <span className="relative inline-block shrink-0">
      <button
        onClick={handleClick}
        disabled={isPending}
        title={saved ? "Remove from saved jobs" : "Save job"}
        aria-label={saved ? "Remove from saved jobs" : "Save job"}
        className={`w-8 h-8 flex items-center justify-center rounded-md border disabled:opacity-50 ${
          saved
            ? "bg-accent-200/15 border-accent-200/40 text-accent-200"
            : "border-white/15 text-slate-400 hover:border-white/25 hover:text-slate-300"
        }`}
      >
        {saved ? (
          <BookmarkCheck key={popKey} className={`w-4 h-4 ${popKey > 0 ? "animate-pop" : ""}`} />
        ) : (
          <Bookmark key={popKey} className={`w-4 h-4 ${popKey > 0 ? "animate-pop" : ""}`} />
        )}
      </button>
      {message && (
        <span className="absolute top-full right-0 mt-1 text-xs text-red-600 bg-white border rounded px-2 py-1 whitespace-nowrap z-10">
          {message}
        </span>
      )}
    </span>
  );
}
