import { describe, expect, it } from "vitest";
import {
  DOCUSIGN_ANCHOR_UNITS,
  DOCUSIGN_ANCHORS,
  DOCUSIGN_TAB_OFFSETS,
  type DocuSignRole,
} from "./docusign-anchors";

const ROLES: DocuSignRole[] = [
  "buyer_signer",
  "seller_signer",
  "buyer_witness",
  "seller_witness",
];

describe("DocuSign AutoPlace offsets", () => {
  it("defines pixel offsets for every role’s sign and date tabs", () => {
    expect(DOCUSIGN_ANCHOR_UNITS).toBe("pixels");
    expect(Object.keys(DOCUSIGN_TAB_OFFSETS)).toEqual(Object.keys(DOCUSIGN_ANCHORS));

    for (const role of ROLES) {
      const { sign, date } = DOCUSIGN_TAB_OFFSETS[role];
      for (const offset of [sign, date]) {
        expect(offset.anchorXOffset).toMatch(/^-?\d+$/);
        expect(offset.anchorYOffset).toMatch(/^-?\d+$/);
      }
      expect(Number(sign.anchorYOffset)).toBeLessThan(0);
      expect(Number(date.anchorXOffset)).toBeGreaterThan(0);
      expect(Number(date.anchorYOffset)).toBeLessThan(0);
    }
  });

  it("pulls seller signer further left than buyer because the By: line already has Van’s name", () => {
    expect(Number(DOCUSIGN_TAB_OFFSETS.seller_signer.sign.anchorXOffset)).toBeLessThan(
      Number(DOCUSIGN_TAB_OFFSETS.buyer_signer.sign.anchorXOffset),
    );
    expect(Number(DOCUSIGN_TAB_OFFSETS.seller_signer.date.anchorXOffset)).toBeLessThan(
      Number(DOCUSIGN_TAB_OFFSETS.buyer_signer.date.anchorXOffset),
    );
  });
});
