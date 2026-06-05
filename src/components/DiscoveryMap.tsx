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
          const el = document.createElement("div");
          el.className = "discovery-pin";
          el.style.cssText = `
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #6e1b1b;
            border: 2px solid #fbf8f1;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: transform 120ms ease;
          `;
          el.title = e.name;
          el.addEventListener("mouseenter", () => (el.style.transform = "scale(1.3)"));
          el.addEventListener("mouseleave", () => (el.style.transform = "scale(1)"));
          el.addEventListener("click", (ev) => {
            ev.stopPropagation();
            onSelect?.(e);
          });

          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([e.lon, e.lat])
            .addTo(map);
          markersRef.current.set(e.id, marker);
        }
      });

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

  // Highlight the selected pin.
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement();
      if (id === selectedId) {
        el.style.background = "#c89a3b";
        el.style.transform = "scale(1.4)";
      } else {
        el.style.background = "#6e1b1b";
        el.style.transform = "scale(1)";
      }
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
