"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/jobs", label: "All Jobs" },
  { href: "/admin/jobs/review", label: "Ingestion Review" },
  { href: "/admin/reviews", label: "Review Moderation" },
  { href: "/admin/employers", label: "Employer Verification" },
  { href: "/admin/data-quality", label: "Data Quality" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-white/10 mb-8 overflow-x-auto">
      {LINKS.map((link) => {
        const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
              active ? "border-accent-200 text-white font-medium" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
