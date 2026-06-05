import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { loadConfig } from "../lib/config";
import { DIRECTORY_ENTRIES, type DirectoryEntry } from "../data/discovery-directory";

const DEFAULT_STYLE = "mapbox://styles/mapbox/light-v11";

interface Props {
  className?: string;
  onSelect?: (e: DirectoryEntry | null) => void;
  selectedId?: string | null;
}

// Mapbox-backed map of the researched discovery directory. Each pin
// is a real, publicly-researched Catholic sacred artist or
// religious-order workshop — explicitly NOT a Locavit member.

export function DiscoveryMap({ className, onSelect, selectedId }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [tokenMissing, setTokenMissing] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    loadConfig().then((cfg) => {
      if (cancelled || !containerRef.current) return;
      if (!cfg.mapbox_token) {
        setTokenMissing(true);
        return;
      }
      mapboxgl.accessToken = cfg.mapbox_token;
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: cfg.mapbox_style || DEFAULT_STYLE,
        center: [0, 30],
        zoom: 1.4,
        attributionControl: true,
        cooperativeGestures: true,
        projection: "globe",
      });
      mapRef.current = map;
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

      map.on("style.load", () => {
        try {
          map.setFog({
            color: "rgba(245, 235, 215, 0.95)",
            "high-color": "rgba(196, 168, 122, 0.6)",
            "horizon-blend": 0.05,
            "space-color": "rgba(232, 220, 195, 1)",
            "star-intensity": 0,
          });
        } catch {
          /* ignore */
        }
      });

      map.on("load", () => {
        for (const e of DIRECTORY_ENTRIES) {
          if (e.lat === null || e.lon === null) continue;
          // The root element is positioned by Mapbox via `transform:
          // translate(...)`. We must NOT write to its transform —
          // doing so clobbers Mapbox's positioning and the pin
          // "scatters." All visual effects live on the inner dot.
          const root = document.createElement("div");
          root.style.cssText = `
            width: 14px;
            height: 14px;
            cursor: pointer;
          `;
          const dot = document.createElement("div");
          dot.className = "discovery-pin-dot";
          dot.dataset.entryId = e.id;
          dot.style.cssText = `
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: #6e1b1b;
            border: 2px solid #fbf8f1;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            transition: transform 120ms ease, background-color 120ms ease;
            transform-origin: center center;
          `;
          root.appendChild(dot);
          root.title = e.name;
          root.addEventListener("mouseenter", () => {
            dot.style.transform = "scale(1.3)";
          });
          root.addEventListener("mouseleave", () => {
            if (dot.dataset.selected !== "true") {
              dot.style.transform = "scale(1)";
            }
          });
          // Single shared handler that fires for tap and click. We
          // stop propagation so the map's background click handler
          // doesn't immediately clear the selection.
          const handleSelect = (ev: Event) => {
            ev.stopPropagation();
            onSelect?.(e);
          };
          root.addEventListener("click", handleSelect);

          const marker = new mapboxgl.Marker({ element: root })
            .setLngLat([e.lon, e.lat])
            .addTo(map);
          markersRef.current.set(e.id, marker);
        }
      });

      // Background click on the map (canvas) clears the selection.
      map.on("click", () => onSelect?.(null));
    });

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Highlight the selected pin. We target the inner `.discovery-pin-dot`
  // so Mapbox's positioning transform on the marker root is preserved.
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const root = marker.getElement();
      const dot = root.querySelector<HTMLDivElement>(".discovery-pin-dot");
      if (!dot) return;
      const selected = id === selectedId;
      dot.dataset.selected = String(selected);
      dot.style.background = selected ? "#c89a3b" : "#6e1b1b";
      dot.style.transform = selected ? "scale(1.4)" : "scale(1)";
    });
  }, [selectedId]);

  if (tokenMissing) {
    return (
      <div className={className}>
        <div className="h-full grid place-items-center bg-parchment-100 rounded-md border border-ink/10 text-center p-8">
          <div>
            <div className="font-display text-lg text-ink">Map unavailable</div>
            <p className="mt-2 font-serif text-sm text-ink-muted">
              Mapbox isn't configured for this environment. The
              directory list below is fully browseable.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
}
