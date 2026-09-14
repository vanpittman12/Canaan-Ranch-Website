/**
 * Longleaf pine + wiregrass mark.
 * Stroke-led and spare: one trunk, an open high crown of needles, a few grass blades.
 * Built to read at 24–40px in the header and as a favicon — not a cartoon, seal, or scene.
 */
export const PINE_VIEWBOX = "0 0 64 64";

export const PINE_TRUNK_PATH = "M32 16 V46";

export const PINE_NEEDLE_PATHS = [
  "M32 17 L32 5",
  "M32 17 L21 8",
  "M32 17 L43 8",
  "M32 17 L14 18",
  "M32 17 L50 18",
  "M32 24 L20 16",
  "M32 24 L44 16",
] as const;

export const WIREGRASS_PATHS = [
  "M20 52 C18 43 16 36 18 30",
  "M26 52 C24 41 22 33 24 27",
  "M38 52 C40 41 42 33 44 27",
  "M44 52 C46 43 50 37 52 31",
] as const;

export const PINE_CROWN_NODE = { cx: 32, cy: 17, r: 1.7 } as const;

export const GROUND_LINE_PATH = "M16 52 H48";
