import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/profile/queries";
import { getEmployerContext } from "@/features/employers/queries";
import { getCareers } from "@/features/careers/queries";
import { JobPostForm } from "@/components/employers/JobPostForm";

export default async function NewJobPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const context = await getEmployerContext(user.id);
  if (!context) redirect("/employers/sign-up");
  if (context.company.status !== "active") redirect("/employer/verification");

  const careers = await getCareers();

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">Post a Job</h1>
      <p className="text-sm text-slate-500 mb-6">Posting as {context.company.name}</p>
      <JobPostForm careers={careers.map((c: any) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
