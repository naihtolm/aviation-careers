import Link from "next/link";

const NAV_LINKS = [
  { href: "/jobs", label: "Jobs" },
  { href: "/careers", label: "Careers" },
  { href: "/salaries", label: "Salaries" },
  { href: "/airports", label: "Airports" },
];

export function Header() {
  return (
    <header className="border-b bg-white sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg text-slate-900">
          Aviation Careers
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-slate-900">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/employers" className="hidden sm:block text-slate-600 hover:text-slate-900">
            For Employers
          </Link>
          <Link
            href="/dev-sign-in"
            className="bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}
