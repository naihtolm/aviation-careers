import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/features/profile/queries";
import { getLatestResume, getLatestParse } from "@/features/resumes/queries";
import { ReviewForm } from "@/components/resume/ReviewForm";

export default async function ResumeReviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const latest = await getLatestResume(user.id);
  if (!latest || latest.resume.upload_status !== "processed") redirect("/dashboard/resume");

  const parse = await getLatestParse(latest.resume.id);
  if (!parse) redirect("/dashboard/resume");

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <p className="text-sm text-slate-500">
        <Link href="/dashboard/resume" className="hover:underline hover:text-slate-900 transition-colors">
          Resume
        </Link>
      </p>
      <h1 className="text-2xl font-semibold text-slate-900 mt-1">Review what we found</h1>
      <p className="text-sm text-slate-500 mt-1 mb-6">
        Uncheck anything that's wrong or not relevant, edit any field, then save. Your original resume file is never
        changed — this only affects what shows up on your profile.
      </p>

      <ReviewForm data={parse.structured_data} />
    </div>
  );
}
