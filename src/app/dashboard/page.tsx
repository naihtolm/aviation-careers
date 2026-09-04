import { redirect } from "next/navigation";
import Link from "next/link";
import { Upload, Search, UserRound, Bookmark, FileText, Bell } from "lucide-react";
import { getCurrentUser, getFullProfile, profileCompletionPercent } from "@/features/profile/queries";
import { getSavedJobs } from "@/features/jobs/queries";
import { getApplicationsByStatus } from "@/features/applications/queries";
import { getAlerts } from "@/features/alerts/queries";

function nextStepSuggestion(data: Awaited<ReturnType<typeof getFullProfile>>) {
  if (!data.seekerProfile?.city) return "Add your location so we can find jobs near you.";
  if (data.careerInterestIds.length === 0) return "Tell us which careers you're interested in to see better matches.";
  if (!data.seekerProfile?.experience_level) return "Add your experience level so we can tailor your recommendations.";
  if (data.experience.length === 0) return "Add your work experience to improve your matches.";
  if (data.skills.length === 0) return "Add your skills so employers can find you.";
  if (data.certifications.length === 0) return "Add your certifications — especially if your role requires FAA credentials.";
  return "Your profile is looking good!";
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const [data, savedJobs, applications, alerts] = await Promise.all([
    getFullProfile(user.id),
    getSavedJobs(user.id),
    getApplicationsByStatus(user.id),
    getAlerts(user.id),
  ]);
  const completion = profileCompletionPercent(data);
  const applicationCount = Object.values(applications).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-white">
        Welcome{data.profile?.first_name ? `, ${data.profile.first_name}` : ""}
      </h1>

      <div className="border border-white/10 rounded-lg p-4 bg-white/[0.04] mt-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-white">Profile completion</p>
          <p className="text-sm text-slate-400">{completion}%</p>
        </div>
        <div className="bg-white/10 rounded-full h-2">
          <div className="bg-accent-200 h-2 rounded-full" style={{ width: `${completion}%` }} />
        </div>
        <p className="text-sm text-slate-400 mt-3">{nextStepSuggestion(data)}</p>
        <Link href="/dashboard/profile" className="inline-block mt-3 text-sm text-brand-300 hover:underline hover:text-brand-200 transition-colors">
          Edit profile →
        </Link>
      </div>

      <Link
        href="/dashboard/resume"
        className="flex items-center gap-3 border rounded-lg p-4 bg-accent-200 text-board mt-4 hover:bg-accent-100 transition-colors"
      >
        <div className="w-9 h-9 rounded-lg bg-board/10 flex items-center justify-center shrink-0">
          <Upload className="w-5 h-5" />
        </div>
        <div>
          <p className="font-medium">Upload your resume</p>
          <p className="text-sm text-board/70 mt-0.5">
            We'll pull out your experience, education, skills, and certifications — you review before anything saves.
          </p>
        </div>
      </Link>

      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <Link href="/jobs" className="flex items-center gap-3 border border-white/10 rounded-lg p-4 bg-white/[0.04] hover:border-brand-300 hover:bg-white/[0.07] hover:-translate-y-0.5 transition-all">
          <div className="w-9 h-9 rounded-lg bg-brand-400/15 text-brand-300 flex items-center justify-center shrink-0">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-white">Browse jobs</p>
            <p className="text-sm text-slate-400 mt-0.5">Search real aviation openings.</p>
          </div>
        </Link>
        <Link href="/dashboard/profile" className="flex items-center gap-3 border border-white/10 rounded-lg p-4 bg-white/[0.04] hover:border-brand-300 hover:bg-white/[0.07] hover:-translate-y-0.5 transition-all">
          <div className="w-9 h-9 rounded-lg bg-brand-400/15 text-brand-300 flex items-center justify-center shrink-0">
            <UserRound className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-white">Your profile</p>
            <p className="text-sm text-slate-400 mt-0.5">
              {data.experience.length} experience · {data.education.length} education · {data.skills.length} skills
            </p>
          </div>
        </Link>
        <Link href="/dashboard/saved" className="flex items-center gap-3 border border-white/10 rounded-lg p-4 bg-white/[0.04] hover:border-brand-300 hover:bg-white/[0.07] hover:-translate-y-0.5 transition-all">
          <div className="w-9 h-9 rounded-lg bg-brand-400/15 text-brand-300 flex items-center justify-center shrink-0">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-white">Saved jobs</p>
            <p className="text-sm text-slate-400 mt-0.5">{savedJobs.length} saved</p>
          </div>
        </Link>
        <Link href="/dashboard/applications" className="flex items-center gap-3 border border-white/10 rounded-lg p-4 bg-white/[0.04] hover:border-brand-300 hover:bg-white/[0.07] hover:-translate-y-0.5 transition-all">
          <div className="w-9 h-9 rounded-lg bg-brand-400/15 text-brand-300 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-white">Applications</p>
            <p className="text-sm text-slate-400 mt-0.5">{applicationCount} tracked</p>
          </div>
        </Link>
        <Link href="/dashboard/alerts" className="flex items-center gap-3 border border-white/10 rounded-lg p-4 bg-white/[0.04] hover:border-brand-300 hover:bg-white/[0.07] hover:-translate-y-0.5 transition-all sm:col-span-2">
          <div className="w-9 h-9 rounded-lg bg-brand-400/15 text-brand-300 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-white">Job alerts</p>
            <p className="text-sm text-slate-400 mt-0.5">
              {alerts.filter((a: any) => a.is_active).length} active alert{alerts.filter((a: any) => a.is_active).length === 1 ? "" : "s"}
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
