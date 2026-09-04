// app/admin/reviews/page.tsx
import { getServiceClient } from "@/lib/supabase/service";
import { ReviewModerationList } from "./ReviewModerationList";

export default async function ReviewModerationPage() {
  // Admin auth is checked once in app/admin/layout.tsx (requireAdmin()).
  //
  // company_reviews has no client-facing RLS policy that exposes other
  // people's pending rows (company_reviews_public_read_approved only
  // covers approved, company_reviews_owner_read_own only covers the
  // author's own) -- same reasoning as raw_job_records, so this read
  // goes through the service client.
  const db = getServiceClient();

  const { data: reviews, error, count } = await db
    .from("company_reviews")
    .select("id, rating, title, body, pros, cons, employment_status, created_at, companies ( name ), profiles ( display_name )", { count: "exact" })
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    return <p className="text-red-600">Failed to load reviews: {error.message}</p>;
  }

  const pendingCount = count ?? reviews?.length ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-slate-900">Employer Review Moderation</h2>
          <p className="text-sm text-slate-500 mt-1">Check each review before it goes live on the employer's page.</p>
        </div>
        <div className="shrink-0 text-center bg-brand-50 border border-brand-100 rounded-xl px-5 py-2.5">
          <p className="text-2xl font-display font-semibold text-brand-700 leading-none">{pendingCount}</p>
          <p className="text-xs text-brand-600 mt-1">pending</p>
        </div>
      </div>

      <ReviewModerationList
        initialReviews={(reviews ?? []).map((r: any) => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          body: r.body,
          pros: r.pros,
          cons: r.cons,
          employment_status: r.employment_status,
          created_at: r.created_at,
          companyName: r.companies?.name ?? "Unknown company",
          reviewerName: r.profiles?.display_name ?? "Anonymous",
        }))}
      />
    </div>
  );
}
