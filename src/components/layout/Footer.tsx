import Link from "next/link";
import { Briefcase, GraduationCap, DollarSign, Plane, Building2, Compass, type LucideIcon } from "lucide-react";

const COLUMNS: { title: string; icon: LucideIcon; links: { href: string; label: string; icon: LucideIcon }[] }[] = [
  {
    title: "Job Seekers",
    icon: Briefcase,
    links: [
      { href: "/jobs", label: "Search Jobs", icon: Briefcase },
      { href: "/careers", label: "Career Guides", icon: GraduationCap },
      { href: "/salaries", label: "Salaries", icon: DollarSign },
    ],
  },
  {
    title: "Explore",
    icon: Compass,
    links: [
      { href: "/airports", label: "Airports", icon: Plane },
      { href: "/employers", label: "For Employers", icon: Building2 },
    ],
  },
];

// Deliberately the same navy identity as the homepage hero/CTA band, not
// just a plain light footer -- so the design language carries through to
// the very bottom of every page, not only the top of the homepage.
export function Footer() {
  return (
    <footer className="bg-gradient-to-b from-navy-950 to-navy-900 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-2">
          <p className="font-display text-white font-semibold">Aviation Careers</p>
          <p className="text-sm text-slate-300 mt-2 max-w-xs">
            Jobs, salaries, and career guidance for the aviation industry — mechanics, pilots, engineers,
            ramp agents, and more.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-medium text-white mb-3 flex items-center gap-1.5">
              <col.icon className="w-4 h-4 text-brand-300" />
              {col.title}
            </p>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-300 hover:text-white transition-colors inline-flex items-center gap-1.5"
                  >
                    <link.icon className="w-3.5 h-3.5 text-slate-500" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        {/* Extra bottom clearance on mobile so this sits above the fixed
            MobileNav bar -- kept here (inside the footer's own navy
            background) rather than as padding on <main>, so the clearance
            space doesn't show up as a plain body-colored gap between a
            colored section and the footer. */}
        <p className="max-w-6xl mx-auto px-4 pt-4 pb-20 md:pb-4 text-xs text-slate-400">
          © {new Date().getFullYear()} Aviation Careers.
        </p>
      </div>
    </footer>
  );
}
