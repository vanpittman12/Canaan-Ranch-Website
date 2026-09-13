export const brand = {
  name: "Canaan Ranch",
  legalName: "Canaan Ranch LLC",
  tagline: "Land, hospitality, and professional partnership.",
  shortTagline: "From first conversation to executed agreement.",
  email: "engagements@canaanranch.com",
  phone: "+1 (304) 555-1840",
  website: "https://canaanranch.example",
  address: {
    street: "1840 Ridge Line Road",
    city: "Canaan Valley",
    state: "WV",
    postalCode: "26260",
    country: "United States",
  },
  addressLine: "1840 Ridge Line Road, Canaan Valley, WV 26260",
} as const;

export function formatBrandAddress() {
  const { street, city, state, postalCode } = brand.address;
  return `${street}, ${city}, ${state} ${postalCode}`;
}
