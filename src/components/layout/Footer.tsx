import Link from "next/link";

const COLUMNS = [
  {
    title: "Job Seekers",
    links: [
      { href: "/jobs", label: "Search Jobs" },
      { href: "/careers", label: "Career Guides" },
      { href: "/salaries", label: "Salaries" },
    ],
  },
  {
    title: "Explore",
    links: [
      { href: "/airports", label: "Airports" },
      { href: "/employers", label: "For Employers" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t bg-slate-50 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-2">
          <p className="font-semibold text-slate-900">Aviation Careers</p>
          <p className="text-sm text-slate-500 mt-2 max-w-xs">
            Jobs, salaries, and career guidance for the aviation industry — mechanics, pilots, engineers,
            ramp agents, and more.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-medium text-slate-900 mb-3">{col.title}</p>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-500 hover:text-slate-900">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t">
        <p className="max-w-6xl mx-auto px-4 py-4 text-xs text-slate-400">
          © {new Date().getFullYear()} Aviation Careers.
        </p>
      </div>
    </footer>
  );
}
