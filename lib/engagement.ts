import { businessDateOnly } from "./money";
import type {
  ArtifactSource,
  DocuSignEnvelopeStatus,
  DocuSignMode,
  Engagement,
  EngagementStatus,
  ReviewDecision,
  SignedArtifact,
  SigningMethod,
} from "./types";

/**
 * Effective Date is the intake-submission calendar day (America/New_York).
 * Never derive it from Buyer signedDateTime or artifact upload time.
 */
export function intakeEffectiveDate(engagement: Pick<Engagement, "effectiveDate" | "submittedAt">) {
  if (engagement.effectiveDate) {
    return engagement.effectiveDate;
  }
  if (engagement.submittedAt) {
    return businessDateOnly(engagement.submittedAt);
  }
  return null;
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

export function isAwaitingSellerSignature(status: EngagementStatus) {
  return status === "accepted";
}

/** Admin still has work: review, seller signature, or buyer changes. */
export function isOpenEngagement(status: EngagementStatus) {
  return (
    status === "pending_review" ||
    status === "accepted" ||
    status === "changes_requested"
  );
}

export function isHiddenFromLedger(engagement: Pick<Engagement, "archivedAt">) {
  return Boolean(engagement.archivedAt);
}

/** Default ledger omits hidden rows. Pass includeHidden to audit archived deals. */
export function reviewLedgerItems(
  engagements: Engagement[],
  options: { includeHidden?: boolean } = {},
) {
  if (options.includeHidden) {
    return engagements.filter(isHiddenFromLedger);
  }
  return engagements.filter((item) => !isHiddenFromLedger(item));
}

/**
 * Soft-hide from the admin review ledger. Allowed for every status.
 * Does not delete the D1 payload, R2 artifacts, or DocuSign envelope data.
 */
export function applyHideFromLedger(engagement: Engagement): Engagement {
  if (isHiddenFromLedger(engagement)) {
    throw new EngagementError(
      "This engagement is already hidden from the review ledger.",
    );
  }

  const now = new Date().toISOString();
  return {
    ...engagement,
    archivedAt: now,
    updatedAt: now,
  };
}

export function nextStatusAfterAccept(
  hasSignedArtifact: boolean,
  signingMethod: SigningMethod | null = null,
): EngagementStatus {
  if (signingMethod === "docusign") {
    return "accepted";
  }
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
  const docusignPath = signingMethod === "docusign";
  return {
    ...engagement,
    signingMethod,
    // DocuSign: accepted-for-signing immediately so the buyer envelope is not
    // gated on admin Accept. Manual still waits in the review queue.
    status: docusignPath ? "accepted" : "pending_review",
    submittedAt: now,
    effectiveDate: businessDateOnly(now),
    acceptedAt: docusignPath ? now : engagement.acceptedAt,
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

  const status = nextStatusAfterAccept(
    Boolean(engagement.signedArtifact),
    engagement.signingMethod,
  );
  return {
    ...engagement,
    reviews,
    status,
    acceptedAt: now,
    executedAt: status === "executed" ? now : null,
    effectiveDate: intakeEffectiveDate(engagement),
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
    effectiveDate: intakeEffectiveDate(engagement),
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
  mode: DocuSignMode,
  recipients = engagement.docusign.recipients,
): Engagement {
  const now = new Date().toISOString();
  const promoteFromReview =
    engagement.signingMethod === "docusign" &&
    engagement.status === "pending_review";
  return {
    ...engagement,
    status: promoteFromReview ? "accepted" : engagement.status,
    acceptedAt: promoteFromReview
      ? (engagement.acceptedAt ?? now)
      : engagement.acceptedAt,
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

export function applyDocuSignStatus(
  engagement: Engagement,
  status: DocuSignEnvelopeStatus,
  message?: string,
): Engagement {
  const now = new Date().toISOString();
  return {
    ...engagement,
    docusign: {
      ...engagement.docusign,
      status,
      lastMessage: message ?? engagement.docusign.lastMessage,
    },
    updatedAt: now,
  };
}

export function applyDocuSignCompleted(
  engagement: Engagement,
  artifact: SignedArtifact,
  message?: string,
): Engagement {
  if (engagement.status !== "accepted" && engagement.status !== "executed") {
    throw new EngagementError(
      "DocuSign completion can only be recorded after the envelope has been sent (accepted for signing).",
    );
  }

  const now = new Date().toISOString();
  return {
    ...engagement,
    signedArtifact: artifact,
    status: "executed",
    executedAt: engagement.executedAt ?? now,
    effectiveDate: intakeEffectiveDate(engagement),
    updatedAt: now,
    docusign: {
      ...engagement.docusign,
      status: "completed",
      completedAt: now,
      lastMessage:
        message ??
        (engagement.docusign.mode === "live"
          ? "DocuSign: envelope completed. Signed artifact attached."
          : "DocuSign stub: envelope marked complete. Signed artifact attached."),
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
