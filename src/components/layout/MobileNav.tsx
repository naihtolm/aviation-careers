"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home as HomeIcon, Briefcase, Compass, Bookmark, UserRound } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/careers", label: "Explore", icon: Compass },
  { href: "/dashboard/saved", label: "Saved", icon: Bookmark },
  { href: "/dashboard", label: "Profile", icon: UserRound },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t flex">
      {ITEMS.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${active ? "text-brand-600 font-medium" : "text-slate-500"}`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
