import type { LucideIcon } from "lucide-react";

// Same board identity as the header, in a shorter form, so secondary
// pages (jobs, careers, airports) carry the same designed, "this is a
// real product" feel instead of dropping straight into a plain white
// page the moment you leave the homepage. -mt-16 pulls it up under the
// sticky header (also on the board) for one continuous dark panel rather
// than a seam between two different dark tones.
export function PageHero({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden -mt-16 bg-gradient-to-b from-board via-board-2 to-board-2">
      <div
        className="pointer-events-none absolute -top-20 -left-16 w-72 h-72 rounded-full bg-brand-400/20 blur-3xl animate-float-slow"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-10 -right-20 w-80 h-80 rounded-full bg-brand-500/25 blur-3xl animate-float-slow-reverse"
        aria-hidden
      />
      <div className="relative max-w-6xl mx-auto px-4 pt-[6.5rem] pb-10">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-11 h-11 rounded-lg bg-white/10 border border-white/15 text-accent-200 flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6" />
            </div>
          )}
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white text-balance">{title}</h1>
            {description && <p className="text-slate-300 mt-0.5">{description}</p>}
          </div>
        </div>
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}
