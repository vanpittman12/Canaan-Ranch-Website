export const brand = {
  name: "Canaan Preserve",
  legalName: "Canaan Ranch LLP",
  tagline: "Gopher tortoise relocation recipient site.",
  lockupLine: "Recipient site",
  habitatLine: "The most ecologically pristine recipient site in Florida",
  shortTagline: "Reserve recipient-site capacity with a clear agreement.",
  fwcStatus: "Canaan Preserve is an FWC Approved Tier 1 Long Term Recipient site.",
  fwcValueProp:
    "Canaan Preserve is an FWC approved Tier 1 recipient site and therefore has the lowest mitigation requirements, saving our clients money. Review our template agreement and fill out our intake form to automatically generate a signature ready relocation agreement to get your project moving as quickly as possible.",
  intakeInvite:
    "Fill out our intake form to automatically populate the relocation agreement and expedite the reservation letter process.",
  fwcBadge: "FWC Approved Tier 1",
  fwcRecipientSitesUrl:
    "https://myfwc.com/license/wildlife/gopher-tortoise-permits/recipient-sites/",
  email: "engagements@canaanpreserve.com",
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
