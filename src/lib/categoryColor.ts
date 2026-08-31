export interface CategoryColorClasses {
  iconBg: string;
  iconText: string;
  border: string;
  tagBg: string;
  tagText: string;
  text: string;
}

const ENGINEERING: CategoryColorClasses = {
  iconBg: "bg-indigo-50",
  iconText: "text-indigo-600",
  border: "border-indigo-600",
  tagBg: "bg-indigo-50",
  tagText: "text-indigo-700",
  text: "text-indigo-600",
};

const MAINTENANCE: CategoryColorClasses = {
  iconBg: "bg-amber-50",
  iconText: "text-amber-700",
  border: "border-amber-700",
  tagBg: "bg-amber-50",
  tagText: "text-amber-800",
  text: "text-amber-700",
};

const FLIGHT: CategoryColorClasses = {
  iconBg: "bg-sky-50",
  iconText: "text-sky-700",
  border: "border-sky-700",
  tagBg: "bg-sky-50",
  tagText: "text-sky-800",
  text: "text-sky-700",
};

const DEFAULT: CategoryColorClasses = {
  iconBg: "bg-brand-50",
  iconText: "text-brand-600",
  border: "border-brand-600",
  tagBg: "bg-brand-50",
  tagText: "text-brand-700",
  text: "text-brand-600",
};

// Same substring matching as CategoryIcon so a career/category always gets
// a color that agrees with its icon, without keeping two separate lookup
// tables in sync by hand.
export function categoryColorClasses(name: string | null | undefined): CategoryColorClasses {
  const lower = (name ?? "").toLowerCase();
  if (lower.includes("engineer") || lower.includes("design")) return ENGINEERING;
  if (lower.includes("maintenance") || lower.includes("technical")) return MAINTENANCE;
  if (lower.includes("flight") || lower.includes("pilot") || lower.includes("operations")) return FLIGHT;
  return DEFAULT;
}
