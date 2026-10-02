import "server-only";

import { getLiveEnvelopeStatus, isDocuSignEnabled, type DocuSignHttp } from "./docusign";
import { syncLiveEnvelope } from "./docusign-complete";
import { listEngagements } from "./store";
import type { Engagement } from "./types";

/** Envelope states that can still move (not completed / declined / voided). */
const OPEN_ENVELOPE_STATUSES = new Set(["sent", "delivered"]);

/** Max envelopes the 15-minute cron refreshes per run. */
export const POLL_BATCH_LIMIT = 25;

export type RefreshOutcome =
  | { refreshed: true; engagement: Engagement; status: string }
  | { refreshed: false; reason: string };

/** Why an engagement cannot be refreshed from DocuSign, or null when it can. */
export function refreshBlocker(engagement: Engagement): string | null {
  if (engagement.status !== "accepted" && engagement.status !== "executed") {
    return "Envelope status can be refreshed only after accept.";
  }
  if (engagement.signingMethod !== "docusign") {
    return "This engagement is not on the DocuSign path.";
  }
  if (!engagement.docusign.envelopeId) {
    return "No envelope has been sent yet.";
  }
  if (!isDocuSignEnabled() || engagement.docusign.mode !== "live") {
    return "Live envelope polling is available only when DOCUSIGN_ENABLED=true.";
  }
  return null;
}

/**
 * Re-fetch the envelope from the DocuSign API and apply that status. This is
 * the admin Refresh path, shared by the unsigned-webhook nudge and the cron.
 * State only ever changes from DocuSign's own API response.
 */
export async function refreshEngagementFromDocuSign(
  engagement: Engagement,
  http?: DocuSignHttp,
): Promise<RefreshOutcome> {
  const blocker = refreshBlocker(engagement);
  if (blocker) {
    return { refreshed: false, reason: blocker };
  }
  const snapshot = await getLiveEnvelopeStatus(engagement.docusign.envelopeId!, http);
  const next = await syncLiveEnvelope(engagement, snapshot.status, http);
  return { refreshed: true, engagement: next, status: snapshot.status };
}

/** Engagements whose live envelope is still open (sent/delivered). */
export function hasOpenEnvelope(engagement: Engagement) {
  return (
    refreshBlocker(engagement) === null &&
    OPEN_ENVELOPE_STATUSES.has(engagement.docusign.status)
  );
}

export type PollSummary = {
  checked: number;
  open: number;
  refreshed: number;
  changed: number;
  failed: number;
  skippedOverLimit: number;
};

/** Refresh every open envelope, oldest-updated first, capped at `limit`. */
export async function pollOpenEnvelopes(
  limit = POLL_BATCH_LIMIT,
  http?: DocuSignHttp,
): Promise<PollSummary> {
  const all = await listEngagements();
  const open = all
    .filter(hasOpenEnvelope)
    .sort((a, b) => (a.updatedAt ?? "").localeCompare(b.updatedAt ?? ""));
  const batch = open.slice(0, limit);
  const summary: PollSummary = {
    checked: all.length,
    open: open.length,
    refreshed: 0,
    changed: 0,
    failed: 0,
    skippedOverLimit: Math.max(0, open.length - batch.length),
  };
  for (const engagement of batch) {
    try {
      const outcome = await refreshEngagementFromDocuSign(engagement, http);
      if (outcome.refreshed) {
        summary.refreshed += 1;
        if (
          outcome.engagement.docusign.status !== engagement.docusign.status ||
          outcome.engagement.status !== engagement.status
        ) {
          summary.changed += 1;
        }
      }
    } catch (error) {
      summary.failed += 1;
      console.warn(
        `[docusign-poll] refresh failed for ${engagement.reference}`,
        error instanceof Error ? error.message : error,
      );
    }
  }
  return summary;
}
