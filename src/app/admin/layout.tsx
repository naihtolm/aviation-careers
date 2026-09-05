import { requireAdmin } from "@/features/admin/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">Admin</h1>
      <p className="text-sm text-slate-500 mb-4">Aviation Careers platform administration.</p>
      <AdminNav />
      {children}
    </div>
  );
}
