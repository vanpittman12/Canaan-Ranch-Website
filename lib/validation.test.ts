import { afterEach, describe, expect, it } from "vitest";
import { brand, getSellerWitness } from "./brand";
import { SERVICE_AREA_CITY_ERROR } from "./service-area-cities";
import { intakeSchema, publicIntakeFields } from "./validation";

const posted = {
  buyerLegalName: "Cypress Ridge Holdings LLC",
  buyerAttention: "Avery Cole",
  buyerEmail: "avery@cypressridge.example",
  buyerStreet: "200 Bay Street",
  buyerCity: "Alachua",
  buyerState: "FL",
  buyerPostalCode: "32615",
  buyerPhone: "813-555-0144",
  tortoiseCount: "8",
  perGtRate: "1",
  relocationCounty: "Hillsborough",
  authorizedAgentName: "Dana Ruiz",
  authorizedAgentCompany: "Ruiz Environmental",
  donorCompanyAffiliation: "Lennar",
  donorSiteName: "Harbour tract",
  buyerWitnessName: "Lee Park",
  buyerWitnessEmail: "lee@cypressridge.example",
  sellerWitnessName: "Pat Morales",
  sellerWitnessEmail: "pat.morales@canaanpreserve.example",
};

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  delete process.env.CANAAN_WITNESS_NAME;
  delete process.env.CANAAN_WITNESS_EMAIL;
});

describe("public intake rate lock and seller witness", () => {
  it("requires project name on public intake", () => {
    const parsed = intakeSchema.safeParse({ ...posted, donorSiteName: "" });
    expect(parsed.success).toBe(false);
  });

  it("strips a client-posted perGtRate and locks the brand default", () => {
    const parsed = intakeSchema.safeParse(posted);
    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      return;
    }
    expect(parsed.data).not.toHaveProperty("perGtRate");
    expect(parsed.data).not.toHaveProperty("sellerWitnessName");
    expect(parsed.data).not.toHaveProperty("sellerWitnessEmail");
    expect(publicIntakeFields(parsed.data).perGtRate).toBe(brand.defaultPerGtRate);
    expect(publicIntakeFields(parsed.data).perGtRate).toBe(6000);
  });

  it("ignores a posted Canaan witness and stamps the fixed seller-side witness", () => {
    delete process.env.CANAAN_WITNESS_NAME;
    delete process.env.CANAAN_WITNESS_EMAIL;
    const parsed = intakeSchema.safeParse(posted);
    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      return;
    }
    const fields = publicIntakeFields(parsed.data);
    expect(fields.sellerWitnessName).toBe(brand.sellerWitnessName);
    expect(fields.sellerWitnessEmail).toBe(brand.sellerWitnessEmail);
    expect(fields.sellerWitnessName).not.toBe("Pat Morales");
  });

  it("honors CANAAN_WITNESS_NAME and CANAAN_WITNESS_EMAIL overrides", () => {
    process.env.CANAAN_WITNESS_NAME = "Jordan Blake";
    process.env.CANAAN_WITNESS_EMAIL = "jordan.blake@canaanpreserve.example";
    expect(getSellerWitness()).toEqual({
      name: "Jordan Blake",
      email: "jordan.blake@canaanpreserve.example",
    });
    const parsed = intakeSchema.safeParse(posted);
    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      return;
    }
    const fields = publicIntakeFields(parsed.data);
    expect(fields.sellerWitnessName).toBe("Jordan Blake");
    expect(fields.sellerWitnessEmail).toBe("jordan.blake@canaanpreserve.example");
  });

  it("rejects Tampa and accepts Alachua and Gainesville on the City gate", () => {
    const tampa = intakeSchema.safeParse({ ...posted, buyerCity: "Tampa" });
    expect(tampa.success).toBe(false);
    if (!tampa.success) {
      expect(tampa.error.issues.some((issue) => issue.message === SERVICE_AREA_CITY_ERROR)).toBe(
        true,
      );
    }

    expect(intakeSchema.safeParse({ ...posted, buyerCity: "Alachua" }).success).toBe(true);
    expect(intakeSchema.safeParse({ ...posted, buyerCity: "Gainesville" }).success).toBe(true);
  });
});
