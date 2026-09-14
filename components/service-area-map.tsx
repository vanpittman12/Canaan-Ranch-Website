"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  BASEMAP,
  FLORIDA_BOUNDS,
  MAP_OVERLAY,
  MAP_PLACES,
  SERVICE_AREA_FEATURE,
  SOUTHERN_LIMIT_LINE,
  serviceAreaCopy,
  type MapPlace,
} from "@/lib/service-area";

function markerClassName(place: MapPlace) {
  const kind = place.kind ?? "city";
  return `sa-map-marker sa-map-marker-${kind} sa-map-marker-${place.labelSide}`;
}

function createPlaceMarker(
  MarkerCtor: typeof import("maplibre-gl").Marker,
  place: MapPlace,
  map: MapLibreMap,
) {
  const el = document.createElement("div");
  el.className = markerClassName(place);
  el.innerHTML = `<span class="sa-map-marker-dot" aria-hidden="true"></span><span class="sa-map-marker-label">${place.name}</span>`;
  return new MarkerCtor({ element: el, anchor: "center" }).setLngLat([place.lon, place.lat]).addTo(map);
}

export function ServiceAreaMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;
    let map: MapLibreMap | undefined;
    const markers: Marker[] = [];

    async function mount() {
      const maplibregl = await import("maplibre-gl");
      if (cancelled || !containerRef.current) return;

      const instance = new maplibregl.Map({
        container: containerRef.current,
        style: BASEMAP.styleUrl,
        bounds: [
          [FLORIDA_BOUNDS.west, FLORIDA_BOUNDS.south],
          [FLORIDA_BOUNDS.east, FLORIDA_BOUNDS.north],
        ],
        fitBoundsOptions: { padding: 28, duration: 0 },
        attributionControl: { compact: true },
        scrollZoom: false,
        dragRotate: false,
        touchPitch: false,
        pitchWithRotate: false,
      });
      map = instance;

      instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      instance.addControl(new maplibregl.ScaleControl({ maxWidth: 140, unit: "nautical" }), "bottom-right");

      instance.on("error", () => {
        if (!cancelled && !instance.loaded()) setStatus("error");
      });

      instance.on("load", () => {
        if (cancelled) return;

        for (const layer of instance.getStyle().layers ?? []) {
          if (layer.type === "symbol") {
            instance.setLayoutProperty(layer.id, "visibility", "none");
          }
        }

        instance.addSource("canaan-service-area", {
          type: "geojson",
          data: SERVICE_AREA_FEATURE,
        });
        instance.addLayer({
          id: "canaan-service-area-fill",
          type: "fill",
          source: "canaan-service-area",
          paint: {
            "fill-color": MAP_OVERLAY.fill,
            "fill-opacity": MAP_OVERLAY.fillOpacity,
          },
        });
        instance.addLayer({
          id: "canaan-service-area-outline",
          type: "line",
          source: "canaan-service-area",
          paint: {
            "line-color": MAP_OVERLAY.outline,
            "line-width": 1.15,
            "line-opacity": 0.7,
          },
        });
        instance.addSource("canaan-southern-limit", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [
                [...SOUTHERN_LIMIT_LINE.west],
                [...SOUTHERN_LIMIT_LINE.east],
              ],
            },
          },
        });
        instance.addLayer({
          id: "canaan-southern-limit",
          type: "line",
          source: "canaan-southern-limit",
          paint: {
            "line-color": MAP_OVERLAY.cutoff,
            "line-width": 2,
            "line-dasharray": [2.2, 1.6],
          },
        });

        for (const place of MAP_PLACES) {
          markers.push(createPlaceMarker(maplibregl.Marker, place, instance));
        }

        setStatus("ready");
      });
    }

    mount().catch(() => {
      if (!cancelled) setStatus("error");
    });

    return () => {
      cancelled = true;
      for (const marker of markers) marker.remove();
      map?.remove();
    };
  }, []);

  return (
    <section id="service-area" className="border-b border-line bg-paper">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brass">
          {serviceAreaCopy.heading}
        </p>
        <h2 className="type-h2 mt-3 max-w-3xl text-forest">{serviceAreaCopy.caption}</h2>
        <figure className="mt-10 overflow-hidden rounded-[16px] border border-line bg-[#e7eee6]">
          <div className="relative">
            <div
              ref={containerRef}
              role="img"
              aria-label={serviceAreaCopy.caption}
              className="sa-basemap h-[min(78vw,40rem)] w-full"
            />
            {status !== "ready" ? (
              <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted">
                {status === "error" ? "The Florida map could not load." : serviceAreaCopy.loading}
              </p>
            ) : null}
            <div className="pointer-events-none absolute bottom-3 left-3 max-w-[16rem] rounded-[12px] border border-line bg-paper/95 px-3 py-3 text-[13px] leading-5 text-ink shadow-sm">
              <p className="flex items-center gap-2">
                <span className="inline-block h-3 w-4 rounded-[2px] bg-[#3f5346]" aria-hidden="true" />
                {serviceAreaCopy.legendService}
              </p>
              <p className="mt-1.5 flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full border border-forest bg-brass" aria-hidden="true" />
                {serviceAreaCopy.legendAnchor}
              </p>
              <p className="mt-1.5 flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rotate-45 bg-forest"
                  aria-hidden="true"
                />
                {serviceAreaCopy.legendSite}
              </p>
            </div>
          </div>
          <figcaption className="border-t border-line bg-paper px-4 py-3 text-sm leading-6 text-muted sm:px-5">
            {serviceAreaCopy.caption}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
