import { afterEach, describe, expect, it } from "vitest";
import { describeDocuSignSeam, sendEnvelope } from "./docusign";

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
      reference: "CR-2026-TEST",
      signerName: "Avery Cole",
      signerEmail: "avery@ridge.example",
    });

    expect(result.mode).toBe("stub");
    expect(result.status).toBe("sent");
    expect(result.envelopeId.startsWith("stub-")).toBe(true);
    expect(result.message).toMatch(/No DocuSign API call was made/i);
  });

  it("refuses live mode without credentials and still makes no API call", async () => {
    process.env.DOCUSIGN_ENABLED = "true";
    await expect(
      sendEnvelope({
        engagementId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        reference: "CR-2026-TEST",
        signerName: "Avery Cole",
        signerEmail: "avery@ridge.example",
      }),
    ).rejects.toThrow(/No API call was made/i);
  });
});
