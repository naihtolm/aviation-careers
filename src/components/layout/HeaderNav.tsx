"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, GraduationCap, DollarSign, Plane, BookOpen } from "lucide-react";
import { useAuthGate } from "@/components/auth/AuthGateContext";

const NAV_LINKS = [
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/careers", label: "Careers", icon: GraduationCap },
  { href: "/salaries", label: "Salaries", icon: DollarSign },
  { href: "/airports", label: "Airports", icon: Plane },
  { href: "/resources", label: "Resources", icon: BookOpen },
];

// Resources is the one section that stays open to signed-out visitors --
// SEO-facing guide content, same reasoning the homepage prototype used to
// keep it outside the account wall. Everything else here is the actual
// job-search product, which is gated.
const UNGATED_HREFS = new Set(["/resources"]);

export function HeaderNav({ isSignedIn }: { isSignedIn: boolean }) {
  const pathname = usePathname();
  const { openGate } = useAuthGate();

  return (
    <nav className="hidden md:flex items-center gap-6 text-sm">
      {NAV_LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        const gated = !isSignedIn && !UNGATED_HREFS.has(link.href);
        const className = `inline-flex items-center gap-1.5 transition-colors ${
          active ? "text-accent-200 font-medium" : "text-white/80 hover:text-white"
        }`;

        if (gated) {
          return (
            <button key={link.href} onClick={() => openGate("signup")} className={className}>
              <link.icon className="w-4 h-4" />
              {link.label}
            </button>
          );
        }

        return (
          <Link key={link.href} href={link.href} className={className}>
            <link.icon className="w-4 h-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
