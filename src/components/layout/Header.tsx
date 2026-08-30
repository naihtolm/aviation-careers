import Link from "next/link";
import { Briefcase, GraduationCap, DollarSign, Plane } from "lucide-react";
import { getCurrentUser } from "@/features/profile/queries";
import { getEmployerContext } from "@/features/employers/queries";
import { signOut } from "@/features/auth/actions";

const NAV_LINKS = [
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/careers", label: "Careers", icon: GraduationCap },
  { href: "/salaries", label: "Salaries", icon: DollarSign },
  { href: "/airports", label: "Airports", icon: Plane },
];

export async function Header() {
  const user = await getCurrentUser();
  const employerContext = user ? await getEmployerContext(user.id) : null;

  return (
    <header className="border-b bg-white sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg text-slate-900">
          Aviation Careers
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="inline-flex items-center gap-1.5 hover:text-slate-900">
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/employers" className="hidden sm:block text-slate-600 hover:text-slate-900">
            For Employers
          </Link>
          {user ? (
            <>
              <Link href={employerContext ? "/employer/dashboard" : "/dashboard"} className="text-slate-600 hover:text-slate-900">
                Dashboard
              </Link>
              <form action={signOut}>
                <button type="submit" className="border border-slate-300 px-4 py-2 rounded-md hover:bg-slate-50 transition-colors">
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
