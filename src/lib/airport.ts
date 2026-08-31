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

const AIRPORT_TYPE_COLORS: Record<string, { badgeBg: string; badgeText: string }> = {
  commercial: { badgeBg: "bg-sky-50", badgeText: "text-sky-700" },
  international: { badgeBg: "bg-indigo-50", badgeText: "text-indigo-700" },
  cargo: { badgeBg: "bg-amber-50", badgeText: "text-amber-800" },
  general_aviation: { badgeBg: "bg-emerald-50", badgeText: "text-emerald-700" },
  military: { badgeBg: "bg-slate-200", badgeText: "text-slate-700" },
  municipal: { badgeBg: "bg-teal-50", badgeText: "text-teal-700" },
  private: { badgeBg: "bg-slate-100", badgeText: "text-slate-600" },
};

export function airportTypeColorClasses(type?: string | null) {
  return AIRPORT_TYPE_COLORS[type ?? ""] ?? { badgeBg: "bg-slate-100", badgeText: "text-slate-500" };
}
