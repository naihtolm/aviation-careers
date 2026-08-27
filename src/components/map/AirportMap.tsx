"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  href: string;
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
      const el = document.createElement("a");
      el.href = marker.href;
      el.style.cssText =
        "display:block;width:14px;height:14px;border-radius:50%;background:#0f172a;border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,0.15);cursor:pointer;";
      new mapboxgl.Marker(el)
        .setLngLat([marker.longitude, marker.latitude])
        .setPopup(new mapboxgl.Popup({ offset: 12 }).setHTML(`<a href="${marker.href}">${marker.label}</a>`))
        .addTo(map);
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
              <a href={m.href} className="text-blue-600 hover:underline text-sm">
                {m.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return <div ref={containerRef} style={{ height }} className="rounded-lg overflow-hidden border" />;
}
