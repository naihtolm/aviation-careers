"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Bottom nav shell for the job-seeker mobile experience. Saved/Profile
// point at /dev-sign-in for now since there's no real auth or dashboard
// until Sprint 3/5 — this just keeps the nav structure in place early,
// per REPO_ARCHITECTURE.md's placement for components/layout/.
const ITEMS = [
  { href: "/", label: "Home" },
  { href: "/jobs", label: "Jobs" },
  { href: "/careers", label: "Explore" },
  { href: "/dev-sign-in", label: "Saved" },
  { href: "/dev-sign-in", label: "Profile" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t flex">
      {ITEMS.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href) && item.href !== "/dev-sign-in";
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex-1 text-center py-2.5 text-xs ${active ? "text-slate-900 font-medium" : "text-slate-500"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
