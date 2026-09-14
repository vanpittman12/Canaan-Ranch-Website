import {
  applyDocuSignCompleted,
  applyDocuSignStatus,
  artifactFromUpload,
} from "./engagement";
import {
  buildLiveSignedFilename,
  downloadLiveCombinedDocument,
  getLiveEnvelopeStatus,
  isCompleteEnvelopeStatus,
  normalizeEnvelopeStatus,
  resolveSignedAt,
  type DocuSignHttp,
} from "./docusign";
import { persistExecutedAgreement } from "./executed-agreement";
import { persistReservationLetter } from "./reservation-letter-persist";
import { putUpload, saveEngagement } from "./store";
import type { Engagement } from "./types";

export async function syncLiveEnvelope(
  engagement: Engagement,
  status: string | null | undefined,
  http?: DocuSignHttp,
  signedAt?: string | null,
): Promise<Engagement> {
  if (!engagement.docusign.envelopeId) {
    return engagement;
  }

  if (isCompleteEnvelopeStatus(status)) {
    if (engagement.status !== "accepted" && engagement.status !== "executed") {
      return engagement;
    }
    if (engagement.docusign.status === "completed" && engagement.signedArtifact) {
      return engagement;
    }
    const bytes = await downloadLiveCombinedDocument(engagement.docusign.envelopeId, http);
    const storedName = `${engagement.id}-signed.pdf`;
    await putUpload(storedName, bytes);
    const fromEnvelope = signedAt ?? (await buyerSignedAtFromEnvelope(engagement.docusign.envelopeId, http));
    const next = applyDocuSignCompleted(
      engagement,
      artifactFromUpload({
        filename: buildLiveSignedFilename(engagement.reference),
        storedName,
        source: "docusign",
        mimeType: "application/pdf",
        sizeBytes: bytes.length,
      }),
      undefined,
      fromEnvelope,
    );
    await persistExecutedAgreement(next);
    const withLetter = await persistReservationLetter(next, "seller_sign");
    return saveEngagement(withLetter);
  }

  const mapped = normalizeEnvelopeStatus(status);
  if (mapped && mapped !== engagement.docusign.status) {
    return saveEngagement(
      applyDocuSignStatus(engagement, mapped, `DocuSign envelope status: ${status}.`),
    );
  }

  return engagement;
}

async function buyerSignedAtFromEnvelope(envelopeId: string, http?: DocuSignHttp) {
  try {
    const snapshot = await getLiveEnvelopeStatus(envelopeId, http);
    return resolveSignedAt(snapshot.buyerSignedDateTime, snapshot.completedDateTime);
  } catch {
    return undefined;
  }
}
