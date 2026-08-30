"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

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
  companies?: { name: string; relationshipType: string }[];
  href: string;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function popupHtml(marker: MapMarker) {
  const companies = marker.companies ?? [];
  const isHub = companies.some((c) => c.relationshipType === "hub" || c.relationshipType === "cargo_hub");
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
    <div style="min-width:190px;font-family:inherit">
      <a href="${escapeHtml(marker.href)}" style="font-weight:600;color:#0f172a;text-decoration:none;font-size:13px">
        ${escapeHtml(marker.name)} (${escapeHtml(marker.code)})
      </a>
      <div style="font-size:12px;color:#64748b;margin-top:3px">
        ${marker.jobCount} open job${marker.jobCount === 1 ? "" : "s"}${isHub ? ' <span style="color:#0f172a;font-weight:600">· Hub</span>' : ""}
      </div>
      ${companiesHtml}
    </div>
  `;
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

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [markers[0].longitude, markers[0].latitude],
      zoom: markers.length === 1 ? 9 : 3,
    });
    mapRef.current = map;

    const bounds = new mapboxgl.LngLatBounds();
    for (const marker of markers) {
      // Plain div, not a link -- clicking/hovering opens the popup (which
      // has its own link through to the airport page), rather than the
      // marker itself competing with the popup for the click.
      const el = document.createElement("div");
      el.style.cssText =
        "width:14px;height:14px;border-radius:50%;background:#0f172a;border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,0.15);cursor:pointer;";

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

    return () => map.remove();
  }, [markers]);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    // Documented fallback: plain list instead of the map if no token.
    return (
      <div className="border rounded-lg p-4 bg-slate-50">
        <p className="text-sm text-slate-500 mb-3">Map unavailable — showing airports as a list.</p>
        <ul className="space-y-1">
          {markers.map((m) => (
            <li key={m.id}>
              <a href={m.href} className="text-brand-600 hover:underline text-sm">
                {m.name} ({m.code}) — {m.jobCount} job{m.jobCount === 1 ? "" : "s"}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return <div ref={containerRef} style={{ height }} className="rounded-lg overflow-hidden border" />;
}
