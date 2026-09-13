export const SERVICE_TYPES = [
  {
    value: "land_stewardship",
    label: "Land stewardship & grazing advisory",
  },
  {
    value: "hospitality_events",
    label: "Hospitality & private events",
  },
  {
    value: "consulting",
    label: "Ranch operations consulting",
  },
  {
    value: "custom",
    label: "Custom professional services",
  },
] as const;

export const BUDGET_RANGES = [
  "Under $10,000",
  "$10,000 – $25,000",
  "$25,000 – $75,000",
  "$75,000 – $150,000",
  "$150,000+",
  "To be determined",
] as const;

export const DURATIONS = [
  "1–3 months",
  "3–6 months",
  "6–12 months",
  "12+ months",
  "Single engagement / project",
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number]["value"];
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
  companyName: string;
  website: string;
  contactName: string;
  contactTitle: string;
  contactEmail: string;
  contactPhone: string;
  billingStreet: string;
  billingCity: string;
  billingState: string;
  billingPostalCode: string;
  projectTitle: string;
  serviceType: ServiceType;
  scopeSummary: string;
  startDate: string;
  duration: string;
  budgetRange: string;
  serviceLocation: string;
  notes: string;
}

export interface SignedArtifact {
  filename: string;
  storedName: string;
  uploadedAt: string;
  source: ArtifactSource;
  mimeType: string;
  sizeBytes: number;
}

export interface DocuSignState {
  mode: "stub" | "live_placeholder";
  envelopeId: string | null;
  status: DocuSignEnvelopeStatus;
  sentAt: string | null;
  completedAt: string | null;
  lastMessage: string | null;
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

export function serviceTypeLabel(value: ServiceType) {
  return SERVICE_TYPES.find((item) => item.value === value)?.label ?? value;
}
