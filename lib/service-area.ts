/** Alachua, FL (city). 100 NM due south ≈ 1.667° of latitude ≈ 28.12°N. */
export const ALACHUA = { lat: 29.79, lon: -82.5 } as const;
export const NAUTICAL_MILES_SOUTH = 100;
export const SOUTHERN_LIMIT_LAT = 28.1;

export const serviceAreaCopy = {
  heading: "Service area",
  caption: "Service area: north of ~100 NM south of Alachua (incl. panhandle).",
} as const;

export const MAP_FRAME = {
  lonMin: -87.65,
  lonMax: -79.85,
  latMin: 24.45,
  latMax: 31.15,
  width: 720,
  height: 640,
} as const;

/** Original schematic outline (lon, lat), northwest corner then clockwise. */
export const FLORIDA_OUTLINE: ReadonlyArray<readonly [number, number]> = [
  [-87.52, 30.28],
  [-87.52, 31.0],
  [-85.0, 31.0],
  [-85.0, 30.7],
  [-84.45, 30.58],
  [-83.85, 30.68],
  [-83.2, 30.6],
  [-82.55, 30.55],
  [-82.05, 30.58],
  [-81.48, 30.72],
  [-81.42, 30.32],
  [-81.38, 29.9],
  [-81.28, 29.45],
  [-81.18, 29.05],
  [-80.95, 28.65],
  [-80.55, 28.42],
  [-80.48, 28.05],
  [-80.38, 27.55],
  [-80.22, 27.1],
  [-80.08, 26.7],
  [-80.05, 26.3],
  [-80.08, 25.85],
  [-80.15, 25.55],
  [-80.45, 25.15],
  [-80.9, 24.85],
  [-81.45, 24.58],
  [-81.8, 24.55],
  [-81.75, 25.85],
  [-81.7, 26.15],
  [-81.82, 26.45],
  [-81.95, 26.75],
  [-82.25, 26.9],
  [-82.5, 27.2],
  [-82.58, 27.5],
  [-82.7, 27.75],
  [-82.85, 27.85],
  [-82.75, 28.15],
  [-82.75, 28.55],
  [-82.8, 28.95],
  [-83.05, 29.15],
  [-83.4, 29.35],
  [-83.75, 29.55],
  [-84.2, 29.75],
  [-84.85, 29.78],
  [-85.35, 29.85],
  [-85.7, 30.05],
  [-85.85, 30.18],
  [-86.2, 30.32],
  [-86.55, 30.38],
  [-87.0, 30.32],
];

export function project(lon: number, lat: number) {
  const { lonMin, lonMax, latMin, latMax, width, height } = MAP_FRAME;
  return {
    x: ((lon - lonMin) / (lonMax - lonMin)) * width,
    y: ((latMax - lat) / (latMax - latMin)) * height,
  };
}

export function latitudeToNmSouthOfAlachua(lat: number) {
  return (ALACHUA.lat - lat) * 60;
}

export function pointsToPath(points: ReadonlyArray<readonly [number, number]>) {
  return `${points
    .map(([lon, lat], index) => {
      const { x, y } = project(lon, lat);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ")} Z`;
}

export const floridaOutlinePath = pointsToPath(FLORIDA_OUTLINE);
