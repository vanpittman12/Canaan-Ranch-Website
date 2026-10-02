/** Per-isolate dedupe for unsigned nudges: one DocuSign re-fetch per envelope per window. */
const NUDGE_DEDUPE_MS = 30_000;
const NUDGE_DEDUPE_MAX_ENTRIES = 1000;
const recentNudges = new Map<string, number>();

/** True when this envelope was nudged recently (and records the nudge otherwise). */
export function nudgedRecently(envelopeId: string, now = Date.now()) {
  for (const [id, at] of recentNudges) {
    if (now - at > NUDGE_DEDUPE_MS) {
      recentNudges.delete(id);
    }
  }
  const last = recentNudges.get(envelopeId);
  if (last !== undefined && now - last <= NUDGE_DEDUPE_MS) {
    return true;
  }
  if (recentNudges.size >= NUDGE_DEDUPE_MAX_ENTRIES) {
    recentNudges.clear();
  }
  recentNudges.set(envelopeId, now);
  return false;
}

/** Test hook. */
export function resetNudgeDedupe() {
  recentNudges.clear();
}
