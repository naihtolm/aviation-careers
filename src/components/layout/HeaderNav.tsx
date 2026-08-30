"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, GraduationCap, DollarSign, Plane } from "lucide-react";

const NAV_LINKS = [
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/careers", label: "Careers", icon: GraduationCap },
  { href: "/salaries", label: "Salaries", icon: DollarSign },
  { href: "/airports", label: "Airports", icon: Plane },
];

export function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-6 text-sm">
      {NAV_LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`inline-flex items-center gap-1.5 transition-colors ${
              active ? "text-brand-600 font-medium" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <link.icon className="w-4 h-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
