export const brand = {
  name: "Canaan Preserve",
  legalName: "Canaan Ranch LLP",
  tagline: "Gopher tortoise relocation recipient site.",
  shortTagline: "Reserve recipient-site capacity with a clear agreement.",
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
  juvenileAdditionalFee: 3000,
} as const;

export function formatBrandAddress() {
  const { street, city, state, postalCode } = brand.address;
  return `${street}, ${city}, ${state} ${postalCode}`;
}

export function formatSellerNotice() {
  return `${brand.legalName}, Attention: ${brand.attention}, ${formatBrandAddress()}, Phone ${brand.phone}`;
}
