import { describe, expect, it } from "vitest";
import {
  buyerNoticeAddress,
  displayValue,
  formatAuthorizedAgent,
  formatBuyerNotice,
  formatBuyerWitness,
  joinPresent,
} from "./types";

const completeNotice = {
  buyerLegalName: "Suncoast Land Partners LLC",
  buyerAttention: "Morgan Hale",
  buyerEmail: "morgan@suncoast.example",
  buyerStreet: "400 Harbour Island Boulevard",
  buyerCity: "Tampa",
  buyerState: "FL",
  buyerPostalCode: "33602",
  buyerPhone: "813-555-0190",
  tortoiseCount: 10,
  perGtRate: 6000,
  relocationCounty: "Hillsborough",
  authorizedAgentName: "Casey Nguyen",
  authorizedAgentCompany: "Suncoast Permitting",
  donorCompanyAffiliation: "Lennar",
  donorSiteName: "Harbour tract",
  donorSiteDescription: "Residential development parcel",
  buyerWitnessName: "Riley Chen",
  buyerWitnessEmail: "riley@suncoast.example",
  sellerWitnessName: "Andrew Fuddy",
  sellerWitnessEmail: "witness@canaanpreserve.com",
};

describe("intake display joins", () => {
  it("omits empty address parts instead of dangling commas", () => {
    expect(
      buyerNoticeAddress({
        buyerStreet: "",
        buyerCity: "",
        buyerState: "FL",
        buyerPostalCode: "",
      }),
    ).toBe("");
    expect(
      buyerNoticeAddress({
        buyerStreet: "",
        buyerCity: "",
        buyerState: "FL",
        buyerPostalCode: "33602",
      }),
    ).toBe("FL 33602");
    expect(
      buyerNoticeAddress({
        buyerStreet: "400 Harbour Island Boulevard",
        buyerCity: "Tampa",
        buyerState: "FL",
        buyerPostalCode: "33602",
      }),
    ).toBe("400 Harbour Island Boulevard, Tampa, FL 33602");
    expect(buyerNoticeAddress({
      buyerStreet: "",
      buyerCity: "",
      buyerState: "",
      buyerPostalCode: "",
    })).toBe("");
    expect(displayValue(buyerNoticeAddress({
      buyerStreet: "",
      buyerCity: "",
      buyerState: "",
      buyerPostalCode: "",
    }))).toBe("—");
    expect(displayValue(buyerNoticeAddress({
      buyerStreet: "",
      buyerCity: "",
      buyerState: "FL",
      buyerPostalCode: "",
    }))).toBe("—");
    expect(
      formatBuyerNotice({
        ...completeNotice,
        buyerStreet: "",
        buyerCity: "",
        buyerState: "FL",
        buyerPostalCode: "",
      }),
    ).not.toMatch(/,\s*,/);
    expect(
      formatBuyerNotice({
        ...completeNotice,
        buyerStreet: "",
        buyerCity: "",
        buyerState: "FL",
        buyerPostalCode: "",
      }),
    ).not.toContain(", , FL");
    expect(
      formatBuyerNotice({
        ...completeNotice,
        buyerLegalName: "",
        buyerAttention: "",
        buyerEmail: "",
        buyerStreet: "",
        buyerCity: "",
        buyerState: "FL",
        buyerPostalCode: "",
        buyerPhone: "",
      }),
    ).toBe("");
  });

  it("omits empty authorized-agent parts instead of a lone comma", () => {
    expect(formatAuthorizedAgent({
      authorizedAgentName: "",
      authorizedAgentCompany: "",
    })).toBe("");
    expect(displayValue(formatAuthorizedAgent({
      authorizedAgentName: "",
      authorizedAgentCompany: "",
    }))).toBe("—");
    expect(formatAuthorizedAgent({
      authorizedAgentName: "Casey Nguyen",
      authorizedAgentCompany: "",
    })).toBe("Casey Nguyen");
    expect(formatAuthorizedAgent({
      authorizedAgentName: "Casey Nguyen",
      authorizedAgentCompany: "Suncoast Permitting",
    })).toBe("Casey Nguyen, Suncoast Permitting");
  });

  it("keeps complete notice and agent strings identical for agreement mapping", () => {
    expect(buyerNoticeAddress(completeNotice)).toBe(
      "400 Harbour Island Boulevard, Tampa, FL 33602",
    );
    expect(formatBuyerNotice(completeNotice)).toBe(
      "Suncoast Land Partners LLC, Attention: Morgan Hale, 400 Harbour Island Boulevard, Tampa, FL 33602, Phone 813-555-0190, Email morgan@suncoast.example",
    );
    expect(formatAuthorizedAgent(completeNotice)).toBe(
      "Casey Nguyen, Suncoast Permitting",
    );
    expect(formatBuyerWitness("Riley Chen", "riley@suncoast.example")).toBe(
      "Riley Chen · riley@suncoast.example",
    );
    expect(formatBuyerWitness("", "")).toBe("");
  });

  it("never emits dangling commas from joinPresent", () => {
    expect(joinPresent(["", "", "FL"])).toBe("FL");
    expect(joinPresent([",", "  ", ""])).toBe(",");
    expect(joinPresent(["Tampa", "", "FL"])).toBe("Tampa, FL");
    expect(joinPresent(["", ""])).toBe("");
  });
});
