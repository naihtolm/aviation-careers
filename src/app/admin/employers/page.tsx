import { getServiceClient } from "@/lib/supabase/service";
import { EmployerVerificationCard } from "@/components/employers/EmployerVerificationCard";

export default async function AdminEmployersPage() {
  // Admin auth is checked once in app/admin/layout.tsx (requireAdmin()) --
  // no need to repeat it here.

  // company_verifications is read-restricted to the employer's own
  // company (015_rls_policies.sql) -- admin needs to see every pending
  // one regardless of company, so this goes through the service client,
  // gated by requireAdmin() in the layout.
  const db = getServiceClient();
  const { data: verifications, error } = await db
    .from("company_verifications")
    .select("*, companies ( id, name, company_type, website )")
    .eq("status", "pending")
    .order("submitted_at", { ascending: true })
    .limit(50);

  if (error) {
    return <p className="text-red-400">Failed to load verifications: {error.message}</p>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-2">Employer Verification</h2>
      <p className="text-sm text-slate-400 mb-6">
        {verifications?.length ?? 0} pending employer{(verifications?.length ?? 0) === 1 ? "" : "s"} awaiting review.
      </p>

      {(!verifications || verifications.length === 0) && (
        <p className="text-slate-400">Nothing waiting for review right now.</p>
      )}

      <div className="space-y-4">
        {verifications?.map((v: any) => (
          <EmployerVerificationCard key={v.id} verification={v} />
        ))}
      </div>
    </div>
  );
}
