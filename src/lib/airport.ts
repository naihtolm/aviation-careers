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
