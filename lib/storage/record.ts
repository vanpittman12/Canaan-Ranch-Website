import { emptyReservationLetter, type Engagement, type IntakeFields } from "../types";

export function emptyDocuSign(): Engagement["docusign"] {
  return {
    mode: "stub",
    envelopeId: null,
    status: "not_sent",
    sentAt: null,
    completedAt: null,
    lastMessage: null,
    recipients: [],
  };
}

export function createReference() {
  const year = new Date().getFullYear();
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes, (value) => value.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()
    .slice(0, 4);
  return `CP-${year}-${suffix}`;
}

export function createEmptyEngagement(intake: IntakeFields): Engagement {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    reference: createReference(),
    status: "draft",
    effectiveDate: null,
    intake,
    signingMethod: null,
    signedArtifact: null,
    docusign: emptyDocuSign(),
    reservationLetter: emptyReservationLetter(),
    reviews: [],
    changeRequestNote: null,
    createdAt: now,
    updatedAt: now,
    submittedAt: null,
    acceptedAt: null,
    executedAt: null,
  };
}

export function stampUpdated(engagement: Engagement): Engagement {
  return { ...engagement, updatedAt: new Date().toISOString() };
}
