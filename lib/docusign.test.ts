import { afterEach, describe, expect, it } from "vitest";
import { buildEnvelopeRecipients, describeDocuSignSeam, sendEnvelope } from "./docusign";
import type { EnvelopeRecipient, IntakeFields } from "./types";

const recipients: EnvelopeRecipient[] = [
  { role: "buyer_signer", name: "Avery Cole", email: "avery@ridge.example" },
  { role: "seller_signer", name: "Andrew V. Pittman, Jr.", email: "engagements@canaanpreserve.com" },
  { role: "buyer_witness", name: "Lee Park", email: "lee@ridge.example" },
  { role: "seller_witness", name: "Pat Morales", email: "pat@canaanpreserve.example" },
];

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  delete process.env.DOCUSIGN_ENABLED;
});

describe("DocuSign seam", () => {
  it("defaults to a local stub and never claims network access", async () => {
    delete process.env.DOCUSIGN_ENABLED;
    const seam = describeDocuSignSeam();
    expect(seam.mode).toBe("stub");
    expect(seam.makesNetworkCalls).toBe(false);

    const result = await sendEnvelope({
      engagementId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      reference: "CP-2026-TEST",
      recipients,
    });

    expect(result.mode).toBe("stub");
    expect(result.status).toBe("sent");
    expect(result.envelopeId.startsWith("stub-")).toBe(true);
    expect(result.message).toMatch(/No DocuSign API call was made/i);
    expect(result.message).toContain("buyer_witness: Lee Park <lee@ridge.example>");
    expect(result.message).toContain("seller_witness: Pat Morales <pat@canaanpreserve.example>");
    expect(result.recipients).toEqual(recipients);
  });

  it("refuses live mode without credentials and still makes no API call", async () => {
    process.env.DOCUSIGN_ENABLED = "true";
    await expect(
      sendEnvelope({
        engagementId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        reference: "CP-2026-TEST",
        recipients,
      }),
    ).rejects.toThrow(/No API call was made/i);
  });

  it("routes Buyer and Canaan Ranch LLP signers plus one witness each", () => {
    const intake = {
      buyerAttention: "Avery Cole",
      buyerEmail: "avery@ridge.example",
      buyerWitnessName: "Lee Park",
      buyerWitnessEmail: "lee@ridge.example",
      sellerWitnessName: "Pat Morales",
      sellerWitnessEmail: "pat@canaanpreserve.example",
    } as IntakeFields;
    expect(buildEnvelopeRecipients(intake).map((row) => row.role)).toEqual([
      "buyer_signer",
      "seller_signer",
      "buyer_witness",
      "seller_witness",
    ]);
  });
});
