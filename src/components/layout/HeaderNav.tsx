"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, GraduationCap, DollarSign, Plane, BookOpen } from "lucide-react";

const NAV_LINKS = [
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/careers", label: "Careers", icon: GraduationCap },
  { href: "/salaries", label: "Salaries", icon: DollarSign },
  { href: "/airports", label: "Airports", icon: Plane },
  { href: "/resources", label: "Resources", icon: BookOpen },
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
              active ? "text-accent-200 font-medium" : "text-white/80 hover:text-white"
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
