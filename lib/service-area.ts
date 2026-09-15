import serviceAreaFeature from "./florida-service-area.json";
import southOfCutoffFeature from "./florida-south-of-cutoff.json";

/** Alachua, FL (city). 100 NM due south ≈ 1.667° of latitude ≈ 28.12°N. */
export const ALACHUA = { lat: 29.79, lon: -82.5 } as const;
export const NAUTICAL_MILES_SOUTH = 100;
export const SOUTHERN_LIMIT_LAT = 28.1;

export const serviceAreaCopy = {
  heading: "Service area",
  title:
    "Florida north of a line about 100 nautical miles south of Alachua, including the Panhandle.",
  caption: "Shaded land is inside the service area. The dashed line marks the southern limit.",
  mapLabel: "Map of Florida showing the Canaan Preserve service area north of Alachua.",
  legendService: "Service area",
  legendAnchor: "Alachua",
  legendSite: "Canaan Preserve",
  scaleLabel: "Nautical miles",
  attribution: "© OpenStreetMap contributors",
} as const;

/**
 * Real geographic basemap: static OpenStreetMap Mapnik mosaic of Florida
 * (z=8 tiles 65–71 / 104–110, no API key). Geographic bounds are those
 * integer tile edges; the committed JPEG is 1280×1280 for a lighter Worker.
 */
export const BASEMAP = {
  provider: "OpenStreetMap",
  src: "/maps/florida-basemap.jpg",
  attribution: serviceAreaCopy.attribution,
  zoom: 8,
  tileWest: 65,
  tileEast: 72,
  tileNorth: 104,
  tileSouth: 111,
} as const;

/** Pixel-exact Web Mercator frame of `public/maps/florida-basemap.jpg`. */
export const MAP_FRAME = {
  west: -88.59375,
  east: -78.75,
  north: 31.952162238024954,
  south: 23.241346102386128,
  width: 1280,
  height: 1280,
} as const;

/** West/east coast intersections of the 28.1°N cutoff with mainland Florida. */
export const SOUTHERN_LIMIT_LINE = {
  west: [-82.77312, SOUTHERN_LIMIT_LAT],
  east: [-80.568, SOUTHERN_LIMIT_LAT],
} as const;

export const MAP_OVERLAY = {
  fill: "#3f5346",
  fillOpacity: 0.32,
  outside: "#d5cfc3",
  outsideOpacity: 0.22,
  outline: "#24352a",
  cutoff: "#c4a15a",
  cutoffHalo: "#24352a",
  cutoffWidth: 4,
  cutoffHaloWidth: 8,
} as const;

/** Legend sits in the gulf west of north Florida — not at Tampa’s latitude. */
export const MAP_LEGEND = {
  x: 56,
  y: Math.round(MAP_FRAME.height * 0.26),
  width: 228,
  height: 92,
} as const;

export type MapLabelSide = "left" | "right" | "top" | "bottom";
export type MapPlaceKind = "city" | "anchor" | "site";

export type MapPlace = {
  name: string;
  lat: number;
  lon: number;
  labelSide: MapLabelSide;
  kind?: MapPlaceKind;
};

/** Major-city labels with large, high-contrast type on the real basemap. */
export const REFERENCE_CITIES: readonly MapPlace[] = [
  { name: "Pensacola", lat: 30.42, lon: -87.22, labelSide: "bottom" },
  { name: "Tallahassee", lat: 30.44, lon: -84.28, labelSide: "bottom" },
  { name: "Jacksonville", lat: 30.33, lon: -81.66, labelSide: "right" },
  { name: "Alachua", lat: ALACHUA.lat, lon: ALACHUA.lon, labelSide: "right", kind: "anchor" },
  { name: "Gainesville", lat: 29.65, lon: -82.32, labelSide: "right" },
  { name: "Orlando", lat: 28.54, lon: -81.38, labelSide: "right" },
  { name: "Tampa", lat: 27.95, lon: -82.46, labelSide: "bottom" },
  { name: "Miami", lat: 25.76, lon: -80.19, labelSide: "left" },
];

/** Site pin: same latitude as Alachua, slightly west of -82.5. */
export const CANAAN_SITE: MapPlace = {
  name: "Canaan Preserve",
  lat: ALACHUA.lat,
  lon: -82.58,
  labelSide: "top",
  kind: "site",
};

export const MAP_PLACES: readonly MapPlace[] = [...REFERENCE_CITIES, CANAAN_SITE];

export type ServiceAreaFeature = {
  type: "Feature";
  properties: {
    name: string;
    source: string;
    southernLimitLat: number;
  };
  geometry: {
    type: "MultiPolygon";
    coordinates: number[][][][];
  };
};

export const SERVICE_AREA_FEATURE = serviceAreaFeature as ServiceAreaFeature;
export const SOUTH_OF_CUTOFF_FEATURE = southOfCutoffFeature as ServiceAreaFeature;

function mercatorY(lat: number) {
  const radians = (lat * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + radians / 2));
}

export function project(lon: number, lat: number) {
  const { west, east, north, south, width, height } = MAP_FRAME;
  return {
    x: ((lon - west) / (east - west)) * width,
    y: ((mercatorY(north) - mercatorY(lat)) / (mercatorY(north) - mercatorY(south))) * height,
  };
}

export function nauticalMilesToPixels(nm: number) {
  const here = project(ALACHUA.lon, ALACHUA.lat);
  const south = project(ALACHUA.lon, ALACHUA.lat - nm / 60);
  return Math.abs(south.y - here.y);
}

export function latitudeToNmSouthOfAlachua(lat: number) {
  return (ALACHUA.lat - lat) * 60;
}

export function ringToPath(ring: number[][]) {
  return `${ring
    .map(([lon, lat], index) => {
      const { x, y } = project(lon, lat);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ")} Z`;
}

function featureOverlayPath(feature: ServiceAreaFeature) {
  return feature.geometry.coordinates.flatMap((polygon) => polygon.map(ringToPath)).join(" ");
}

export function serviceAreaOverlayPath() {
  return featureOverlayPath(SERVICE_AREA_FEATURE);
}

export function southOfCutoffOverlayPath() {
  return featureOverlayPath(SOUTH_OF_CUTOFF_FEATURE);
}

function pointInRing(point: readonly [number, number], ring: number[][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const denom = yj - yi;
    if (denom === 0) continue;
    const intersects =
      yi > point[1] !== yj > point[1] && point[0] < ((xj - xi) * (point[1] - yi)) / denom + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInPolygon(point: readonly [number, number], polygon: number[][][]) {
  if (!polygon[0] || !pointInRing(point, polygon[0])) return false;
  for (const hole of polygon.slice(1)) {
    if (pointInRing(point, hole)) return false;
  }
  return true;
}

/** True when the point is on Florida land north of the ~28.1°N / 100 NM cutoff. */
export function isInServiceArea(lat: number, lon: number) {
  if (lat < SOUTHERN_LIMIT_LAT) return false;
  const point = [lon, lat] as const;
  return SERVICE_AREA_FEATURE.geometry.coordinates.some((polygon) => pointInPolygon(point, polygon));
}

export function serviceAreaBounds() {
  let west = Infinity;
  let east = -Infinity;
  let south = Infinity;
  let north = -Infinity;
  for (const polygon of SERVICE_AREA_FEATURE.geometry.coordinates) {
    for (const ring of polygon) {
      for (const [lon, lat] of ring) {
        west = Math.min(west, lon);
        east = Math.max(east, lon);
        south = Math.min(south, lat);
        north = Math.max(north, lat);
      }
    }
  }
  return { west, east, south, north };
}

export function labelOffset(place: MapPlace) {
  if (place.kind === "site") {
    return { dx: 0, dy: -22, anchor: "middle" as const };
  }
  const isEmphatic = place.kind === "anchor";
  const step = isEmphatic ? 14 : 11;
  switch (place.labelSide) {
    case "left":
      return { dx: -step, dy: 4, anchor: "end" as const };
    case "right":
      return { dx: step, dy: 4, anchor: "start" as const };
    case "top":
      return { dx: 0, dy: -12, anchor: "middle" as const };
    case "bottom":
      return { dx: 0, dy: 16, anchor: "middle" as const };
  }
}
