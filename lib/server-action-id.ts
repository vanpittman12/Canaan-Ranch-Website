/**
 * Next.js server-action / server-reference IDs are fixed-length (42) hex-ish
 * tokens. Used by the Worker entry to reject malformed `next-action` headers
 * before OpenNext/Next throws an empty-message observability warning.
 */
export function isPlausibleServerActionId(id: string): boolean {
  return id.length === 42;
}
