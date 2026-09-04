"use client";

import { useState, useTransition } from "react";
import { StarRating } from "./StarRating";
import { submitReview } from "@/features/companies/reviewActions";

const EMPLOYMENT_OPTIONS: { value: "current_employee" | "former_employee" | "interview_candidate"; label: string }[] = [
  { value: "current_employee", label: "Current employee" },
  { value: "former_employee", label: "Former employee" },
  { value: "interview_candidate", label: "Interviewed here" },
];

export function ReviewForm({
  companyId,
  companySlug,
  onSubmitted,
}: {
  companyId: string;
  companySlug: string;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState<(typeof EMPLOYMENT_OPTIONS)[number]["value"]>("current_employee");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Pick a star rating.");
      return;
    }
    startTransition(async () => {
      const result = await submitReview({ companyId, companySlug, rating, title, body, pros, cons, employmentStatus });
      if (result.error === "sign_in_required") {
        setError("Sign in to write a review.");
        return;
      }
      if (result.error) {
        setError(result.error);
        return;
      }
      onSubmitted();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="border border-white/10 rounded-lg p-4 bg-white/[0.04] space-y-3">
      <div>
        <label className="text-xs text-slate-400 block mb-1">Your rating</label>
        <StarRating rating={rating} size={22} interactive onChange={setRating} />
      </div>

      <label className="text-xs text-slate-400 block">
        You are a
        <select
          value={employmentStatus}
          onChange={(e) => setEmploymentStatus(e.target.value as typeof employmentStatus)}
          className="w-full bg-white/5 border border-white/15 rounded px-2 py-1.5 mt-1 text-sm text-white"
        >
          {EMPLOYMENT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="text-slate-900">{o.label}</option>
          ))}
        </select>
      </label>

      <label className="text-xs text-slate-400 block">
        Review title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          className="w-full bg-white/5 border border-white/15 rounded px-2 py-1.5 mt-1 text-sm text-white placeholder:text-slate-500"
          placeholder="Sum up your experience"
        />
      </label>

      <label className="text-xs text-slate-400 block">
        Review
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={4000}
          className="w-full bg-white/5 border border-white/15 rounded px-2 py-1.5 mt-1 text-sm text-white placeholder:text-slate-500"
          placeholder="What was it like working here?"
        />
      </label>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-xs text-slate-400 block">
          Pros (optional)
          <textarea value={pros} onChange={(e) => setPros(e.target.value)} rows={2} maxLength={1000} className="w-full bg-white/5 border border-white/15 rounded px-2 py-1.5 mt-1 text-sm text-white" />
        </label>
        <label className="text-xs text-slate-400 block">
          Cons (optional)
          <textarea value={cons} onChange={(e) => setCons(e.target.value)} rows={2} maxLength={1000} className="w-full bg-white/5 border border-white/15 rounded px-2 py-1.5 mt-1 text-sm text-white" />
        </label>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-slate-500">Reviews are checked before they go live.</p>
        <button
          type="submit"
          disabled={isPending}
          className="text-sm font-medium bg-accent-200 text-board px-4 py-1.5 rounded-md hover:bg-accent-100 transition-colors disabled:opacity-50"
        >
          {isPending ? "Submitting…" : "Submit review"}
        </button>
      </div>
    </form>
  );
}
