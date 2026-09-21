/**
 * Shared DocuSign send used by public intake submit and admin Resend/Accept.
 * Populate Van’s Word file, then sendEnvelope (live when DOCUSIGN_ENABLED=true,
 * otherwise a local stub). Never throws past the caller — actions persist first.
 */
import { generatePopulatedAgreement } from "./agreement-populate";
import {
  buildEnvelopeRecipients,
  isDocuSignEnabled,
  sendEnvelope,
  type DocuSignHttp,
} from "./docusign";
import { applyDocuSignSent } from "./engagement";
import type { Engagement } from "./types";

export function shouldSendDocuSignOnSubmit(
  engagement: Pick<Engagement, "signingMethod" | "docusign">,
) {
  return (
    engagement.signingMethod === "docusign" && !engagement.docusign.envelopeId
  );
}

/** Shown when submit saved a send failure and never stored an envelope id. */
export function docusignSendFailureMessage(
  engagement: Pick<Engagement, "signingMethod" | "docusign">,
): string | null {
  if (engagement.signingMethod !== "docusign" || engagement.docusign.envelopeId) {
    return null;
  }
  const message = engagement.docusign.lastMessage?.trim();
  if (!message || !/fail/i.test(message)) {
    return null;
  }
  return message;
}

export function recordDocuSignSendFailure(
  engagement: Engagement,
  message: string,
  source: "intake_submit" | "accept" | "resend",
): Engagement {
  const prefix =
    source === "intake_submit"
      ? "DocuSign send failed after intake submit"
      : source === "accept"
        ? "DocuSign send failed after Accept"
        : "DocuSign resend failed";
  return {
    ...engagement,
    docusign: {
      ...engagement.docusign,
      lastMessage: `${prefix}: ${message}`,
    },
    updatedAt: new Date().toISOString(),
  };
}

export async function sendDocuSignForEngagement(
  engagement: Engagement,
  http?: DocuSignHttp,
): Promise<Engagement> {
  const populated = await generatePopulatedAgreement(engagement);
  const sent = await sendEnvelope(
    {
      engagementId: engagement.id,
      reference: engagement.reference,
      recipients: buildEnvelopeRecipients(engagement.intake),
      document: {
        name: populated.filename,
        bytes: populated.bytes,
        fileExtension: populated.fileExtension,
      },
    },
    http,
  );
  return applyDocuSignSent(
    engagement,
    sent.envelopeId,
    sent.message,
    sent.mode,
    sent.recipients,
  );
}

/** Live vs stub is sendEnvelope’s job; this only answers whether submit should call it. */
export function docusignSubmitWillUseLiveApi() {
  return isDocuSignEnabled();
}
