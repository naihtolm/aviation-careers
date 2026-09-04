import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/profile/queries";
import { getEmployerContext } from "@/features/employers/queries";
import { CompanyProfileForm } from "@/components/employers/CompanyProfileForm";

export default async function EmployerCompanyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const context = await getEmployerContext(user.id);
  if (!context) redirect("/employers/sign-up");
  if (context.company.status !== "active") redirect("/employer/verification");

  const company = context.company as any;

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold text-white mb-1">{company.name}</h1>
      <p className="text-sm text-slate-400 mb-6">Company profile</p>
      <CompanyProfileForm
        initialDescription={company.description ?? ""}
        initialWebsite={company.website ?? ""}
        initialSizeRange={company.employee_size_range ?? ""}
      />
    </div>
  );
}
