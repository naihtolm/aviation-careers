// app/admin/reviews/ReviewModerationList.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { Inbox, Check, X } from "lucide-react";
import { StarRating } from "@/components/companies/StarRating";
import { approveReview, rejectReview } from "./actions";

const EMPLOYMENT_LABEL: Record<string, string> = {
  current_employee: "Current employee",
  former_employee: "Former employee",
  interview_candidate: "Interviewed here",
};

export interface PendingReview {
  id: string;
  rating: number;
  title: string;
  body: string;
  pros: string | null;
  cons: string | null;
  employment_status: string;
  created_at: string;
  companyName: string;
  reviewerName: string;
}

// Same shape as RawJobReviewList/RawJobCard's own local-list-with-exit-
// animation pattern -- an approved/rejected item flashes its outcome
// color, then collapses out, instead of the list just reshuffling.
function ReviewCard({ review, onSettled }: { review: PendingReview; onSettled: (id: string) => void }) {
  const [isPending, startTransition] = useTransition();
  const [outcome, setOutcome] = useState<"approved" | "rejected" | null>(null);
  const [collapsing, setCollapsing] = useState(false);
  const [reason, setReason] = useState("");
  const [showRejectReason, setShowRejectReason] = useState(false);

  useEffect(() => {
    if (!collapsing) return;
    const timer = setTimeout(() => onSettled(review.id), 260);
    return () => clearTimeout(timer);
  }, [collapsing, onSettled, review.id]);

  function handleApprove() {
    startTransition(async () => {
      await approveReview(review.id);
      setOutcome("approved");
      setTimeout(() => setCollapsing(true), 500);
    });
  }

  function handleReject() {
    if (!showRejectReason) {
      setShowRejectReason(true);
      return;
    }
    startTransition(async () => {
      await rejectReview(review.id, reason.trim() || "No reason given");
      setOutcome("rejected");
      setTimeout(() => setCollapsing(true), 500);
    });
  }

  return (
    <div
      className={`border rounded-lg p-4 mb-3 transition-all duration-300 ${
        collapsing ? "opacity-0 -translate-x-2 max-h-0 !p-0 !mb-0 overflow-hidden border-none" : "max-h-[600px]"
      } ${outcome === "approved" ? "bg-emerald-50 border-emerald-200" : outcome === "rejected" ? "bg-red-50 border-red-200" : "bg-white"}`}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs text-slate-500">{review.companyName} · {review.reviewerName} · {EMPLOYMENT_LABEL[review.employment_status] ?? review.employment_status}</p>
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={review.rating} size={15} />
            <span className="font-medium text-slate-900 text-sm">{review.title}</span>
          </div>
        </div>
        {!outcome && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleApprove}
              disabled={isPending}
              className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-600 text-white px-2.5 py-1.5 rounded-md hover:bg-emerald-700 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" /> Approve
            </button>
            <button
              onClick={handleReject}
              disabled={isPending}
              className="inline-flex items-center gap-1 text-xs font-medium border border-red-200 text-red-700 px-2.5 py-1.5 rounded-md hover:bg-red-50 disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        )}
      </div>

      <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{review.body}</p>
      {(review.pros || review.cons) && (
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          {review.pros && (
            <div className="text-xs"><p className="font-medium text-emerald-700">Pros</p><p className="text-slate-600 mt-0.5 whitespace-pre-wrap">{review.pros}</p></div>
          )}
          {review.cons && (
            <div className="text-xs"><p className="font-medium text-red-700">Cons</p><p className="text-slate-600 mt-0.5 whitespace-pre-wrap">{review.cons}</p></div>
          )}
        </div>
      )}

      {showRejectReason && !outcome && (
        <div className="flex items-center gap-2 mt-3 border-t pt-3">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (shown in the audit log, not to the reviewer)"
            className="flex-1 border rounded px-2 py-1.5 text-sm text-slate-900"
          />
          <button onClick={handleReject} disabled={isPending} className="text-xs font-medium bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 disabled:opacity-50">
            Confirm reject
          </button>
        </div>
      )}
    </div>
  );
}

export function ReviewModerationList({ initialReviews }: { initialReviews: PendingReview[] }) {
  const [reviews, setReviews] = useState(initialReviews);

  function handleSettled(id: string) {
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center text-center gap-2 border border-dashed rounded-xl py-16 text-slate-500">
        <Inbox className="w-8 h-8 text-slate-300" />
        <p>No reviews waiting for moderation.</p>
      </div>
    );
  }

  return (
    <div>
      {reviews.map((r) => (
        <ReviewCard key={r.id} review={r} onSettled={handleSettled} />
      ))}
    </div>
  );
}
