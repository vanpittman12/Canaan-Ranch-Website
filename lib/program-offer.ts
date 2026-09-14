import { brand } from "./brand";
import { formatUsd } from "./money";

export const programOfferCopy = {
  heading: "What we offer",
  intro: "Our program includes:",
} as const;

export const programOfferItems = [
  `Pricing: ${formatUsd(brand.defaultPerGtRate)} per adult tortoise / ${formatUsd(brand.juvenileRate)} per juvenile tortoise.`,
  "No deposit requirement.",
  "Mark, measure and transport of relocated tortoises.",
  "Permanently protected habitat within a conservation easement.",
] as const;
