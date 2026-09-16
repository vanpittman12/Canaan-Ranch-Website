import {
  applyDocuSignCompleted,
  applyDocuSignStatus,
  artifactFromUpload,
} from "./engagement";
import {
  buildLiveSignedFilename,
  downloadLiveCombinedDocument,
  isCompleteEnvelopeStatus,
  normalizeEnvelopeStatus,
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
    const next = applyDocuSignCompleted(
      engagement,
      artifactFromUpload({
        filename: buildLiveSignedFilename(engagement.reference),
        storedName,
        source: "docusign",
        mimeType: "application/pdf",
        sizeBytes: bytes.length,
      }),
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
