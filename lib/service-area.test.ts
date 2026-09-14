import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { brand } from "./brand";
import {
  ALACHUA,
  NAUTICAL_MILES_SOUTH,
  SOUTHERN_LIMIT_LAT,
  latitudeToNmSouthOfAlachua,
  serviceAreaCopy,
} from "./service-area";

const landing = readFileSync(path.join(process.cwd(), "app/page.tsx"), "utf8");
const mapModule = readFileSync(path.join(process.cwd(), "components/service-area-map.tsx"), "utf8");
const mapLib = readFileSync(path.join(process.cwd(), "lib/service-area.ts"), "utf8");

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
    expect(mapModule).toContain("legendAnchor");
    expect(mapModule).toContain("floridaOutlinePath");
    expect(mapModule).toContain("SOUTHERN_LIMIT_LAT");
    expect(mapModule).toContain("REFERENCE_CITIES");
    expect(mapModule).toContain("nauticalMilesToPixels");
    expect(mapLib).toContain("Tallahassee");
    expect(mapLib).toContain("Jacksonville");
    expect(mapLib).toContain("Orlando");
    expect(mapLib).toContain("Tampa");
    expect(mapLib).toContain("Gainesville");
    expect(mapLib).toContain(serviceAreaCopy.legendService);
    expect(mapLib).toContain(serviceAreaCopy.legendSite);
    expect(mapModule).not.toContain("#7cfc00");
    expect(mapModule).not.toContain("#8fd14f");
  });

  it("is an original schematic on the homepage with no Lykes art", () => {
    expect(landing).toContain("<ServiceAreaMap");
    expect(landing.indexOf("<ProgramOffer")).toBeLessThan(landing.indexOf("<ServiceAreaMap"));
    expect(landing.indexOf("<ServiceAreaMap")).toBeLessThan(landing.indexOf('id="how-it-works"'));
    expect(mapModule).toContain('id="service-area"');
    expect(mapLib.toLowerCase()).not.toContain("lykes");
    expect(mapModule.toLowerCase()).not.toContain("lykes");
    expect(mapLib).not.toContain("http");
    expect(mapModule).not.toContain(".png");
    expect(mapModule).not.toContain(".jpg");
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
