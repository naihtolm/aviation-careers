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

const AIRPORT_TYPE_COLORS: Record<string, { badgeBg: string; badgeText: string; border: string; cardWash: string }> = {
  commercial: { badgeBg: "bg-sky-50", badgeText: "text-sky-700", border: "border-sky-600", cardWash: "bg-gradient-to-br from-sky-50/60 to-white" },
  international: { badgeBg: "bg-indigo-50", badgeText: "text-indigo-700", border: "border-indigo-600", cardWash: "bg-gradient-to-br from-indigo-50/60 to-white" },
  cargo: { badgeBg: "bg-amber-50", badgeText: "text-amber-800", border: "border-amber-700", cardWash: "bg-gradient-to-br from-amber-50/60 to-white" },
  general_aviation: { badgeBg: "bg-emerald-50", badgeText: "text-emerald-700", border: "border-emerald-600", cardWash: "bg-gradient-to-br from-emerald-50/60 to-white" },
  military: { badgeBg: "bg-slate-200", badgeText: "text-slate-700", border: "border-slate-500", cardWash: "bg-gradient-to-br from-slate-100/60 to-white" },
  municipal: { badgeBg: "bg-teal-50", badgeText: "text-teal-700", border: "border-teal-600", cardWash: "bg-gradient-to-br from-teal-50/60 to-white" },
  private: { badgeBg: "bg-slate-100", badgeText: "text-slate-600", border: "border-slate-400", cardWash: "bg-gradient-to-br from-slate-100/60 to-white" },
};

export function airportTypeColorClasses(type?: string | null) {
  return AIRPORT_TYPE_COLORS[type ?? ""] ?? { badgeBg: "bg-slate-100", badgeText: "text-slate-500", border: "border-slate-400", cardWash: "bg-gradient-to-br from-slate-100/60 to-white" };
}
