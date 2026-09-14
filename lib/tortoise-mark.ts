/**
 * Gopher tortoise mark geometry (Gopherus polyphemus).
 * Side profile, facing right — bold enough to read at 24–40px.
 * Shared by the header lockup and the generated favicon.
 */
export const TORTOISE_VIEWBOX = "0 0 64 64";

/** Unified walking silhouette: shell, head, two legs. */
export const TORTOISE_BODY_PATH =
  "M12.2 35.2C11.6 29.4 15.2 22.6 22.4 18.8C28.2 15.8 36.2 15.2 43.4 17.6C48.8 19.4 52.6 23.6 53.6 28.6C54.8 28.2 56.4 28.4 57.8 29.6C60.4 31.8 60.6 35.8 58.2 38.2C56.4 40 53.6 40.4 51.6 39.2C50.8 40.2 49.4 40.8 47.6 41C48.2 45.6 48.8 49.4 47.6 51.8C46.4 54.2 42.8 54.4 41.8 51.6C41 49.2 41.4 45.6 41.2 42.2L23.6 42.2C23 45.8 22.2 49.2 22.6 51.6C23 54.2 19.4 54.6 18.4 51.8C17.4 49 18.4 45.4 19.2 42C16.2 41.2 13.4 39.4 12.2 35.2Z";

/** Concentric / transverse scutes — engraved lines, not cartoon plating. */
export const TORTOISE_SCUTE_PATHS = [
  "M20.5 27.5C26 22.8 33.5 21.6 41.2 23.8C45.2 25 48.2 27.2 50 29.8",
  "M18.8 33.2C25.4 29.6 33.2 28.6 42.4 31.2C45.8 32.2 48.4 34 50.2 36",
  "M31.6 19.2C31.2 24.4 31.4 30.2 32.2 36.4",
] as const;

export const TORTOISE_EYE = { cx: 55.6, cy: 33.2, r: 1.05 } as const;
