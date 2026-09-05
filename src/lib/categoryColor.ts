export interface CategoryColorClasses {
  iconBg: string;
  iconText: string;
  border: string;
  tagBg: string;
  tagText: string;
  text: string;
  cardWash: string;
}

const ENGINEERING: CategoryColorClasses = {
  iconBg: "bg-indigo-50",
  iconText: "text-indigo-600",
  border: "border-indigo-600",
  tagBg: "bg-indigo-50",
  tagText: "text-indigo-700",
  text: "text-indigo-600",
  cardWash: "bg-gradient-to-br from-indigo-50/60 to-white",
};

const MAINTENANCE: CategoryColorClasses = {
  iconBg: "bg-amber-50",
  iconText: "text-amber-700",
  border: "border-amber-700",
  tagBg: "bg-amber-50",
  tagText: "text-amber-800",
  text: "text-amber-700",
  cardWash: "bg-gradient-to-br from-amber-50/60 to-white",
};

const FLIGHT: CategoryColorClasses = {
  iconBg: "bg-sky-50",
  iconText: "text-sky-700",
  border: "border-sky-700",
  tagBg: "bg-sky-50",
  tagText: "text-sky-800",
  text: "text-sky-700",
  cardWash: "bg-gradient-to-br from-sky-50/60 to-white",
};

const DEFAULT: CategoryColorClasses = {
  iconBg: "bg-brand-50",
  iconText: "text-brand-600",
  border: "border-brand-600",
  tagBg: "bg-brand-50",
  tagText: "text-brand-700",
  text: "text-brand-600",
  cardWash: "bg-gradient-to-br from-brand-50/60 to-white",
};

const EMERGENCY: CategoryColorClasses = {
  iconBg: "bg-rose-50",
  iconText: "text-rose-600",
  border: "border-rose-600",
  tagBg: "bg-rose-50",
  tagText: "text-rose-700",
  text: "text-rose-600",
  cardWash: "bg-gradient-to-br from-rose-50/60 to-white",
};

const MILITARY: CategoryColorClasses = {
  iconBg: "bg-stone-200",
  iconText: "text-stone-700",
  border: "border-stone-600",
  tagBg: "bg-stone-100",
  tagText: "text-stone-700",
  text: "text-stone-600",
  cardWash: "bg-gradient-to-br from-stone-100/60 to-white",
};

const CARGO: CategoryColorClasses = {
  iconBg: "bg-teal-50",
  iconText: "text-teal-700",
  border: "border-teal-600",
  tagBg: "bg-teal-50",
  tagText: "text-teal-800",
  text: "text-teal-700",
  cardWash: "bg-gradient-to-br from-teal-50/60 to-white",
};

const GENERAL_AVIATION: CategoryColorClasses = {
  iconBg: "bg-violet-50",
  iconText: "text-violet-600",
  border: "border-violet-600",
  tagBg: "bg-violet-50",
  tagText: "text-violet-700",
  text: "text-violet-600",
  cardWash: "bg-gradient-to-br from-violet-50/60 to-white",
};

// Same substring matching as CategoryIcon so a career/category always gets
// a color that agrees with its icon, without keeping two separate lookup
// tables in sync by hand.
export function categoryColorClasses(name: string | null | undefined): CategoryColorClasses {
  const lower = (name ?? "").toLowerCase();
  if (lower.includes("engineer") || lower.includes("design")) return ENGINEERING;
  if (lower.includes("maintenance") || lower.includes("technical")) return MAINTENANCE;
  if (lower.includes("emergency") || lower.includes("public safety")) return EMERGENCY;
  if (lower.includes("military") || lower.includes("defense")) return MILITARY;
  if (lower.includes("cargo") || lower.includes("logistics")) return CARGO;
  if (lower.includes("general aviation") || lower.includes("private")) return GENERAL_AVIATION;
  if (lower.includes("flight") || lower.includes("pilot") || lower.includes("operations")) return FLIGHT;
  return DEFAULT;
}
