import { Plane, Package, PlaneTakeoff, Wrench, Factory, Landmark, HeartPulse, Siren, Shield, type LucideIcon } from "lucide-react";

// Sectors describe the *type of employer* (what industry they're in), as
// opposed to career_categories which describe *type of work*. The two are
// meant to cut across each other -- a Military & Defense company posting
// an Aerospace Engineer job shows up under both the Engineering & Design
// career page and this Military & Defense sector page. A curated subset
// of company_type, not all 16 values: airport/airport_authority/
// ground_handling already have a home in the Airports directory, and
// staffing/training/other aren't something a job-seeker browses "by
// sector" for.
export interface SectorDef {
  slug: string;
  name: string;
  description: string;
  companyTypes: string[];
  colorKey: "sky" | "teal" | "violet" | "amber" | "indigo" | "slate" | "rose" | "orange" | "stone";
  icon: LucideIcon;
}

export const SECTORS: SectorDef[] = [
  {
    slug: "airlines",
    name: "Airlines",
    description: "Passenger and regional carriers operating scheduled commercial flights.",
    companyTypes: ["airline"],
    colorKey: "sky",
    icon: Plane,
  },
  {
    slug: "cargo-logistics",
    name: "Cargo & Logistics",
    description: "Freight carriers and logistics operators moving goods by air.",
    companyTypes: ["cargo"],
    colorKey: "teal",
    icon: Package,
  },
  {
    slug: "general-aviation-fbo",
    name: "General Aviation & FBO",
    description: "Fixed-base operators, charter operations, and private/corporate flight departments.",
    companyTypes: ["fbo"],
    colorKey: "violet",
    icon: PlaneTakeoff,
  },
  {
    slug: "mro",
    name: "MRO",
    description: "Maintenance, repair, and overhaul providers servicing aircraft and components.",
    companyTypes: ["mro"],
    colorKey: "amber",
    icon: Wrench,
  },
  {
    slug: "manufacturing-aerospace",
    name: "Manufacturing & Aerospace",
    description: "Aircraft, component, and systems manufacturers, plus aerospace R&D.",
    companyTypes: ["manufacturer", "aerospace"],
    colorKey: "indigo",
    icon: Factory,
  },
  {
    slug: "government",
    name: "Government",
    description: "FAA, air traffic control, and other government aviation agencies.",
    companyTypes: ["government"],
    colorKey: "slate",
    icon: Landmark,
  },
  {
    slug: "ems-air-ambulance",
    name: "EMS / Air Ambulance",
    description: "Medevac and air ambulance operators providing critical care transport.",
    companyTypes: ["ems_operator"],
    colorKey: "rose",
    icon: HeartPulse,
  },
  {
    slug: "law-enforcement",
    name: "Law Enforcement",
    description: "Police and sheriff's department aviation units.",
    companyTypes: ["law_enforcement"],
    colorKey: "orange",
    icon: Siren,
  },
  {
    slug: "military-defense",
    name: "Military & Defense",
    description: "Armed forces aviation programs and defense contractors.",
    companyTypes: ["military_defense"],
    colorKey: "stone",
    icon: Shield,
  },
];

export function getSectorBySlug(slug: string): SectorDef | undefined {
  return SECTORS.find((s) => s.slug === slug);
}

export interface SectorColorClasses {
  iconBg: string;
  iconText: string;
  border: string;
  tagBg: string;
  tagText: string;
}

// Same dark-surface formula as categoryColor.ts: translucent tint for the
// icon/tag fills, 300-weight text, a 400-weight border (600 reads muddy
// on a near-black card).
const SECTOR_COLOR_CLASSES: Record<SectorDef["colorKey"], SectorColorClasses> = {
  sky: { iconBg: "bg-sky-500/15", iconText: "text-sky-300", border: "border-sky-400", tagBg: "bg-sky-500/15", tagText: "text-sky-300" },
  teal: { iconBg: "bg-teal-500/15", iconText: "text-teal-300", border: "border-teal-400", tagBg: "bg-teal-500/15", tagText: "text-teal-300" },
  violet: { iconBg: "bg-violet-500/15", iconText: "text-violet-300", border: "border-violet-400", tagBg: "bg-violet-500/15", tagText: "text-violet-300" },
  amber: { iconBg: "bg-amber-500/15", iconText: "text-amber-300", border: "border-amber-400", tagBg: "bg-amber-500/15", tagText: "text-amber-300" },
  indigo: { iconBg: "bg-indigo-500/15", iconText: "text-indigo-300", border: "border-indigo-400", tagBg: "bg-indigo-500/15", tagText: "text-indigo-300" },
  slate: { iconBg: "bg-slate-400/15", iconText: "text-slate-300", border: "border-slate-400", tagBg: "bg-slate-400/15", tagText: "text-slate-300" },
  rose: { iconBg: "bg-rose-500/15", iconText: "text-rose-300", border: "border-rose-400", tagBg: "bg-rose-500/15", tagText: "text-rose-300" },
  orange: { iconBg: "bg-orange-500/15", iconText: "text-orange-300", border: "border-orange-400", tagBg: "bg-orange-500/15", tagText: "text-orange-300" },
  stone: { iconBg: "bg-stone-400/15", iconText: "text-stone-300", border: "border-stone-400", tagBg: "bg-stone-400/15", tagText: "text-stone-300" },
};

export function sectorColorClasses(colorKey: SectorDef["colorKey"]): SectorColorClasses {
  return SECTOR_COLOR_CLASSES[colorKey];
}
