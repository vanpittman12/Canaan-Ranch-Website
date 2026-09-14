import { brand, formatSellerNotice, getSellerWitness } from "./brand";
import {
  addOneYear,
  dealEconomics,
  formatFormalDate,
  formatLongDate,
  formatUsd,
  numberToWords,
  usdInWords,
} from "./money";
import {
  emptyReservationLetter,
  formatAuthorizedAgent,
  formatBuyerNotice,
  type Engagement,
  type IntakeFields,
} from "./types";

export interface ContractSection {
  heading: string;
  paragraphs: string[];
}

export interface ContractDocument {
  title: string;
  subtitle: string;
  reference: string;
  effectiveDate: string;
  expirationDate: string;
  signatureHeading: string;
  signatureIntro: string;
  sections: ContractSection[];
  sellerBlock: string[];
  buyerBlock: string[];
  /** @deprecated use sellerBlock */
  providerBlock: string[];
  /** @deprecated use buyerBlock */
  clientBlock: string[];
}

function sellerWitnessLine(intake: IntakeFields) {
  return intake.sellerWitnessName.trim() || getSellerWitness().name;
}

function agreementDates(engagement: Engagement) {
  if (!engagement.effectiveDate) {
    return {
      effectiveDate: "the date Buyer signs this Agreement",
      effectiveFormal: "the date Buyer signs this Agreement",
      expirationDate: "one (1) year after the Effective Date",
    };
  }

  return {
    effectiveDate: formatLongDate(engagement.effectiveDate),
    effectiveFormal: formatFormalDate(engagement.effectiveDate),
    expirationDate: formatLongDate(addOneYear(engagement.effectiveDate)),
  };
}

function reservedCapacityContext(intake: IntakeFields) {
  const clauses: string[] = [];
  if (intake.relocationCounty.trim()) {
    clauses.push(`County of relocation: ${intake.relocationCounty.trim()}`);
  }
  if (intake.donorCompanyAffiliation.trim()) {
    clauses.push(`Donor company affiliation: ${intake.donorCompanyAffiliation.trim()}`);
  }
  if (intake.donorSiteName.trim()) {
    clauses.push(`Donor site / project: ${intake.donorSiteName.trim()}`);
  }

  const lead = clauses.length
    ? `The Reserved Capacity is associated with the following intake fields: ${clauses.join("; ")}.`
    : "This Agreement may be used for one or more donor-site relocations, up to the reserved capacity, without identifying a single donor project.";

  const description = intake.donorSiteDescription.trim();
  return description
    ? `${lead} Project description: ${description}`
    : lead;
}

export function buildContract(engagement: Engagement): ContractDocument {
  const { intake } = engagement;
  const economics = dealEconomics(intake);
  const isTemplate = engagement.id === "template";
  const capacityCount = isTemplate
    ? "[Reserved capacity count]"
    : `${economics.count} (${numberToWords(economics.count)})`;
  const estimatedTotal = isTemplate
    ? "[Total estimated payment at the adult rate] (reserved capacity count × adult rate)"
    : `${economics.totalFormatted} (${economics.totalWords}), calculated as ${economics.count} × ${economics.rateFormatted}`;
  const { effectiveDate, effectiveFormal, expirationDate } = agreementDates(engagement);
  const agent = formatAuthorizedAgent(intake);
  const buyerNotice = formatBuyerNotice(intake);
  const sellerWitness = sellerWitnessLine(intake);

  const sellerBlock = [
    `${brand.legalName} (“Seller”)`,
    "d/b/a Canaan Preserve",
    "Authorized signature: ______________________________",
    `Name: ${brand.signatoryName}`,
    `Title: ${brand.signatoryTitle}`,
    "Date: _____________________________________________",
    `Witness: ${sellerWitness}`,
    "Witness signature: ________________________________",
    "Witness date: _____________________________________",
  ];
  const buyerBlock = [
    `${intake.buyerLegalName} (“Buyer”)`,
    "Authorized signature: ______________________________",
    `Name: ${intake.buyerAttention}`,
    "Title: _____________________________________________",
    "Date: _____________________________________________",
    `Witness: ${intake.buyerWitnessName}`,
    "Witness signature: ________________________________",
    "Witness date: _____________________________________",
  ];

  return {
    title: "Multi-Project Gopher Tortoise Relocation Agreement",
    subtitle: brand.name,
    reference: engagement.reference,
    effectiveDate,
    expirationDate,
    signatureHeading: "12. Signatures",
    signatureIntro:
      "By signing, each party agrees to the terms of this Multi-Project Gopher Tortoise Relocation Agreement. Each party signs with one (1) witness.",
    sections: [
      {
        heading: "1. Parties",
        paragraphs: [
          `This Multi-Project Gopher Tortoise Relocation Agreement (“Agreement”) is entered into as of ${effectiveFormal} (the “Effective Date”) by and between ${brand.legalName}, a Florida limited liability partnership (“Seller”), operating the Canaan Preserve gopher tortoise recipient site, and ${intake.buyerLegalName} (“Buyer”).`,
          `Seller’s notice address is ${formatSellerNotice()}. Seller’s authorized signatory is ${brand.signatoryName}, ${brand.signatoryTitle}.`,
          `Buyer’s notice address is ${buyerNotice}. Buyer’s authorized agent is ${agent}.`,
        ],
      },
      {
        heading: "2. Reserved capacity",
        paragraphs: [
          `Seller agrees to reserve recipient-site capacity at Canaan Preserve for the relocation of up to ${capacityCount} gopher tortoises (Gopherus polyphemus) under this Agreement (the “Reserved Capacity”). Adult versus juvenile classification is determined at delivery and acceptance, not at reservation.`,
          reservedCapacityContext(intake),
        ],
      },
      {
        heading: "3. Term and expiration",
        paragraphs: [
          engagement.effectiveDate
            ? `This Agreement begins on the Effective Date and expires on ${expirationDate} (the “Expiration Date”), which is one (1) year after the Effective Date, unless earlier terminated or extended in a writing signed by both parties.`
            : `This Agreement begins on the Effective Date and expires one (1) year after the Effective Date (the “Expiration Date”), unless earlier terminated or extended in a writing signed by both parties.`,
          "Unused Reserved Capacity expires on the Expiration Date and does not roll forward unless the parties execute a written amendment.",
        ],
      },
      {
        heading: "4. Payment",
        paragraphs: [
          `Buyer shall pay Seller ${economics.rateFormatted} (${economics.rateWords}) per adult gopher tortoise accepted against the Reserved Capacity (the “Per GT Rate”). The Total Estimated Payment for the Reserved Capacity at the adult rate is ${estimatedTotal}.`,
          `If a tortoise is classified as a juvenile at delivery and acceptance, Buyer shall pay ${formatUsd(brand.juvenileRate)} (${usdInWords(brand.juvenileRate)}) per juvenile as the total price for that tortoise, in lieu of the Per GT Rate. The juvenile price is ${formatUsd(brand.juvenileRate)} all-in and is not added to the adult Per GT Rate. Juvenile classification is not made at intake.`,
          "No deposit or initial payment is required. Payment is due as invoiced upon acceptance of tortoises at the recipient site (or as otherwise billed by Seller).",
        ],
      },
      {
        heading: "5. Buyer responsibilities",
        paragraphs: [
          "Buyer is solely responsible for obtaining and complying with all Florida Fish and Wildlife Conservation Commission (FWC) permits and authorizations required to capture, hold, transport, and relocate gopher tortoises from any donor site to Canaan Preserve.",
          `Buyer shall deliver tortoises in accordance with applicable FWC guidelines and Seller’s recipient-site protocols, and shall provide such paperwork as Seller reasonably requires at intake to the recipient site. Buyer’s authorized agent for operational coordination is ${agent}.`,
        ],
      },
      {
        heading: "6. Seller responsibilities",
        paragraphs: [
          `${brand.fwcStatus} Seller shall maintain Canaan Preserve as an FWC Approved Tier 1 Long-Term Recipient Site and shall accept gopher tortoises up to the Reserved Capacity, subject to site conditions, remaining capacity, and applicable law. Seller’s agent for operational coordination is ${brand.agentName}, ${brand.agentContact}.`,
          "Seller does not warrant that a particular donor-site schedule can be met if Buyer has not reserved remaining capacity or if FWC or site conditions prevent acceptance.",
        ],
      },
      {
        heading: "7. No assignment of permits",
        paragraphs: [
          "Nothing in this Agreement transfers Buyer’s capture, transport, or incidental-take permits to Seller. Seller’s role is limited to providing reserved recipient-site capacity and accepting tortoises delivered in compliance with this Agreement and FWC requirements.",
        ],
      },
      {
        heading: "8. Notices",
        paragraphs: [
          `Notices to Seller shall be sent to ${formatSellerNotice()}, with a copy to ${brand.agentName}, Attention: ${brand.agentContact}.`,
          `Notices to Buyer shall be sent to ${buyerNotice}. Buyer’s authorized agent is ${agent}.`,
        ],
      },
      {
        heading: "9. Limitation of liability",
        paragraphs: [
          "To the fullest extent permitted by law, Seller is not liable for indirect, incidental, special, consequential, or punitive damages. Seller’s aggregate liability arising out of this Agreement will not exceed the amounts actually paid by Buyer to Seller under this Agreement.",
        ],
      },
      {
        heading: "10. Governing law and venue",
        paragraphs: [
          `This Agreement is governed by the laws of the State of Florida, without regard to conflict-of-laws rules. Exclusive venue for any action arising out of this Agreement lies in the state courts sitting in ${brand.venue}.`,
        ],
      },
      {
        heading: "11. Entire agreement",
        paragraphs: [
          "This Agreement is the entire agreement for the Reserved Capacity and supersedes prior discussions. Seller is Canaan Ranch LLP (not any prior contracting entity). It may be signed in counterparts, including electronic signature. A Canaan Preserve form is provided for operational efficiency and is not a substitute for counsel.",
        ],
      },
    ],
    sellerBlock,
    buyerBlock,
    providerBlock: sellerBlock,
    clientBlock: buyerBlock,
  };
}

export function buildTemplateEngagement(): Engagement {
  const blanks: IntakeFields = {
    buyerLegalName: "[Buyer legal name]",
    buyerAttention: "[Buyer signatory / attention]",
    buyerEmail: "[Buyer signatory email]",
    buyerStreet: "[Street address]",
    buyerCity: "[City]",
    buyerState: "[State]",
    buyerPostalCode: "[Postal code]",
    buyerPhone: "[Phone]",
    tortoiseCount: 0,
    perGtRate: brand.defaultPerGtRate,
    relocationCounty: "[County of relocation]",
    authorizedAgentName: "[Buyer’s authorized agent name]",
    authorizedAgentCompany: "[Buyer’s authorized agent company]",
    donorCompanyAffiliation: "[Donor company affiliation]",
    donorSiteName: "[Donor site / project name]",
    donorSiteDescription: "[Project description]",
    buyerWitnessName: "[Buyer witness name]",
    buyerWitnessEmail: "[Buyer witness email]",
    sellerWitnessName: getSellerWitness().name,
    sellerWitnessEmail: getSellerWitness().email,
  };

  return {
    id: "template",
    reference: "CP-TEMPLATE",
    status: "draft",
    effectiveDate: null,
    intake: blanks,
    signingMethod: null,
    signedArtifact: null,
    docusign: {
      mode: "stub",
      envelopeId: null,
      status: "not_sent",
      sentAt: null,
      completedAt: null,
      lastMessage: null,
      recipients: [],
    },
    reservationLetter: emptyReservationLetter(),
    reviews: [],
    changeRequestNote: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    submittedAt: null,
    acceptedAt: null,
    executedAt: null,
  };
}
