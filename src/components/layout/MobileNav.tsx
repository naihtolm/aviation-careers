"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home as HomeIcon, Briefcase, Compass, Bookmark, UserRound } from "lucide-react";
import { useAuthGate } from "@/components/auth/AuthGateContext";

const ITEMS = [
  { href: "/", label: "Home", icon: HomeIcon, gated: false },
  { href: "/jobs", label: "Jobs", icon: Briefcase, gated: true },
  { href: "/careers", label: "Explore", icon: Compass, gated: true },
  { href: "/dashboard/saved", label: "Saved", icon: Bookmark, gated: true },
  { href: "/dashboard", label: "Profile", icon: UserRound, gated: true },
];

export function MobileNav({ isSignedIn }: { isSignedIn: boolean }) {
  const pathname = usePathname();
  const { openGate } = useAuthGate();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-board/95 backdrop-blur-sm border-t border-white/10 flex">
      {ITEMS.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const className = `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${active ? "text-accent-200 font-medium" : "text-slate-400"}`;

        if (item.gated && !isSignedIn) {
          return (
            <button key={item.label} onClick={() => openGate("signup")} className={className}>
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        }

        return (
          <Link key={item.label} href={item.href} className={className}>
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
