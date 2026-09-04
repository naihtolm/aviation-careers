"use client";

import { useState, useTransition } from "react";
import { StarRating } from "./StarRating";
import { ReviewForm } from "./ReviewForm";
import { deleteReview } from "@/features/companies/reviewActions";

const EMPLOYMENT_LABEL: Record<string, string> = {
  current_employee: "Current employee",
  former_employee: "Former employee",
  interview_candidate: "Interviewed here",
};

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return "today";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export interface CompanyReview {
  id: string;
  rating: number;
  title: string;
  body: string;
  pros: string | null;
  cons: string | null;
  employment_status: string;
  status: string;
  created_at: string;
  user_id: string;
  profiles?: { display_name: string | null } | null;
}

export function CompanyReviewsTab({
  companyId,
  companySlug,
  reviews,
  ownReview,
  averageRating,
  count,
}: {
  companyId: string;
  companySlug: string;
  reviews: CompanyReview[];
  ownReview: CompanyReview | null;
  averageRating: number | null;
  count: number;
}) {
  const [showForm, setShowForm] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!ownReview) return;
    startTransition(async () => {
      await deleteReview(ownReview.id, companySlug);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          {count > 0 ? (
            <div className="flex items-center gap-2">
              <StarRating rating={averageRating ?? 0} size={18} />
              <span className="text-sm font-medium text-white">{averageRating!.toFixed(1)}</span>
              <span className="text-sm text-slate-400">({count} review{count === 1 ? "" : "s"})</span>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No reviews yet — be the first to share what it's like to work here.</p>
          )}
        </div>

        {!ownReview && !showForm && !justSubmitted && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm font-medium border border-white/15 rounded-md px-3 py-1.5 text-slate-200 hover:border-brand-300 hover:bg-white/5 hover:-translate-y-0.5 transition-all"
          >
            Write a review
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-5">
          <ReviewForm
            companyId={companyId}
            companySlug={companySlug}
            onSubmitted={() => {
              setShowForm(false);
              setJustSubmitted(true);
            }}
          />
        </div>
      )}

      {justSubmitted && (
        <p className="text-sm bg-emerald-500/15 text-emerald-300 rounded-lg px-3 py-2 mb-5">
          Thanks — your review is waiting on a quick check before it goes live.
        </p>
      )}

      {ownReview && !justSubmitted && (
        <div className="border border-brand-400/30 bg-brand-400/10 rounded-lg p-4 mb-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-brand-300 uppercase tracking-wide mb-1">
                Your review — {ownReview.status === "pending" ? "awaiting review" : ownReview.status === "rejected" ? "not approved" : "live"}
              </p>
              <div className="flex items-center gap-2">
                <StarRating rating={ownReview.rating} size={15} />
                <span className="text-sm font-medium text-white">{ownReview.title}</span>
              </div>
            </div>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="text-xs text-slate-400 hover:text-red-400 transition-colors shrink-0"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {reviews.length === 0 ? null : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="border border-white/10 rounded-lg p-4 bg-white/[0.04]">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <StarRating rating={r.rating} size={15} />
                  <span className="font-medium text-white text-sm">{r.title}</span>
                </div>
                <span className="text-xs text-slate-500">{timeAgo(r.created_at)}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{EMPLOYMENT_LABEL[r.employment_status] ?? r.employment_status}</p>
              <p className="text-sm text-slate-300 mt-2 whitespace-pre-wrap">{r.body}</p>
              {(r.pros || r.cons) && (
                <div className="grid sm:grid-cols-2 gap-3 mt-3">
                  {r.pros && (
                    <div className="text-xs">
                      <p className="font-medium text-emerald-300">Pros</p>
                      <p className="text-slate-400 mt-0.5 whitespace-pre-wrap">{r.pros}</p>
                    </div>
                  )}
                  {r.cons && (
                    <div className="text-xs">
                      <p className="font-medium text-red-300">Cons</p>
                      <p className="text-slate-400 mt-0.5 whitespace-pre-wrap">{r.cons}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
