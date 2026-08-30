import { getAllJobsForAdmin } from "@/features/admin/queries";
import { AdminJobsTable } from "@/components/admin/AdminJobsTable";

const STATUSES = ["draft", "pending_review", "active", "paused", "expired", "archived", "rejected"];

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = params.page ? Number(params.page) : 1;
  const { jobs, total, pageSize } = await getAllJobsForAdmin({
    status: params.status,
    keyword: params.q,
    page,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">All Jobs</h2>
      <p className="text-sm text-slate-500 mb-4">
        {total} job{total === 1 ? "" : "s"} across every company.
      </p>

      <form className="flex flex-wrap gap-2 mb-4" action="/admin/jobs">
        <input
          type="text"
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search by title"
          className="border rounded-md px-3 py-1.5 text-sm"
        />
        <select name="status" defaultValue={params.status ?? ""} className="border rounded-md px-3 py-1.5 text-sm">
          <option value="">Any status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
        <button type="submit" className="border rounded-md px-3 py-1.5 text-sm bg-brand-600 text-white hover:bg-brand-700 transition-colors">
          Filter
        </button>
      </form>

      <AdminJobsTable jobs={jobs as any} />

      {totalPages > 1 && (
        <div className="flex gap-2 mt-4 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/admin/jobs?${new URLSearchParams({ ...params, page: String(p) } as any).toString()}`}
              className={`px-2.5 py-1 rounded-md border ${p === page ? "bg-brand-600 text-white hover:bg-brand-700 transition-colors border-brand-600" : "text-slate-600"}`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
