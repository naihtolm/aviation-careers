import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/features/profile/queries";
import { getEmployerContext, getLatestVerification } from "@/features/employers/queries";

const STATUS_COPY: Record<string, { title: string; body: string; tone: string }> = {
  pending: {
    title: "Verification pending",
    body: "We're reviewing your company. This is usually quick — you'll be able to post jobs once approved.",
    tone: "bg-amber-50 text-amber-800",
  },
  approved: {
    title: "You're verified!",
    body: "Your company is approved. You can post jobs now.",
    tone: "bg-emerald-50 text-emerald-800",
  },
  rejected: {
    title: "Verification declined",
    body: "We weren't able to verify your company with the information provided. Contact support if you think this is a mistake.",
    tone: "bg-red-50 text-red-800",
  },
  needs_information: {
    title: "More information needed",
    body: "We need a bit more to verify your company. Check your email, or contact support.",
    tone: "bg-amber-50 text-amber-800",
  },
};

export default async function EmployerVerificationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const context = await getEmployerContext(user.id);
  if (!context) redirect("/employers/sign-up");

  const verification = await getLatestVerification(context.company.id);
  const status = verification?.status ?? "pending";
  const copy = STATUS_COPY[status] ?? STATUS_COPY.pending;

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">{context.company.name}</h1>
      <div className={`rounded-lg p-4 mt-4 ${copy.tone}`}>
        <p className="font-medium">{copy.title}</p>
        <p className="text-sm mt-1">{copy.body}</p>
      </div>

      {status === "approved" && (
        <Link
          href="/employer/jobs/new"
          className="inline-block mt-4 bg-brand-600 text-white hover:bg-brand-700 transition-colors px-4 py-2 rounded-md text-sm font-medium"
        >
          Post a job →
        </Link>
      )}
    </div>
  );
}
