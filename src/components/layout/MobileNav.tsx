"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Home" },
  { href: "/jobs", label: "Jobs" },
  { href: "/careers", label: "Explore" },
  { href: "/dashboard/saved", label: "Saved" },
  { href: "/dashboard", label: "Profile" },
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
            className={`flex-1 text-center py-2.5 text-xs transition-colors ${active ? "text-brand-600 font-medium" : "text-slate-500"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
