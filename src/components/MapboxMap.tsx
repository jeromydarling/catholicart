import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { listDioceses, DIOCESE_COORDS, artistsByDiocese } from "../data/artist-tags";

const DEFAULT_STYLE = "mapbox://styles/mapbox/light-v11";
const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
const STYLE = (import.meta.env.VITE_MAPBOX_STYLE as string | undefined) ?? DEFAULT_STYLE;

interface SelectedDiocese {
  diocese: string;
  count: number;
  artists: ReturnType<typeof artistsByDiocese>;
}

interface MapboxMapProps {
  className?: string;
  onSelect?: (s: SelectedDiocese | null) => void;
  selectedDiocese?: string | null;
}

export function MapboxMap({ className, onSelect, selectedDiocese }: MapboxMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [tokenMissing, setTokenMissing] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!TOKEN) {
      setTokenMissing(true);
      return;
    }
    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: STYLE,
      center: [-30, 35], // Atlantic, frames Americas + Europe
      zoom: 1.5,
      attributionControl: true,
      cooperativeGestures: true,
      projection: "globe",
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.on("style.load", () => {
      // Subtle atmosphere for the globe view
      try {
        map.setFog({
          color: "rgba(245, 235, 215, 0.95)",
          "high-color": "rgba(196, 168, 122, 0.6)",
          "horizon-blend": 0.05,
          "space-color": "rgba(232, 220, 195, 1)",
          "star-intensity": 0,
        });
      } catch {
        /* style may not support fog */
      }
    });

    map.on("load", () => {
      const dioceses = listDioceses();
      const features = dioceses
        .map((d) => {
          const coords = DIOCESE_COORDS[d.diocese];
          if (!coords) return null;
          return {
            type: "Feature" as const,
            geometry: { type: "Point" as const, coordinates: coords },
            properties: {
              diocese: d.diocese,
              count: d.count,
            },
          };
        })
        .filter((f): f is NonNullable<typeof f> => f !== null);

      map.addSource("dioceses", {
        type: "geojson",
        data: { type: "FeatureCollection", features },
        cluster: true,
        clusterMaxZoom: 5,
        clusterRadius: 38,
      });

      // Cluster bubbles
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "dioceses",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#5e1a26", // burgundy
          "circle-stroke-color": "#f5ebd7",
          "circle-stroke-width": 2,
          "circle-radius": [
            "step",
            ["get", "point_count"],
            18, 5, 22, 10, 28,
          ],
          "circle-opacity": 0.92,
        },
      });
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "dioceses",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 13,
          "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
        },
        paint: {
          "text-color": "#f5ebd7",
        },
      });

      // Single-diocese pins
      map.addLayer({
        id: "diocese-pin",
        type: "circle",
        source: "dioceses",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#b88a2c", // gold
          "circle-stroke-color": "#5e1a26",
          "circle-stroke-width": 2,
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "count"],
            1, 8,
            5, 14,
          ],
          "circle-opacity": 0.95,
        },
      });
      map.addLayer({
        id: "diocese-count",
        type: "symbol",
        source: "dioceses",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "text-field": ["to-string", ["get", "count"]],
          "text-size": 11,
          "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
        },
        paint: {
          "text-color": "#3a1418",
        },
      });

      // Hover state
      map.on("mouseenter", "diocese-pin", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "diocese-pin", () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("mouseenter", "clusters", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "clusters", () => {
        map.getCanvas().style.cursor = "";
      });

      // Click a single pin → notify parent
      map.on("click", "diocese-pin", (e) => {
        const f = e.features?.[0];
        if (!f || !f.properties) return;
        const diocese = f.properties.diocese as string;
        const list = artistsByDiocese(diocese);
        onSelect?.({
          diocese,
          count: list.length,
          artists: list,
        });
        const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
        map.flyTo({ center: coords, zoom: 5.5, duration: 900 });
      });

      // Click a cluster → expand
      map.on("click", "clusters", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const clusterId = f.properties?.cluster_id as number;
        const source = map.getSource("dioceses") as mapboxgl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
          map.easeTo({ center: coords, zoom: zoom ?? 4 });
        });
      });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [onSelect]);

  // External selection sync — fly to it when sidebar selection changes
  useEffect(() => {
    if (!selectedDiocese) return;
    const coords = DIOCESE_COORDS[selectedDiocese];
    if (!coords || !mapRef.current) return;
    mapRef.current.flyTo({ center: coords, zoom: 5.5, duration: 900 });
  }, [selectedDiocese]);

  if (tokenMissing) {
    return (
      <div
        className={
          "rounded-md border border-dashed border-burgundy-500/30 bg-burgundy-500/5 p-6 sm:p-8 text-center " +
          (className ?? "")
        }
      >
        <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-burgundy-500 mb-2">
          Map preview unavailable
        </div>
        <p className="font-serif text-sm text-ink-soft max-w-md mx-auto leading-relaxed">
          Add <code className="font-mono text-xs bg-parchment-100 px-1 py-0.5 rounded">VITE_MAPBOX_TOKEN</code>{" "}
          to your <code className="font-mono text-xs bg-parchment-100 px-1 py-0.5 rounded">.env</code> file to
          render the Mapbox map. Free public tokens at{" "}
          <a
            href="https://account.mapbox.com/access-tokens/"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-burgundy-500"
          >
            account.mapbox.com
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={
        "rounded-md border border-ink/10 overflow-hidden shadow-card " +
        (className ?? "")
      }
    />
  );
}
