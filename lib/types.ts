export type SigningMethod = "docusign" | "manual";
export type EngagementStatus =
  | "draft"
  | "pending_review"
  | "changes_requested"
  | "declined"
  | "accepted"
  | "executed";
export type ReviewDecision = "accept" | "request_changes" | "decline";
export type ArtifactSource = "manual_upload" | "docusign_stub";
export type DocuSignEnvelopeStatus =
  | "not_sent"
  | "sent"
  | "delivered"
  | "completed"
  | "voided";

export interface IntakeFields {
  buyerLegalName: string;
  buyerAttention: string;
  buyerEmail: string;
  buyerStreet: string;
  buyerCity: string;
  buyerState: string;
  buyerPostalCode: string;
  buyerPhone: string;
  tortoiseCount: number;
  perGtRate: number;
  relocationCounty: string;
  authorizedAgentName: string;
  authorizedAgentCompany: string;
  donorCompanyAffiliation: string;
  donorSiteName: string;
  donorSiteDescription: string;
  buyerWitnessName: string;
  buyerWitnessEmail: string;
  sellerWitnessName: string;
  sellerWitnessEmail: string;
}

export interface SignedArtifact {
  filename: string;
  storedName: string;
  uploadedAt: string;
  source: ArtifactSource;
  mimeType: string;
  sizeBytes: number;
}

export interface EnvelopeRecipient {
  role: "buyer_signer" | "seller_signer" | "buyer_witness" | "seller_witness";
  name: string;
  email: string;
}

export interface DocuSignState {
  mode: "stub" | "live_placeholder";
  envelopeId: string | null;
  status: DocuSignEnvelopeStatus;
  sentAt: string | null;
  completedAt: string | null;
  lastMessage: string | null;
  recipients: EnvelopeRecipient[];
}

export interface ReviewRecord {
  decision: ReviewDecision;
  note: string;
  reviewedAt: string;
  reviewer: string;
}

export interface Engagement {
  id: string;
  reference: string;
  status: EngagementStatus;
  /** YYYY-MM-DD, set when the Buyer signs. Null until signature completion. */
  effectiveDate: string | null;
  intake: IntakeFields;
  signingMethod: SigningMethod | null;
  signedArtifact: SignedArtifact | null;
  docusign: DocuSignState;
  reviews: ReviewRecord[];
  changeRequestNote: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  acceptedAt: string | null;
  executedAt: string | null;
}

export const STATUS_LABELS: Record<EngagementStatus, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  changes_requested: "Changes requested",
  declined: "Declined",
  accepted: "Accepted — awaiting signature",
  executed: "Executed",
};

export function dealTitle(intake: IntakeFields) {
  if (intake.donorSiteName.trim()) {
    return intake.donorSiteName.trim();
  }
  return `Gopher tortoise relocation — ${intake.buyerLegalName}`;
}

export function buyerNoticeAddress(intake: IntakeFields) {
  return `${intake.buyerStreet}, ${intake.buyerCity}, ${intake.buyerState} ${intake.buyerPostalCode}`;
}

/** Exact Buyer notice block used in Parties and Notices. */
export function formatBuyerNotice(intake: IntakeFields) {
  return `${intake.buyerLegalName}, Attention: ${intake.buyerAttention}, ${buyerNoticeAddress(intake)}, Phone ${intake.buyerPhone}, Email ${intake.buyerEmail}`;
}

/** Buyer authorized agent as it appears in Parties, Notices, and responsibilities. */
export function formatAuthorizedAgent(intake: IntakeFields) {
  return `${intake.authorizedAgentName}, ${intake.authorizedAgentCompany}`;
}
