"use client";

import { useId, useState } from "react";

export interface SalaryTrendPoint {
  year: number;
  p25: number | null;
  p50: number;
  p75: number | null;
}

function fmt(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

// A 3-point-per-career line + percentile band, built by hand rather than
// pulling in a charting library for one chart on one page. Single series
// (median) so no legend box -- the title already names it -- but the
// p25-p75 band still needs its own inline label since a shaded region
// with no key would just read as decoration.
export function SalaryTrendChart({ points }: { points: SalaryTrendPoint[] }) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (points.length < 2) return null;

  const width = 560;
  const height = 220;
  const padding = { top: 16, right: 16, bottom: 28, left: 64 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const allValues = points.flatMap((p) => [p.p50, p.p25 ?? p.p50, p.p75 ?? p.p50]);
  const minV = Math.min(...allValues);
  const maxV = Math.max(...allValues);
  // A little headroom so the line/band never touches the plot edge.
  const vPad = (maxV - minV) * 0.15 || maxV * 0.1;
  const yMin = Math.max(0, minV - vPad);
  const yMax = maxV + vPad;

  const x = (i: number) => padding.left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const y = (v: number) => padding.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

  const medianPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.p50)}`).join(" ");

  const hasBand = points.every((p) => p.p25 != null && p.p75 != null);
  const bandPath = hasBand
    ? [
        ...points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.p75!)}`),
        ...[...points].reverse().map((p, i) => `L ${x(points.length - 1 - i)} ${y(p.p25!)}`),
        "Z",
      ].join(" ")
    : null;

  const yTicks = [yMin, (yMin + yMax) / 2, yMax];

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Median salary by year">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent-200)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-accent-200)" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        {/* Recessive gridlines + axis labels */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={padding.left} x2={width - padding.right} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
            <text x={padding.left - 8} y={y(v)} textAnchor="end" dominantBaseline="middle" className="fill-slate-500" fontSize={10}>
              {fmt(v)}
            </text>
          </g>
        ))}
        {points.map((p, i) => (
          <text key={p.year} x={x(i)} y={height - 8} textAnchor="middle" className="fill-slate-400" fontSize={11}>
            {p.year}
          </text>
        ))}

        {bandPath && <path d={bandPath} fill={`url(#${gradientId})`} />}
        <path d={medianPath} fill="none" stroke="var(--color-accent-200)" strokeWidth={2} strokeLinejoin="round" />

        {points.map((p, i) => (
          <g key={p.year}>
            {/* Hit target wider than the visible marker, per interaction spec */}
            <circle
              cx={x(i)}
              cy={y(p.p50)}
              r={12}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex((cur) => (cur === i ? null : cur))}
              style={{ cursor: "pointer" }}
            />
            <circle cx={x(i)} cy={y(p.p50)} r={4} fill="var(--color-accent-200)" stroke="var(--color-board-2)" strokeWidth={1.5} />
          </g>
        ))}

        {hoverIndex != null && (
          <line
            x1={x(hoverIndex)}
            x2={x(hoverIndex)}
            y1={padding.top}
            y2={padding.top + plotH}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}
      </svg>

      {hoverIndex != null && (
        <div className="text-xs bg-board text-white rounded px-2.5 py-1.5 inline-block -mt-2 shadow-lg border border-white/10">
          <span className="font-medium">{points[hoverIndex].year}</span>
          <span className="mx-1.5 text-slate-500">·</span>
          Median {fmt(points[hoverIndex].p50)}
          {points[hoverIndex].p25 != null && points[hoverIndex].p75 != null && (
            <span className="text-slate-400"> ({fmt(points[hoverIndex].p25!)}–{fmt(points[hoverIndex].p75!)})</span>
          )}
        </div>
      )}

      {hasBand && (
        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
          <span className="inline-block w-3 h-2 rounded-sm" style={{ background: "var(--color-accent-200)", opacity: 0.35 }} />
          Shaded band = 25th–75th percentile range
        </p>
      )}

      <details className="mt-3">
        <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300 select-none">View as table</summary>
        <table className="w-full text-xs mt-2 border-collapse">
          <thead>
            <tr className="text-left text-slate-500 border-b border-white/10">
              <th className="py-1.5 font-medium">Year</th>
              <th className="py-1.5 font-medium">25th pct</th>
              <th className="py-1.5 font-medium">Median</th>
              <th className="py-1.5 font-medium">75th pct</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.year} className="border-b border-white/5">
                <td className="py-1.5 text-slate-300">{p.year}</td>
                <td className="py-1.5 text-slate-300">{p.p25 != null ? fmt(p.p25) : "—"}</td>
                <td className="py-1.5 text-white font-medium">{fmt(p.p50)}</td>
                <td className="py-1.5 text-slate-300">{p.p75 != null ? fmt(p.p75) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
