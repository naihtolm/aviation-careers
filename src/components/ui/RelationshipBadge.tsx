import { Building2, Plane, Wrench, MapPin, Package, Landmark, type LucideIcon } from "lucide-react";

const RELATIONSHIP_META: Record<string, { label: string; icon: LucideIcon }> = {
  hub: { label: "Hub", icon: Plane },
  base: { label: "Base", icon: MapPin },
  maintenance_base: { label: "Maintenance base", icon: Wrench },
  operations: { label: "Operations", icon: Building2 },
  cargo_hub: { label: "Cargo hub", icon: Package },
  headquarters: { label: "Headquarters", icon: Landmark },
  other: { label: "Operates here", icon: Building2 },
};

export function RelationshipBadge({ type, className = "" }: { type: string; className?: string }) {
  const meta = RELATIONSHIP_META[type] ?? { label: type.replace(/_/g, " "), icon: Building2 };
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 capitalize ${className}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {meta.label}
    </span>
  );
}
