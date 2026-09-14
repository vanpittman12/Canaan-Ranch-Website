import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { brand } from "./brand";
import {
  ALACHUA,
  BASEMAP,
  MAP_FRAME,
  NAUTICAL_MILES_SOUTH,
  SERVICE_AREA_FEATURE,
  SOUTHERN_LIMIT_LAT,
  SOUTHERN_LIMIT_LINE,
  isInServiceArea,
  latitudeToNmSouthOfAlachua,
  nauticalMilesToPixels,
  project,
  serviceAreaBounds,
  serviceAreaCopy,
  serviceAreaOverlayPath,
} from "./service-area";

const landing = readFileSync(path.join(process.cwd(), "app/page.tsx"), "utf8");
const mapModule = readFileSync(path.join(process.cwd(), "components/service-area-map.tsx"), "utf8");
const mapLib = readFileSync(path.join(process.cwd(), "lib/service-area.ts"), "utf8");
const basemap = readFileSync(path.join(process.cwd(), "public/maps/florida-basemap.jpg"));

describe("service area map", () => {
  it("uses Van’s Alachua anchor and ~100 NM southern cutoff", () => {
    expect(ALACHUA).toEqual({ lat: 29.79, lon: -82.5 });
    expect(NAUTICAL_MILES_SOUTH).toBe(100);
    expect(SOUTHERN_LIMIT_LAT).toBe(28.1);
    expect(latitudeToNmSouthOfAlachua(SOUTHERN_LIMIT_LAT)).toBeCloseTo(101.4, 0);
    expect(ALACHUA.lat - NAUTICAL_MILES_SOUTH / 60).toBeCloseTo(28.12, 1);
    expect(serviceAreaCopy.caption).toBe(
      "Service area: north of ~100 NM south of Alachua (incl. panhandle).",
    );
    expect(SERVICE_AREA_FEATURE.properties.southernLimitLat).toBe(28.1);
    expect(SOUTHERN_LIMIT_LINE.west[1]).toBe(SOUTHERN_LIMIT_LAT);
    expect(SOUTHERN_LIMIT_LINE.east[1]).toBe(SOUTHERN_LIMIT_LAT);
    expect(mapModule).toContain("legendAnchor");
    expect(mapModule).toContain("SOUTHERN_LIMIT_LINE");
    expect(mapModule).toContain("MAP_PLACES");
    expect(mapModule).toContain("serviceAreaOverlayPath");
    expect(mapModule).toContain("nauticalMilesToPixels");
    expect(nauticalMilesToPixels(100)).toBeGreaterThan(40);
    expect(mapLib).toContain("Tallahassee");
    expect(mapLib).toContain("Jacksonville");
    expect(mapLib).toContain("Pensacola");
    expect(mapLib).toContain("Orlando");
    expect(mapLib).toContain("Tampa");
    expect(mapLib).toContain("Miami");
    expect(mapLib).toContain("Gainesville");
    expect(mapLib).toContain(serviceAreaCopy.legendService);
    expect(mapLib).toContain(serviceAreaCopy.legendSite);
    expect(mapModule).not.toContain("#7cfc00");
    expect(mapModule).not.toContain("#8fd14f");
  });

  it("embeds a real OpenStreetMap Florida basemap, not a schematic outline", () => {
    expect(landing).toContain("<ServiceAreaMap");
    expect(landing.indexOf("<ProgramOffer")).toBeLessThan(landing.indexOf("<ServiceAreaMap"));
    expect(landing.indexOf("<ServiceAreaMap")).toBeLessThan(landing.indexOf('id="how-it-works"'));
    expect(mapModule).toContain('id="service-area"');
    expect(mapModule).toContain("BASEMAP.src");
    expect(mapModule).toContain("next/image");
    expect(BASEMAP.provider).toBe("OpenStreetMap");
    expect(BASEMAP.src).toBe("/maps/florida-basemap.jpg");
    expect(basemap.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))).toBe(true);
    expect(basemap.byteLength).toBeGreaterThan(80_000);
    expect(mapLib).toContain("/maps/florida-basemap.jpg");
    expect(mapLib).toContain("OpenStreetMap");
    expect(mapLib).not.toContain("floridaOutlinePath");
    expect(mapModule).not.toContain("floridaOutlinePath");
    expect(mapModule).not.toContain("maplibre");
    expect(mapLib).not.toContain("FLORIDA_OUTLINE");
    expect(SERVICE_AREA_FEATURE.geometry.coordinates[0][0].length).toBeGreaterThan(500);
    expect(serviceAreaOverlayPath().startsWith("M")).toBe(true);
    const alachua = project(ALACHUA.lon, ALACHUA.lat);
    expect(alachua.x).toBeGreaterThan(0);
    expect(alachua.x).toBeLessThan(MAP_FRAME.width);
    expect(alachua.y).toBeGreaterThan(0);
    expect(alachua.y).toBeLessThan(MAP_FRAME.height);
    expect(mapLib.toLowerCase()).not.toContain("lykes");
    expect(mapModule.toLowerCase()).not.toContain("lykes");
    expect(JSON.stringify(SERVICE_AREA_FEATURE).toLowerCase()).not.toContain("lykes");
  });

  it("shades Florida north of the cutoff, including the panhandle", () => {
    const bounds = serviceAreaBounds();
    expect(bounds.south).toBeCloseTo(28.1, 3);
    expect(bounds.west).toBeLessThan(-87.4);
    expect(bounds.north).toBeGreaterThan(30.9);
    expect(isInServiceArea(ALACHUA.lat, ALACHUA.lon)).toBe(true);
    expect(isInServiceArea(30.44, -84.28)).toBe(true);
    expect(isInServiceArea(30.42, -87.22)).toBe(true);
    expect(isInServiceArea(28.54, -81.38)).toBe(true);
    expect(isInServiceArea(28.36, -82.2)).toBe(true);
    expect(isInServiceArea(27.95, -82.46)).toBe(false);
    expect(isInServiceArea(25.76, -80.19)).toBe(false);
  });

  it("keeps the slogan, savings module, and What we offer", () => {
    expect(brand.heroSlogan).toBe(
      "Don’t slow your project down - Long Term Tier 1 sites are the best option for the tortoise and therefore FWC’s preferred choice for relocations.",
    );
    expect(landing).toContain("<FwcSavingsModule");
    expect(landing).toContain("<ProgramOffer");
    expect(landing.match(/\{brand\.heroSlogan\}/g)).toHaveLength(1);
  });
});
