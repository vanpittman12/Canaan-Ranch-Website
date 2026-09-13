import { brand, formatBrandAddress } from "./brand";
import { serviceTypeLabel, type Engagement } from "./types";

export interface ContractSection {
  heading: string;
  paragraphs: string[];
}

export interface ContractDocument {
  title: string;
  subtitle: string;
  reference: string;
  effectiveDate: string;
  sections: ContractSection[];
  providerBlock: string[];
  clientBlock: string[];
}

function formatDate(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTimestamp(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function clientAddress(engagement: Engagement) {
  const { intake } = engagement;
  return `${intake.billingStreet}, ${intake.billingCity}, ${intake.billingState} ${intake.billingPostalCode}`;
}

export function buildContract(engagement: Engagement): ContractDocument {
  const { intake } = engagement;
  const effectiveDate = formatTimestamp(engagement.createdAt);
  const startDate = formatDate(intake.startDate);

  return {
    title: "Professional Services Agreement",
    subtitle: brand.name,
    reference: engagement.reference,
    effectiveDate,
    sections: [
      {
        heading: "1. Parties",
        paragraphs: [
          `This Professional Services Agreement (“Agreement”) is entered into as of ${effectiveDate} (the “Effective Date”) by and between ${brand.legalName}, with offices at ${formatBrandAddress()} (“Provider”), and ${intake.companyName}, with offices at ${clientAddress(engagement)} (“Client”).`,
          `Client’s primary contact for this engagement is ${intake.contactName}, ${intake.contactTitle} (${intake.contactEmail}, ${intake.contactPhone}). Provider’s contact for notices is ${brand.email}.`,
        ],
      },
      {
        heading: "2. Engagement and scope",
        paragraphs: [
          `Provider will perform the professional services described in this Agreement for the project titled “${intake.projectTitle}” (the “Services”). The Services are classified as ${serviceTypeLabel(intake.serviceType)} and will be performed at or in connection with ${intake.serviceLocation}.`,
          `Scope of work: ${intake.scopeSummary}`,
          intake.notes
            ? `Additional client notes incorporated by reference: ${intake.notes}`
            : "No additional client notes were provided at intake.",
        ],
      },
      {
        heading: "3. Schedule and term",
        paragraphs: [
          `The parties intend for Services to begin on ${startDate} and to continue for an estimated duration of ${intake.duration}, unless earlier terminated as provided herein or extended in a written change order.`,
          "Timeframes are good-faith estimates. Provider will notify Client promptly if material delays become reasonably apparent.",
        ],
      },
      {
        heading: "4. Fees and payment",
        paragraphs: [
          `Client’s indicated budget range for this engagement is ${intake.budgetRange}. Unless the parties execute a separate fee schedule, Provider will invoice monthly for time and materials or for agreed milestones, plus reasonable pre-approved expenses.`,
          "Invoices are due within thirty (30) days of receipt. Late amounts may accrue interest at 1.5% per month or the maximum rate permitted by law, whichever is less. Client is responsible for applicable taxes other than taxes on Provider’s net income.",
        ],
      },
      {
        heading: "5. Client responsibilities",
        paragraphs: [
          "Client will provide timely access to information, sites, personnel, and decisions reasonably required for Provider to perform the Services. Client represents that information it supplies is accurate and that it has authority to enter this Agreement.",
          "Client remains responsible for its own operational, regulatory, and land-use decisions. Provider’s work is advisory and professional in nature and does not constitute legal, tax, or licensed engineering advice unless expressly agreed in writing.",
        ],
      },
      {
        heading: "6. Changes",
        paragraphs: [
          "Either party may propose a change to scope, schedule, or fees. Material changes are effective only if confirmed in writing (including email) by authorized representatives of both parties. Work performed at Client’s written request outside the current scope may be billed at Provider’s then-current rates.",
        ],
      },
      {
        heading: "7. Confidentiality",
        paragraphs: [
          "Each party will protect the other’s non-public business, operational, and personal information using reasonable care and will use it only to perform this Agreement. These obligations survive for three (3) years after termination, except for trade secrets, which remain protected while they qualify as such.",
        ],
      },
      {
        heading: "8. Intellectual property",
        paragraphs: [
          "Provider retains all pre-existing materials, methods, and know-how. Upon full payment, Client receives a non-exclusive, non-transferable license to use deliverables created specifically for Client under this Agreement for Client’s internal business purposes. Provider may reuse general know-how that does not disclose Client’s confidential information.",
        ],
      },
      {
        heading: "9. Limitation of liability",
        paragraphs: [
          "To the fullest extent permitted by law, neither party is liable for indirect, incidental, special, consequential, or punitive damages. Provider’s aggregate liability arising out of this Agreement will not exceed the fees paid by Client to Provider for the Services giving rise to the claim in the twelve (12) months before the claim.",
        ],
      },
      {
        heading: "10. Termination",
        paragraphs: [
          "Either party may terminate this Agreement for convenience on fourteen (14) days’ written notice, or immediately for material breach that remains uncured for ten (10) days after notice. Client will pay for Services performed and approved expenses incurred through the effective termination date.",
        ],
      },
      {
        heading: "11. General",
        paragraphs: [
          `This Agreement is governed by the laws of the State of ${brand.address.state}, without regard to conflict-of-laws rules. The parties will first attempt good-faith resolution of disputes. If litigation is required, exclusive venue lies in the state or federal courts sitting in ${brand.address.state}.`,
          "This Agreement, together with the intake details incorporated above, is the entire agreement for the Services and supersedes prior discussions. It may be signed in counterparts, including electronic signature. A standard Canaan Preserve form is provided for operational efficiency and is not a substitute for counsel.",
        ],
      },
    ],
    providerBlock: [
      brand.legalName,
      "Authorized signature: ______________________________",
      "Name: ____________________________________________",
      "Title: _____________________________________________",
      "Date: _____________________________________________",
    ],
    clientBlock: [
      intake.companyName,
      "Authorized signature: ______________________________",
      `Name: ${intake.contactName}`,
      `Title: ${intake.contactTitle}`,
      "Date: _____________________________________________",
    ],
  };
}
