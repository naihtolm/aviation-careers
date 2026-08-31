"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { airportTypeLabel } from "@/lib/airport";

const RELATIONSHIP_LABELS: Record<string, string> = {
  hub: "Hub",
  base: "Base",
  maintenance_base: "Maintenance base",
  operations: "Operations",
  cargo_hub: "Cargo hub",
  headquarters: "Headquarters",
  other: "Operates here",
};

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  code: string;
  jobCount: number;
  airportType?: string | null;
  topCareer?: { name: string; count: number } | null;
  companies?: { name: string; relationshipType: string }[];
  href: string;
}

// A simple hiring-activity scale so the map reads at a glance -- cool and
// small for quiet airports, warming up through amber/orange, and glowing
// red with a pulse for the busiest hiring hubs. Thresholds are picked
// against the current real spread of job counts (single digits up to
// ~30), not derived from the dataset, since a fixed, explainable scale is
// easier for a non-technical admin to reason about than a moving target.
const TIERS = [
  { min: 0, max: 0, color: "#94a3b8", glow: "rgba(148,163,184,0.4)", label: "No open jobs", radius: 5, hot: false },
  { min: 1, max: 3, color: "#38bdf8", glow: "rgba(56,189,248,0.5)", label: "1–3 open jobs", radius: 6.5, hot: false },
  { min: 4, max: 7, color: "#fbbf24", glow: "rgba(251,191,36,0.55)", label: "4–7 open jobs", radius: 8, hot: false },
  { min: 8, max: 15, color: "#fb923c", glow: "rgba(251,146,60,0.6)", label: "8–15 open jobs", radius: 9.5, hot: false },
  { min: 16, max: Infinity, color: "#ef4444", glow: "rgba(239,68,68,0.65)", label: "16+ open jobs", radius: 11, hot: true },
];

function tierFor(jobCount: number) {
  return TIERS.find((t) => jobCount >= t.min && jobCount <= t.max) ?? TIERS[0];
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function popupHtml(marker: MapMarker) {
  const tier = tierFor(marker.jobCount);
  const companies = marker.companies ?? [];
  const isHub = companies.some((c) => c.relationshipType === "hub" || c.relationshipType === "cargo_hub");
  const typeLabel = airportTypeLabel(marker.airportType);
  const companiesHtml = companies.length
    ? `<ul style="margin:6px 0 0;padding:0;list-style:none;font-size:12px;color:#475569">
        ${companies
          .map(
            (c) =>
              `<li style="margin-top:2px">${escapeHtml(c.name)} <span style="color:#94a3b8">— ${
                RELATIONSHIP_LABELS[c.relationshipType] ?? c.relationshipType
              }</span></li>`
          )
          .join("")}
      </ul>`
    : `<p style="margin:6px 0 0;font-size:12px;color:#94a3b8">No listed carriers yet</p>`;

  return `
    <div style="min-width:200px;font-family:inherit">
      <a href="${escapeHtml(marker.href)}" style="font-weight:600;color:#0f172a;text-decoration:none;font-size:13px;outline:none">
        ${escapeHtml(marker.name)} (${escapeHtml(marker.code)})
      </a>
      ${
        typeLabel
          ? `<span style="display:inline-block;margin-top:4px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.02em;color:#64748b;background:#f1f5f9;border-radius:4px;padding:1px 6px">${escapeHtml(
              typeLabel
            )}</span>`
          : ""
      }
      <div style="font-size:12px;color:#64748b;margin-top:5px;display:flex;align-items:center;gap:5px">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${tier.color};flex-shrink:0"></span>
        <span style="color:${tier.color};font-weight:600">${marker.jobCount} open job${marker.jobCount === 1 ? "" : "s"}</span>
        ${isHub ? '<span style="color:#0f172a;font-weight:600">· Hub</span>' : ""}
      </div>
      ${
        marker.topCareer
          ? `<div style="font-size:12px;color:#475569;margin-top:3px">
              Most in-demand: <strong>${escapeHtml(marker.topCareer.name)}</strong> (${marker.topCareer.count})
            </div>`
          : ""
      }
      ${companiesHtml}
    </div>
  `;
}

function ensurePulseKeyframes() {
  if (document.getElementById("airport-map-pulse-keyframes")) return;
  const style = document.createElement("style");
  style.id = "airport-map-pulse-keyframes";
  style.textContent = `
    @keyframes airport-marker-pulse {
      0% { transform: scale(0.6); opacity: 0.75; }
      100% { transform: scale(2.4); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

function buildMarkerElement(jobCount: number) {
  const tier = tierFor(jobCount);
  const size = tier.radius * 2;
  const el = document.createElement("div");
  // mapboxgl.Marker positions its element with an absolute-positioned
  // transform anchored at (0,0) in the canvas container. Setting this to
  // position:relative kept the element in normal document flow *in
  // addition* to that transform, so each marker after the first stacked
  // below the previous ones' natural box height before the transform was
  // even applied -- the more markers on the map, the further off they'd
  // drift from their real lat/lng (this is what showed up as markers
  // sitting in the ocean instead of on their airport).
  el.style.cssText = `position:absolute;width:${size}px;height:${size}px;cursor:pointer;`;

  // Busiest airports get a radar-style pulse ring behind the dot so they
  // draw the eye immediately instead of blending into the rest of the map.
  if (tier.hot) {
    const pulse = document.createElement("div");
    pulse.style.cssText = `position:absolute;inset:0;border-radius:50%;background:${tier.color};animation:airport-marker-pulse 1.8s ease-out infinite;`;
    el.appendChild(pulse);
  }

  const dot = document.createElement("div");
  dot.style.cssText = `position:absolute;inset:0;border-radius:50%;background:${tier.color};border:2px solid white;box-shadow:0 0 10px ${tier.glow}, 0 1px 3px rgba(0,0,0,0.35);`;
  el.appendChild(dot);

  return el;
}

// Static markers only, no routing/navigation — matches the locked
// decision in docs/screen-by-screen-ui-spec.md. Shared by the homepage
// and the airport directory rather than built twice.
export function AirportMap({ markers, height = 360 }: { markers: MapMarker[]; height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !containerRef.current || markers.length === 0) return;

    ensurePulseKeyframes();

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      // Dark style rather than Streets -- the colored, glowing job-density
      // markers (and the white ring around each one) read far more clearly
      // against a dark basemap than against light streets/parks, and it
      // matches the navy identity used everywhere else on the site.
      style: "mapbox://styles/mapbox/dark-v11",
      center: [markers[0].longitude, markers[0].latitude],
      zoom: markers.length === 1 ? 9 : 3,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    // The Streets style's city-name labels (settlement-major/minor-label)
    // draw a small dot icon next to the text at low zoom, which at a
    // glance reads as another job-density marker. Clearing icon-image
    // drops just the dot and keeps the city name for orientation. The
    // style's own airport-label layer (plane icon + IATA code) is hidden
    // outright since it would otherwise duplicate our own airport markers
    // once zoomed in on one.
    map.on("style.load", () => {
      for (const layerId of ["settlement-major-label", "settlement-minor-label"]) {
        try {
          map.setLayoutProperty(layerId, "icon-image", "");
        } catch {
          // Layer id can vary across style versions -- skip if not found.
        }
      }
      try {
        map.setLayoutProperty("airport-label", "visibility", "none");
      } catch {
        // Same as above -- non-fatal if this layer isn't present.
      }
    });

    const bounds = new mapboxgl.LngLatBounds();
    for (const marker of markers) {
      // Plain div, not a link -- clicking/hovering opens the popup (which
      // has its own link through to the airport page), rather than the
      // marker itself competing with the popup for the click.
      const el = buildMarkerElement(marker.jobCount);

      const popup = new mapboxgl.Popup({ offset: 12, closeButton: false }).setHTML(popupHtml(marker));
      const mapMarker = new mapboxgl.Marker(el).setLngLat([marker.longitude, marker.latitude]).setPopup(popup).addTo(map);

      let hoverTimeout: ReturnType<typeof setTimeout> | null = null;
      el.addEventListener("mouseenter", () => {
        if (hoverTimeout) clearTimeout(hoverTimeout);
        if (!popup.isOpen()) mapMarker.togglePopup();
      });
      el.addEventListener("mouseleave", () => {
        // Small delay so moving the cursor from the dot into the popup
        // (to click the airport link) doesn't immediately close it.
        hoverTimeout = setTimeout(() => {
          if (popup.isOpen()) mapMarker.togglePopup();
        }, 200);
      });
      popup.on("open", () => {
        popup.getElement()?.addEventListener("mouseenter", () => {
          if (hoverTimeout) clearTimeout(hoverTimeout);
        });
        popup.getElement()?.addEventListener("mouseleave", () => {
          if (popup.isOpen()) mapMarker.togglePopup();
        });
      });

      bounds.extend([marker.longitude, marker.latitude]);
    }
    if (markers.length > 1) map.fitBounds(bounds, { padding: 60, maxZoom: 8 });

    // Mapbox sizes its WebGL canvas to the container's dimensions at
    // construction time. If the container's real size changes afterward --
    // a web font (Space Grotesk/Inter) finishing its async load and
    // reflowing the page, a responsive breakpoint, a sidebar toggling --
    // the canvas keeps its stale internal size while the CSS box moves on,
    // so every projected marker drifts further from its true lat/lng the
    // farther it sits from the map's center. This was reported as markers
    // landing in the ocean instead of on the airports they represent.
    // ResizeObserver + map.resize() keeps the canvas in sync whenever that
    // happens, not just once at mount.
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
    };
  }, [markers]);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    // Documented fallback: plain list instead of the map if no token.
    return (
      <div className="border rounded-lg p-4 bg-slate-50">
        <p className="text-sm text-slate-500 mb-3">Map unavailable — showing airports as a list.</p>
        <ul className="space-y-1">
          {markers.map((m) => {
            const tier = tierFor(m.jobCount);
            return (
              <li key={m.id} className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tier.color }} />
                <a href={m.href} className="text-brand-600 hover:underline text-sm hover:text-brand-700 transition-colors">
                  {m.name} ({m.code}) — {m.jobCount} job{m.jobCount === 1 ? "" : "s"}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div>
      <div ref={containerRef} style={{ height }} className="rounded-lg overflow-hidden border" />
      {/* Below the map rather than overlaid on it -- an absolutely
          positioned legend risks sitting right where a popup for a nearby
          marker opens, which reads as broken rather than informational. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 px-1 text-[11px] text-slate-500">
        <span className="font-medium text-slate-700">Hiring activity:</span>
        {TIERS.map((tier) => (
          <span key={tier.label} className="inline-flex items-center gap-1">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: tier.color, boxShadow: `0 0 3px ${tier.glow}` }}
            />
            {tier.label}
          </span>
        ))}
      </div>
    </div>
  );
}
