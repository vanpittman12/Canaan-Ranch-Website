/**
 * Accept + DocuSign send. Persist Accept first so a populate/CPU failure
 * cannot leave the engagement stuck in pending_review.
 */
import { generatePopulatedAgreement } from "./agreement-populate";
import { MAX_POPULATED_AGREEMENT_BYTES } from "./docx-zip";
import {
  applyDocuSignSent,
  applyDocuSignStatus,
  applyReview,
  shouldSendEnvelopeAfterAccept,
} from "./engagement";
import {
  buildEnvelopeRecipients,
  sendEnvelope,
  type DocuSignSendResult,
} from "./docusign";
import type { Engagement, ReviewDecision } from "./types";

export type EnvelopeDeps = {
  populate?: typeof generatePopulatedAgreement;
  send?: typeof sendEnvelope;
};

export { canRetryDocuSignSend, shouldSendEnvelopeAfterAccept } from "./engagement";

export async function sendPopulatedEnvelope(
  engagement: Engagement,
  deps: EnvelopeDeps = {},
): Promise<Engagement> {
  const populate = deps.populate ?? generatePopulatedAgreement;
  const send = deps.send ?? sendEnvelope;
  const populated = await populate(engagement);
  if (populated.bytes.byteLength > MAX_POPULATED_AGREEMENT_BYTES) {
    throw new Error(
      `Populated agreement is ${populated.bytes.byteLength} bytes; exceeds the ${MAX_POPULATED_AGREEMENT_BYTES}-byte Worker guard.`,
    );
  }
  const sent: DocuSignSendResult = await send({
    engagementId: engagement.id,
    reference: engagement.reference,
    recipients: buildEnvelopeRecipients(engagement.intake),
    document: {
      name: populated.filename,
      bytes: populated.bytes,
      fileExtension: populated.fileExtension,
    },
  });
  return applyDocuSignSent(
    engagement,
    sent.envelopeId,
    sent.message,
    sent.mode,
    sent.recipients,
  );
}

export async function applyReviewAndSendEnvelope(
  engagement: Engagement,
  decision: ReviewDecision,
  note: string,
  save: (next: Engagement) => Promise<unknown>,
  deps: EnvelopeDeps = {},
): Promise<{ engagement: Engagement; error?: string }> {
  let next = applyReview(engagement, decision, note);
  if (!shouldSendEnvelopeAfterAccept(next)) {
    await save(next);
    return { engagement: next };
  }

  await save(next);

  try {
    next = await sendPopulatedEnvelope(next, deps);
    await save(next);
    return { engagement: next };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to send the DocuSign envelope.";
    next = applyDocuSignStatus(
      next,
      "not_sent",
      `Accepted. DocuSign was not sent: ${message}`,
    );
    await save(next);
    return {
      engagement: next,
      error: next.docusign.lastMessage ?? message,
    };
  }
}
