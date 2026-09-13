import { brand, formatSellerNotice } from "./brand";
import {
  addOneYear,
  dealEconomics,
  formatFormalDate,
  formatLongDate,
  formatUsd,
  numberToWords,
} from "./money";
import { buyerNoticeAddress, type Engagement } from "./types";

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

export function buildContract(engagement: Engagement): ContractDocument {
  const { intake } = engagement;
  const economics = dealEconomics(intake);
  const effectiveDate = formatLongDate(intake.effectiveDate);
  const effectiveFormal = formatFormalDate(intake.effectiveDate);
  const expirationIso = addOneYear(intake.effectiveDate);
  const expirationDate = formatLongDate(expirationIso);
  const donor =
    intake.donorSiteName || intake.donorSiteDescription
      ? [
          intake.donorSiteName
            ? `The reserved capacity under this Agreement is associated with the donor site or project known as “${intake.donorSiteName}.”`
            : "",
          intake.donorSiteDescription ? intake.donorSiteDescription : "",
        ]
          .filter(Boolean)
          .join(" ")
      : "This Agreement may be used for one or more donor-site relocations, up to the reserved capacity, without identifying a single donor project.";

  const sellerBlock = [
    `${brand.legalName} (“Seller”)`,
    "d/b/a Canaan Preserve",
    "Authorized signature: ______________________________",
    `Name: ${brand.signatoryName}`,
    `Title: ${brand.signatoryTitle}`,
    "Date: _____________________________________________",
  ];
  const buyerBlock = [
    `${intake.buyerLegalName} (“Buyer”)`,
    "Authorized signature: ______________________________",
    `Name: ${intake.buyerAttention}`,
    "Title: _____________________________________________",
    "Date: _____________________________________________",
  ];

  return {
    title: "Multi-Project Gopher Tortoise Relocation Agreement",
    subtitle: brand.name,
    reference: engagement.reference,
    effectiveDate,
    expirationDate,
    signatureHeading: "12. Signatures",
    signatureIntro:
      "By signing, each party agrees to the terms of this Multi-Project Gopher Tortoise Relocation Agreement.",
    sections: [
      {
        heading: "1. Parties",
        paragraphs: [
          `This Multi-Project Gopher Tortoise Relocation Agreement (“Agreement”) is entered into as of ${effectiveFormal} (the “Effective Date”) by and between ${brand.legalName}, a Florida limited liability partnership (“Seller”), operating the Canaan Preserve gopher tortoise recipient site, and ${intake.buyerLegalName} (“Buyer”).`,
          `Seller’s notice address is ${formatSellerNotice()}. Seller’s authorized signatory is ${brand.signatoryName}, ${brand.signatoryTitle}.`,
          `Buyer’s notice address is ${intake.buyerLegalName}, Attention: ${intake.buyerAttention}, ${buyerNoticeAddress(intake)}, Phone ${intake.buyerPhone}, Email ${intake.buyerEmail}.`,
        ],
      },
      {
        heading: "2. Reserved capacity",
        paragraphs: [
          `Seller agrees to reserve recipient-site capacity at Canaan Preserve for the relocation of up to ${economics.count} (${numberToWords(economics.count)}) gopher tortoises (Gopherus polyphemus) under this Agreement (the “Reserved Capacity”). Adult versus juvenile classification is determined at delivery and acceptance, not at reservation.`,
          donor,
        ],
      },
      {
        heading: "3. Term and expiration",
        paragraphs: [
          `This Agreement begins on the Effective Date and expires on ${expirationDate} (the “Expiration Date”), which is one (1) year after the Effective Date, unless earlier terminated or extended in a writing signed by both parties.`,
          "Unused Reserved Capacity expires on the Expiration Date and does not roll forward unless the parties execute a written amendment.",
        ],
      },
      {
        heading: "4. Payment",
        paragraphs: [
          `Buyer shall pay Seller ${economics.rateFormatted} (${economics.rateWords}) for each gopher tortoise accepted against the Reserved Capacity (the “Per GT Rate”). The Total Estimated Payment for the Reserved Capacity is ${economics.totalFormatted} (${economics.totalWords}), calculated as ${economics.count} × ${economics.rateFormatted}.`,
          "The Per GT Rate is generally non-negotiable. Any exception must be confirmed in writing by Seller’s Manager before execution. Payment is due as invoiced upon acceptance of tortoises at the recipient site (or as otherwise billed by Seller). This Agreement does not require a separate initial deposit.",
          `If a tortoise is classified as a juvenile at delivery and acceptance, Buyer shall pay an additional ${formatUsd(brand.juvenileAdditionalFee)} per juvenile, in addition to the Per GT Rate. Juvenile classification is not made at intake.`,
        ],
      },
      {
        heading: "5. Buyer responsibilities",
        paragraphs: [
          "Buyer is solely responsible for obtaining and complying with all Florida Fish and Wildlife Conservation Commission (FWC) permits and authorizations required to capture, hold, transport, and relocate gopher tortoises from any donor site to Canaan Preserve.",
          "Buyer shall deliver tortoises in accordance with applicable FWC guidelines and Seller’s recipient-site protocols, and shall provide such paperwork as Seller reasonably requires at intake to the recipient site.",
        ],
      },
      {
        heading: "6. Seller responsibilities",
        paragraphs: [
          `Seller shall maintain Canaan Preserve as an FWC-authorized recipient site and shall accept gopher tortoises up to the Reserved Capacity, subject to site conditions, remaining capacity, and applicable law. Seller’s agent for operational coordination is ${brand.agentName}, ${brand.agentContact}.`,
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
          `Notices to Buyer shall be sent to ${intake.buyerLegalName}, Attention: ${intake.buyerAttention}, ${buyerNoticeAddress(intake)}, Phone ${intake.buyerPhone}, Email ${intake.buyerEmail}.`,
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
