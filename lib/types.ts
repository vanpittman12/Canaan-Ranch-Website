export type SigningMethod = "docusign" | "manual";
export type EngagementStatus =
  | "draft"
  | "pending_review"
  | "changes_requested"
  | "declined"
  | "accepted"
  | "executed";
export type ReviewDecision = "accept" | "request_changes" | "decline";
export type ArtifactSource = "manual_upload" | "docusign_stub" | "docusign";
export type DocuSignMode = "stub" | "live";
export type DocuSignEnvelopeStatus =
  | "not_sent"
  | "sent"
  | "delivered"
  | "completed"
  | "voided";
export type ReservationLetterStatus = "none" | "draft" | "awaiting_send" | "sent";
export type ReservationLetterSource = "accept" | "seller_sign" | "manual";

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
  mode: DocuSignMode;
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

export interface ReservationLetter {
  status: ReservationLetterStatus;
  generatedAt: string | null;
  refreshedAt: string | null;
  sendApprovedAt: string | null;
  sentAt: string | null;
  storedName: string | null;
  filename: string | null;
  letterDate: string | null;
  source: ReservationLetterSource | null;
  notifyMode: "stub" | "gmail" | null;
  lastError: string | null;
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
  reservationLetter: ReservationLetter;
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
  accepted: "Awaiting seller signature",
  executed: "Executed",
};

export const STATUS_PILL_LABELS: Record<EngagementStatus, string> = {
  draft: "Draft",
  pending_review: "Pending",
  changes_requested: "Changes",
  declined: "Declined",
  accepted: "Awaiting seller",
  executed: "Executed",
};

export const LETTER_STATUS_LABELS: Record<ReservationLetterStatus, string> = {
  none: "Not generated",
  draft: "Draft generated",
  awaiting_send: "Awaiting send approval",
  sent: "Sent",
};

export function emptyReservationLetter(): ReservationLetter {
  return {
    status: "none",
    generatedAt: null,
    refreshedAt: null,
    sendApprovedAt: null,
    sentAt: null,
    storedName: null,
    filename: null,
    letterDate: null,
    source: null,
    notifyMode: null,
    lastError: null,
  };
}

export function dealTitle(intake: IntakeFields) {
  if (intake.donorSiteName.trim()) {
    return intake.donorSiteName.trim();
  }
  return `Gopher tortoise relocation — ${intake.buyerLegalName}`;
}

/** Join non-empty trimmed parts. Never emits dangling or doubled separators. */
export function joinPresent(
  parts: Array<string | null | undefined>,
  separator = ", ",
): string {
  return parts
    .map((part) => (part ?? "").replace(/\s+/g, " ").trim())
    .map((part) => part.replace(/^(?:,\s*)+|(?:\s*,)+$/g, "").trim())
    .filter((part) => Boolean(part.replace(/,/g, "").trim()))
    .join(separator);
}

export function displayValue(value: string) {
  return value.trim() || "—";
}

type NoticeAddressFields = Pick<
  IntakeFields,
  "buyerStreet" | "buyerCity" | "buyerState" | "buyerPostalCode"
>;

type AuthorizedAgentFields = Pick<
  IntakeFields,
  "authorizedAgentName" | "authorizedAgentCompany"
>;

export function buyerNoticeAddress(
  intake: NoticeAddressFields | Record<string, string>,
) {
  const street = (intake.buyerStreet ?? "").trim();
  const city = (intake.buyerCity ?? "").trim();
  const zip = (intake.buyerPostalCode ?? "").trim();
  if (!street && !city && !zip) {
    return "";
  }
  const region = joinPresent([intake.buyerState, intake.buyerPostalCode], " ");
  if (city) {
    return joinPresent([street, city, region]);
  }
  // No city: never leave a comma hanging before state/ZIP.
  return joinPresent([street, region], " ");
}

/** Exact Buyer notice block used in Parties and Notices. */
export function formatBuyerNotice(intake: IntakeFields) {
  const attention = intake.buyerAttention.trim();
  const phone = intake.buyerPhone.trim();
  const email = intake.buyerEmail.trim();
  return joinPresent([
    intake.buyerLegalName,
    attention ? `Attention: ${attention}` : "",
    buyerNoticeAddress(intake),
    phone ? `Phone ${phone}` : "",
    email ? `Email ${email}` : "",
  ]);
}

/** Buyer authorized agent as it appears in Parties, Notices, and responsibilities. */
export function formatAuthorizedAgent(
  intake: AuthorizedAgentFields | Record<string, string>,
) {
  return joinPresent([intake.authorizedAgentName, intake.authorizedAgentCompany]);
}

export function formatBuyerWitness(name: string, email: string) {
  return joinPresent([name, email], " · ");
}
