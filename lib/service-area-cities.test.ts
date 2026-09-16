import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SOUTHERN_LIMIT_LAT, isInServiceArea } from "./service-area";
import {
  INTAKE_SOUTHERN_LIMIT_LAT,
  SERVICE_AREA_CITY_ERROR,
  intakeCityInServiceArea,
  intakeCityServiceAreaError,
  normalizeCityName,
  resolveIntakeCity,
} from "./service-area-cities";

describe("intake city service-area gate", () => {
  it("uses the same southern cutoff as the map geofence", () => {
    expect(INTAKE_SOUTHERN_LIMIT_LAT).toBe(SOUTHERN_LIMIT_LAT);
    const tampa = resolveIntakeCity("Tampa");
    const alachua = resolveIntakeCity("Alachua");
    const gainesville = resolveIntakeCity("Gainesville");
    expect(tampa).toBeTruthy();
    expect(alachua).toBeTruthy();
    expect(gainesville).toBeTruthy();
    if (!tampa || !alachua || !gainesville) {
      return;
    }
    expect(isInServiceArea(tampa.lat, tampa.lon)).toBe(false);
    expect(isInServiceArea(alachua.lat, alachua.lon)).toBe(true);
    expect(isInServiceArea(gainesville.lat, gainesville.lon)).toBe(true);
  });

  it("blocks Tampa and other south cities, and passes Alachua and Gainesville", () => {
    expect(intakeCityInServiceArea("Tampa")).toBe(false);
    expect(intakeCityInServiceArea("tampa")).toBe(false);
    expect(intakeCityInServiceArea("South Tampa")).toBe(false);
    expect(intakeCityInServiceArea("Miami")).toBe(false);
    expect(intakeCityInServiceArea("Fort Lauderdale")).toBe(false);
    expect(intakeCityServiceAreaError("Tampa")).toBe(SERVICE_AREA_CITY_ERROR);

    expect(intakeCityInServiceArea("Alachua")).toBe(true);
    expect(intakeCityInServiceArea("alachua")).toBe(true);
    expect(intakeCityInServiceArea("Gainesville")).toBe(true);
    expect(intakeCityInServiceArea("gainesville")).toBe(true);
    expect(intakeCityServiceAreaError("Alachua")).toBeUndefined();
    expect(intakeCityServiceAreaError("Gainesville")).toBeUndefined();
  });

  it("normalizes punctuation and leaves unknown towns fail-open", () => {
    expect(normalizeCityName("Tampa, FL")).toBe("tampa");
    expect(intakeCityInServiceArea("Tampa, FL")).toBe(false);
    expect(intakeCityInServiceArea("High Springs")).toBeNull();
    expect(intakeCityServiceAreaError("High Springs")).toBeUndefined();
  });

  it("keeps the wizard gate free of the map GeoJSON", () => {
    const cities = readFileSync(path.join(process.cwd(), "lib/service-area-cities.ts"), "utf8");
    const steps = readFileSync(path.join(process.cwd(), "lib/intake-steps.ts"), "utf8");
    expect(cities).not.toContain("florida-service-area.json");
    expect(cities).not.toContain("from \"./service-area\"");
    expect(steps).toContain("from \"./service-area-cities\"");
    expect(steps).not.toContain("from \"./service-area\"");
  });
});
