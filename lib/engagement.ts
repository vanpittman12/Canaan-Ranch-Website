import { dateOnly } from "./money";
import type {
  ArtifactSource,
  Engagement,
  EngagementStatus,
  ReviewDecision,
  SignedArtifact,
  SigningMethod,
} from "./types";

function stampEffectiveDate(engagement: Engagement, when: string) {
  return engagement.effectiveDate ?? dateOnly(when);
}

export class EngagementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EngagementError";
  }
}

export function canCustomerEdit(status: EngagementStatus) {
  return status === "draft" || status === "changes_requested";
}

export function canSubmitForReview(status: EngagementStatus) {
  return status === "draft" || status === "changes_requested";
}

export function canReview(status: EngagementStatus) {
  return status === "pending_review";
}

export function isClosed(status: EngagementStatus) {
  return status === "executed";
}

export function nextStatusAfterAccept(hasSignedArtifact: boolean): EngagementStatus {
  return hasSignedArtifact ? "executed" : "accepted";
}

export function applySubmit(
  engagement: Engagement,
  signingMethod: SigningMethod,
): Engagement {
  if (!canSubmitForReview(engagement.status)) {
    throw new EngagementError(
      "This engagement cannot be submitted in its current status.",
    );
  }

  const now = new Date().toISOString();
  return {
    ...engagement,
    signingMethod,
    status: "pending_review",
    submittedAt: now,
    updatedAt: now,
    changeRequestNote:
      engagement.status === "changes_requested"
        ? engagement.changeRequestNote
        : null,
  };
}

export function applyReview(
  engagement: Engagement,
  decision: ReviewDecision,
  note: string,
  reviewer = "Canaan Preserve team",
): Engagement {
  if (!canReview(engagement.status)) {
    throw new EngagementError(
      "Only engagements pending review can receive a decision.",
    );
  }

  const now = new Date().toISOString();
  const reviews = [
    ...engagement.reviews,
    { decision, note: note.trim(), reviewedAt: now, reviewer },
  ];

  if (decision === "request_changes") {
    if (!note.trim()) {
      throw new EngagementError("A note is required when requesting changes.");
    }
    return {
      ...engagement,
      reviews,
      status: "changes_requested",
      changeRequestNote: note.trim(),
      updatedAt: now,
    };
  }

  if (decision === "decline") {
    return {
      ...engagement,
      reviews,
      status: "declined",
      updatedAt: now,
    };
  }

  const status = nextStatusAfterAccept(Boolean(engagement.signedArtifact));
  return {
    ...engagement,
    reviews,
    status,
    acceptedAt: now,
    executedAt: status === "executed" ? now : null,
    effectiveDate: engagement.signedArtifact
      ? stampEffectiveDate(engagement, engagement.signedArtifact.uploadedAt)
      : engagement.effectiveDate,
    updatedAt: now,
    changeRequestNote: null,
  };
}

export function applySignedArtifact(
  engagement: Engagement,
  artifact: SignedArtifact,
): Engagement {
  if (engagement.status === "declined") {
    throw new EngagementError("A declined engagement cannot accept a signature.");
  }

  const now = new Date().toISOString();
  const next: Engagement = {
    ...engagement,
    signedArtifact: artifact,
    effectiveDate: stampEffectiveDate(engagement, artifact.uploadedAt),
    updatedAt: now,
  };

  if (engagement.status === "accepted") {
    next.status = "executed";
    next.executedAt = now;
  }

  return next;
}

export function applyDocuSignSent(
  engagement: Engagement,
  envelopeId: string,
  message: string,
  mode: "stub" | "live_placeholder",
  recipients = engagement.docusign.recipients,
): Engagement {
  const now = new Date().toISOString();
  return {
    ...engagement,
    docusign: {
      mode,
      envelopeId,
      status: "sent",
      sentAt: now,
      completedAt: null,
      lastMessage: message,
      recipients,
    },
    updatedAt: now,
  };
}

export function applyDocuSignCompleted(
  engagement: Engagement,
  artifact: SignedArtifact,
): Engagement {
  if (engagement.status !== "accepted" && engagement.status !== "executed") {
    throw new EngagementError(
      "DocuSign completion can only be recorded after the engagement is accepted.",
    );
  }

  const now = new Date().toISOString();
  return {
    ...engagement,
    signedArtifact: artifact,
    status: "executed",
    executedAt: engagement.executedAt ?? now,
    effectiveDate: stampEffectiveDate(engagement, artifact.uploadedAt ?? now),
    updatedAt: now,
    docusign: {
      ...engagement.docusign,
      status: "completed",
      completedAt: now,
      lastMessage: "DocuSign stub: envelope marked complete. Signed artifact attached.",
    },
  };
}

export function artifactFromUpload(input: {
  filename: string;
  storedName: string;
  source: ArtifactSource;
  mimeType: string;
  sizeBytes: number;
}): SignedArtifact {
  return {
    ...input,
    uploadedAt: new Date().toISOString(),
  };
}
