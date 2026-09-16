/**
 * Intake City gate. Known Florida cities are in or out by the same ~28.1°N
 * cutoff the map uses (100 NM south of Alachua). This module must not import
 * GeoJSON — intake-steps runs in the client wizard.
 *
 * Unknown city names fail open so small in-area towns are not locked out.
 * Known south-of-cutoff cities (Tampa, Miami, …) hard-block Continue.
 */
export const INTAKE_SOUTHERN_LIMIT_LAT = 28.1;

export const SERVICE_AREA_CITY_ERROR =
  "This city is outside the service area. Canaan Preserve serves Florida north of a line about 100 nautical miles south of Alachua, including the Panhandle.";

type CityRecord = {
  names: readonly string[];
  lat: number;
  lon: number;
};

/**
 * Coordinates match the map pins where the city is labeled there.
 * Extra metros cover typical south-Florida / panhandle / north-central names.
 */
const INTAKE_CITIES: readonly CityRecord[] = [
  { names: ["pensacola"], lat: 30.42, lon: -87.22 },
  { names: ["tallahassee"], lat: 30.44, lon: -84.28 },
  { names: ["jacksonville"], lat: 30.33, lon: -81.66 },
  { names: ["alachua"], lat: 29.79, lon: -82.5 },
  { names: ["gainesville"], lat: 29.65, lon: -82.32 },
  { names: ["orlando"], lat: 28.54, lon: -81.38 },
  { names: ["tampa"], lat: 27.95, lon: -82.46 },
  { names: ["miami"], lat: 25.76, lon: -80.19 },
  { names: ["ocala"], lat: 29.19, lon: -82.14 },
  { names: ["lake city"], lat: 30.19, lon: -82.64 },
  { names: ["st augustine", "saint augustine"], lat: 29.89, lon: -81.31 },
  { names: ["panama city"], lat: 30.16, lon: -85.66 },
  { names: ["fort walton beach", "ft walton beach"], lat: 30.42, lon: -86.62 },
  { names: ["daytona beach"], lat: 29.21, lon: -81.02 },
  { names: ["kissimmee"], lat: 28.29, lon: -81.41 },
  { names: ["brooksville"], lat: 28.55, lon: -82.39 },
  { names: ["the villages"], lat: 28.93, lon: -82.0 },
  { names: ["st petersburg", "saint petersburg", "st pete"], lat: 27.77, lon: -82.64 },
  { names: ["clearwater"], lat: 27.97, lon: -82.8 },
  { names: ["bradenton"], lat: 27.5, lon: -82.57 },
  { names: ["sarasota"], lat: 27.34, lon: -82.53 },
  { names: ["fort myers", "ft myers"], lat: 26.64, lon: -81.87 },
  { names: ["cape coral"], lat: 26.56, lon: -81.95 },
  { names: ["naples"], lat: 26.14, lon: -81.79 },
  { names: ["miami beach"], lat: 25.79, lon: -80.13 },
  { names: ["fort lauderdale", "ft lauderdale"], lat: 26.12, lon: -80.14 },
  { names: ["hollywood"], lat: 26.01, lon: -80.15 },
  { names: ["west palm beach"], lat: 26.72, lon: -80.05 },
  { names: ["boca raton"], lat: 26.37, lon: -80.1 },
  { names: ["key west"], lat: 24.56, lon: -81.78 },
  { names: ["lakeland"], lat: 28.04, lon: -81.95 },
  { names: ["port st lucie", "port saint lucie"], lat: 27.27, lon: -80.36 },
  { names: ["fort pierce", "ft pierce"], lat: 27.45, lon: -80.33 },
  { names: ["vero beach"], lat: 27.64, lon: -80.4 },
  { names: ["brandon"], lat: 27.94, lon: -82.29 },
];

const CITY_BY_NAME = new Map<string, CityRecord>();
for (const city of INTAKE_CITIES) {
  for (const name of city.names) {
    CITY_BY_NAME.set(name, city);
  }
}

const CITY_NAMES_LONGEST_FIRST = [...CITY_BY_NAME.keys()].sort((a, b) => b.length - a.length);

export function normalizeCityName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.’']/g, "")
    .replace(/[.,]/g, " ")
    .replace(/\b(fl|florida|usa|united states)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function resolveIntakeCity(value: string) {
  const key = normalizeCityName(value);
  if (!key) {
    return undefined;
  }
  const exact = CITY_BY_NAME.get(key);
  if (exact) {
    return exact;
  }
  for (const name of CITY_NAMES_LONGEST_FIRST) {
    const pattern = name.includes(" ")
      ? name
      : new RegExp(`(?:^|\\s)${name}(?:\\s|$)`);
    if (typeof pattern === "string" ? key.includes(pattern) : pattern.test(key)) {
      return CITY_BY_NAME.get(name);
    }
  }
  return undefined;
}

/** `true` in-area, `false` out-of-area, `null` unknown (fail open). */
export function intakeCityInServiceArea(value: string): boolean | null {
  const city = resolveIntakeCity(value);
  if (!city) {
    return null;
  }
  return city.lat >= INTAKE_SOUTHERN_LIMIT_LAT;
}

export function intakeCityServiceAreaError(value: string) {
  return intakeCityInServiceArea(value) === false ? SERVICE_AREA_CITY_ERROR : undefined;
}
