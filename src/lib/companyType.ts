import { titleCase } from "@/lib/text";

// A couple of these are industry acronyms (MRO, FBO) that plain title-
// casing would mangle into "Mro"/"Fbo" -- worth a real label map rather
// than a generic string transform.
const COMPANY_TYPE_LABELS: Record<string, string> = {
  mro: "MRO",
  fbo: "FBO",
};

export function companyTypeLabel(type?: string | null): string {
  if (!type) return "Other";
  return COMPANY_TYPE_LABELS[type] ?? titleCase(type);
}
