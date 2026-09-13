import { describe, expect, it } from "vitest";
import { brand } from "./brand";
import { intakeSchema, publicIntakeFields } from "./validation";

const posted = {
  buyerLegalName: "Cypress Ridge Holdings LLC",
  buyerAttention: "Avery Cole",
  buyerEmail: "avery@cypressridge.example",
  buyerStreet: "200 Bay Street",
  buyerCity: "Tampa",
  buyerState: "FL",
  buyerPostalCode: "33602",
  buyerPhone: "813-555-0144",
  tortoiseCount: "8",
  perGtRate: "1",
  relocationCounty: "Hillsborough",
  authorizedAgentName: "Dana Ruiz",
  authorizedAgentCompany: "Ruiz Environmental",
  donorCompanyAffiliation: "Lennar",
  buyerWitnessName: "Lee Park",
  buyerWitnessEmail: "lee@cypressridge.example",
  sellerWitnessName: "Pat Morales",
  sellerWitnessEmail: "pat.morales@canaanpreserve.example",
};

describe("public intake rate lock", () => {
  it("strips a client-posted perGtRate and locks the brand default", () => {
    const parsed = intakeSchema.safeParse(posted);
    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      return;
    }
    expect(parsed.data).not.toHaveProperty("perGtRate");
    expect(publicIntakeFields(parsed.data).perGtRate).toBe(brand.defaultPerGtRate);
    expect(publicIntakeFields(parsed.data).perGtRate).toBe(6000);
  });
});
