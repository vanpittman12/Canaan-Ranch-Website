export const brand = {
  name: "Canaan Preserve",
  legalName: "Canaan Ranch LLP",
  tagline: "Canaan Ranch LLP operates this FWC Approved Tier 1 Long-Term recipient site.",
  lockupLine: "Recipient site",
  habitatLine: "The most ecologically pristine recipient site in Florida",
  shortTagline: "Reserve recipient-site capacity with a clear agreement.",
  fwcStatus: "Canaan Preserve is an FWC Approved Tier 1 Long-Term Recipient Site.",
  /** Van’s exact hero slogan — do not polish. */
  heroSlogan:
    "Don’t slow your project down - Long Term Tier 1 sites are the best option for the tortoise and therefore FWC’s preferred choice for relocations.",
  /** Full sentence under the locked slogan. Uses site-wide Long-Term casing. */
  heroLead:
    "Reserve capacity at this FWC Approved Tier 1 Long-Term site, download a signature-ready relocation agreement, and get human review before anything closes.",
  /** Primary buyer-facing intake CTA. Keep nav, hero, footer, and bottom CTA in sync. */
  intakeCta: "Start intake",
  flowInvite:
    "Review the template, complete intake, and download your signature-ready relocation agreement. After Canaan Preserve accepts, DocuSign is the usual signing path.",
  footerLine:
    "Canaan Ranch LLP operates this FWC Approved Tier 1 Long-Term recipient site.",
  fwcBadge: "FWC Approved Tier 1",
  /** FWC mitigation table explaining why Tier 1 recipient sites have lower requirements. */
  fwcRecipientSitesUrl:
    "https://myfwc.com/license/wildlife/gopher-tortoise-permits/mitigation/#table",
  fwcMitigationLinkLabel: "Why Tier 1 matters (FWC mitigation)",
  email: "vpittman@beachparkcap.com",
  phone: "813-390-1044",
  website: "https://canaanpreserve.com",
  attention: "Van Pittman",
  address: {
    street: "1700 S. MacDill Ave., Suite 340",
    city: "Tampa",
    state: "FL",
    postalCode: "33629",
    country: "United States",
  },
  addressLine: "1700 S. MacDill Ave., Suite 340, Tampa, FL 33629",
  signatoryName: "Andrew V. Pittman, Jr.",
  signatoryTitle: "Manager",
  agentName: "Applied Bionomics, LLC",
  agentContact: "Andrew Fuddy",
  venue: "Pasco County, Florida",
  defaultPerGtRate: 6000,
  /** All-in juvenile price; not added on top of the adult Per GT Rate. */
  juvenileRate: 3000,
  /** Seller-side witness. Same every reservation; not collected on public intake. */
  sellerWitnessName: "Andrew Fuddy",
  sellerWitnessEmail: "witness@canaanpreserve.com",
} as const;

export const TEMPLATE_AGREEMENT_PATH = "/api/agreement-template";

export function formatBrandAddress() {
  const { street, city, state, postalCode } = brand.address;
  return `${street}, ${city}, ${state} ${postalCode}`;
}

export function brandMailtoHref() {
  return `mailto:${brand.email}`;
}

export function brandTelHref() {
  const digits = brand.phone.replace(/\D/g, "");
  return digits.length === 10 ? `tel:+1${digits}` : `tel:${digits}`;
}

export function formatSellerNotice() {
  return `${brand.legalName}, Attention: ${brand.attention}, ${formatBrandAddress()}, Phone ${brand.phone}`;
}

/**
 * Fixed Canaan Ranch LLP witness. Env overrides win; otherwise brand defaults.
 * Buyer intake never supplies these values.
 */
export function getSellerWitness() {
  const name = process.env.CANAAN_WITNESS_NAME?.trim();
  const email = process.env.CANAAN_WITNESS_EMAIL?.trim();
  return {
    name: name || brand.sellerWitnessName,
    email: email || brand.sellerWitnessEmail,
  };
}
