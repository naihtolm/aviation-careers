import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/features/profile/queries";
import { getLatestResume, getResumeDownloadUrl } from "@/features/resumes/queries";
import { UploadForm } from "@/components/resume/UploadForm";
import { RemoveResumeButton } from "@/components/resume/RemoveResumeButton";

// Vercel Hobby caps at 60s even if a higher value is requested — text
// extraction + one Claude call for a resume-length document comfortably
// fits inside that. Applies to the uploadResume Server Action invoked
// from this page.
export const maxDuration = 60;

export default async function ResumePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const latest = await getLatestResume(user.id);
  const downloadUrl = latest ? await getResumeDownloadUrl(latest.resume.storage_path) : null;

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm text-slate-400 hover:underline hover:text-white transition-colors">
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-semibold text-white mt-1">Resume</h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload your resume and we'll pull out your experience, education, skills, and certifications for you to
          review before anything is added to your profile. Manual entry always works too if you'd rather skip this.
        </p>
      </div>

      {latest && (
        <div className="border border-white/10 rounded-lg p-4 bg-white/[0.04]">
          <p className="font-medium text-white">{latest.resume.file_name}</p>
          <p className="text-sm text-slate-400 mt-1">
            Uploaded {new Date(latest.resume.created_at).toLocaleDateString()}
            {downloadUrl && (
              <>
                {" · "}
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="text-brand-300 hover:underline hover:text-brand-200 transition-colors">
                  View file
                </a>
              </>
            )}
            {" · "}
            <RemoveResumeButton resumeId={latest.resume.id} />
          </p>

          {latest.resume.upload_status === "processing" && (
            <p className="text-sm text-slate-400 mt-3">Processing — this usually takes under a minute.</p>
          )}

          {latest.resume.upload_status === "processed" && (
            <div className="mt-3 bg-emerald-500/15 rounded-md p-3">
              <p className="text-sm text-emerald-300">We found information in your resume.</p>
              <Link href="/dashboard/resume/review" className="text-sm text-brand-300 hover:underline mt-1 inline-block hover:text-brand-200 transition-colors">
                Review and add to profile →
              </Link>
            </div>
          )}

          {latest.resume.upload_status === "failed" && (
            <div className="mt-3 bg-amber-500/15 rounded-md p-3">
              <p className="text-sm text-amber-300">
                We couldn't process this file automatically. No problem — you can still build out your profile by
                hand.
              </p>
              <Link href="/dashboard/profile" className="text-sm text-brand-300 hover:underline mt-1 inline-block hover:text-brand-200 transition-colors">
                Go to profile →
              </Link>
            </div>
          )}
        </div>
      )}

      <UploadForm />
    </div>
  );
}
