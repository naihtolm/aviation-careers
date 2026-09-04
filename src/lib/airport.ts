const AIRPORT_TYPE_LABELS: Record<string, string> = {
  commercial: "Commercial",
  general_aviation: "General Aviation",
  cargo: "Cargo",
  military: "Military",
  international: "International",
  municipal: "Municipal",
  private: "Private",
};

export function airportTypeLabel(type?: string | null): string | null {
  if (!type) return null;
  return AIRPORT_TYPE_LABELS[type] ?? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Same dark-surface formula as categoryColor.ts/sectors.ts: translucent
// tint instead of a flat light-50 fill, 300-weight text.
const AIRPORT_TYPE_COLORS: Record<string, { badgeBg: string; badgeText: string }> = {
  commercial: { badgeBg: "bg-sky-500/15", badgeText: "text-sky-300" },
  international: { badgeBg: "bg-indigo-500/15", badgeText: "text-indigo-300" },
  cargo: { badgeBg: "bg-amber-500/15", badgeText: "text-amber-300" },
  general_aviation: { badgeBg: "bg-emerald-500/15", badgeText: "text-emerald-300" },
  military: { badgeBg: "bg-slate-400/15", badgeText: "text-slate-300" },
  municipal: { badgeBg: "bg-teal-500/15", badgeText: "text-teal-300" },
  private: { badgeBg: "bg-slate-400/10", badgeText: "text-slate-400" },
};

export function airportTypeColorClasses(type?: string | null) {
  return AIRPORT_TYPE_COLORS[type ?? ""] ?? { badgeBg: "bg-slate-400/10", badgeText: "text-slate-400" };
}
