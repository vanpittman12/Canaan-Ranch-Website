/**
 * Gopher tortoise mark (Gopherus polyphemus).
 * Engraved side profile — oblong carapace, shovel head, columnar digging legs.
 * Stroke-led so it reads as a stewardship seal at 24–40px, not a filled emoji.
 */
export const TORTOISE_VIEWBOX = "0 0 64 64";

export const TORTOISE_SHELL_PATH =
  "M9.5 34.8C9.8 26.4 17.6 19.2 30.2 18C41.6 16.8 50 21.2 52.2 28.6C53.2 31.8 52.2 34.8 49 36.6C44.8 38.8 17.6 39 12.4 37.2C10.6 36.6 9.4 35.8 9.5 34.8Z";

export const TORTOISE_HEAD_PATH =
  "M50.4 28.2C54.8 26.2 60.6 27.6 62 31.6C63.2 35.2 60.6 38.8 56.2 39.2C53.2 39.4 51.2 37.4 50.2 35C49.6 33.2 49.6 30.6 50.4 28.2Z";

export const TORTOISE_FORELEG_PATH = "M41.2 37.2C42.4 42.6 43.6 48.2 43.2 52";
export const TORTOISE_HINDLEG_PATH = "M19.4 37.6C18 43 16.6 48.4 17.2 52";

export const TORTOISE_TAIL_PATH = "M10 35.4C8.2 36.4 7 37.8 6.6 39.4";

export const TORTOISE_SCUTE_PATHS = [
  "M16.4 28.6C24 23.4 33.8 22.2 44.6 25C47.8 26 50.2 27.6 51.6 29.6",
  "M14.2 33.6C23.2 30.6 34 30 45.6 32.8C48.2 33.6 50 34.8 51.2 36",
  "M23.8 20.6C23.4 25.8 23.6 31.2 24.4 36.8",
  "M32.6 18.8C32.2 25 32.4 31 33.2 37.2",
  "M41.2 20.6C41 26 41.4 31.4 42.4 36.6",
] as const;

export const TORTOISE_SCALE_PATHS = ["M40.4 43.2H44", "M40.2 47.6H44.2", "M17.2 43.6H20.8", "M16.6 47.8H20.6"] as const;

export const TORTOISE_EYE = { cx: 57.4, cy: 32.2, r: 1.15 } as const;
