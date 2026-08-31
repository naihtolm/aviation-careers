import Link from "next/link";
import { Bookmark } from "lucide-react";
import { getCurrentUser } from "@/features/profile/queries";
import { getEmployerContext } from "@/features/employers/queries";
import { getSavedJobIds } from "@/features/jobs/queries";
import { signOut } from "@/features/auth/actions";
import { HeaderNav } from "@/components/layout/HeaderNav";

export async function Header() {
  const user = await getCurrentUser();
  const employerContext = user ? await getEmployerContext(user.id) : null;
  const savedCount = user && !employerContext ? (await getSavedJobIds(user.id)).size : 0;

  return (
    <header className="sticky top-0 z-40 bg-navy-950/60 backdrop-blur-md border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-display font-semibold text-lg text-white">
          Aviation Careers
        </Link>
        <HeaderNav />
        <div className="flex items-center gap-3 text-sm">
          <Link href="/employers" className="hidden sm:block text-white/80 hover:text-white transition-colors">
            For Employers
          </Link>
          {user ? (
            <>
              {!employerContext && (
                <Link
                  href="/dashboard/saved"
                  className="hidden sm:inline-flex items-center gap-1.5 text-white/80 hover:text-white transition-colors"
                >
                  <Bookmark className="w-4 h-4" />
                  {savedCount} Saved
                </Link>
              )}
              <Link href={employerContext ? "/employer/dashboard" : "/dashboard"} className="text-white/80 hover:text-white transition-colors">
                Dashboard
              </Link>
              <form action={signOut}>
                <button type="submit" className="border border-white/30 text-white px-4 py-2 rounded-md hover:bg-white/10 transition-colors">
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/sign-in"
              className="bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
