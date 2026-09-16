import { generateKeyPairSync } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { applySubmit } from "./engagement";
import {
  docusignSubmitWillUseLiveApi,
  recordDocuSignSendFailure,
  sendDocuSignForEngagement,
  shouldSendDocuSignOnSubmit,
} from "./docusign-send";
import { resetDocuSignTokenCache } from "./docusign";
import { emptyReservationLetter, type Engagement, type IntakeFields } from "./types";

const originalEnv = { ...process.env };
const { privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});

const intake: IntakeFields = {
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
  donorSiteDescription: "",
  buyerWitnessName: "Riley Chen",
  buyerWitnessEmail: "riley@suncoast.example",
  sellerWitnessName: "Andrew Fuddy",
  sellerWitnessEmail: "witness@canaanpreserve.com",
};

function draft(): Engagement {
  return {
    id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    reference: "CP-2026-TEST",
    status: "draft",
    effectiveDate: null,
    intake,
    signingMethod: null,
    signedArtifact: null,
    docusign: {
      mode: "stub",
      envelopeId: null,
      status: "not_sent",
      sentAt: null,
      completedAt: null,
      lastMessage: null,
      recipients: [],
    },
    reservationLetter: emptyReservationLetter(),
    reviews: [],
    changeRequestNote: null,
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
    submittedAt: null,
    acceptedAt: null,
    executedAt: null,
  };
}

function liveEnv() {
  process.env.DOCUSIGN_ENABLED = "true";
  process.env.DOCUSIGN_INTEGRATION_KEY = "ik-test";
  process.env.DOCUSIGN_SECRET_KEY = "ds-secret-not-a-pem";
  process.env.DOCUSIGN_USER_ID = "user-guid";
  process.env.DOCUSIGN_ACCOUNT_ID = "account-guid";
  process.env.DOCUSIGN_ACCOUNT_BASE_URI = "https://demo.docusign.net";
  process.env.DOCUSIGN_AUTH_SERVER = "https://account-d.docusign.com";
  process.env.DOCUSIGN_PRIVATE_KEY = privateKey;
  process.env.DOCUSIGN_RETURN_URL = "https://canaanpreserve.com/api/docusign/return";
  process.env.DOCUSIGN_WEBHOOK_SECRET = "connect-hmac";
}

afterEach(() => {
  process.env = { ...originalEnv };
  delete process.env.DOCUSIGN_ENABLED;
  delete process.env.DOCUSIGN_INTEGRATION_KEY;
  delete process.env.DOCUSIGN_SECRET_KEY;
  delete process.env.DOCUSIGN_USER_ID;
  delete process.env.DOCUSIGN_ACCOUNT_ID;
  delete process.env.DOCUSIGN_ACCOUNT_BASE_URI;
  delete process.env.DOCUSIGN_AUTH_SERVER;
  delete process.env.DOCUSIGN_PRIVATE_KEY;
  delete process.env.DOCUSIGN_PRIVATE_KEY_PATH;
  delete process.env.DOCUSIGN_WEBHOOK_SECRET;
  delete process.env.DOCUSIGN_WEBHOOK_URL;
  delete process.env.DOCUSIGN_RETURN_URL;
  resetDocuSignTokenCache();
});

describe("intake submit DocuSign send", () => {
  it("triggers send on intake submit when DocuSign signing is selected", () => {
    const submitted = applySubmit(draft(), "docusign");
    expect(shouldSendDocuSignOnSubmit(submitted)).toBe(true);
    expect(submitted.status).toBe("accepted");
  });

  it("does not send DocuSign on manual submit", () => {
    const submitted = applySubmit(draft(), "manual");
    expect(shouldSendDocuSignOnSubmit(submitted)).toBe(false);
    expect(submitted.status).toBe("pending_review");
  });

  it("does not send again when an envelope is already on file (Accept no-op)", () => {
    const submitted = applySubmit(draft(), "docusign");
    const withEnvelope = {
      ...submitted,
      docusign: {
        ...submitted.docusign,
        envelopeId: "env-already-sent",
        status: "sent" as const,
      },
    };
    expect(shouldSendDocuSignOnSubmit(withEnvelope)).toBe(false);
  });

  it("sends a stub envelope from a submitted DocuSign engagement", async () => {
    delete process.env.DOCUSIGN_ENABLED;
    const submitted = applySubmit(draft(), "docusign");
    const fetchMock = vi.fn();
    const sent = await sendDocuSignForEngagement(submitted, { fetch: fetchMock });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(sent.status).toBe("accepted");
    expect(sent.docusign.status).toBe("sent");
    expect(sent.docusign.envelopeId?.startsWith("stub-")).toBe(true);
    expect(sent.docusign.recipients.map((row) => row.role)).toEqual([
      "buyer_signer",
      "seller_signer",
      "buyer_witness",
      "seller_witness",
    ]);
  });

  it("intake submit triggers a live send when DOCUSIGN_ENABLED=true", async () => {
    liveEnv();
    expect(docusignSubmitWillUseLiveApi()).toBe(true);
    const submitted = applySubmit(draft(), "docusign");
    expect(shouldSendDocuSignOnSubmit(submitted)).toBe(true);

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/oauth/token")) {
        return new Response(
          JSON.stringify({ access_token: "tok-live", token_type: "Bearer", expires_in: 3600 }),
          { status: 200 },
        );
      }
      if (url.endsWith("/envelopes")) {
        const payload = JSON.parse(String(init?.body ?? "{}")) as {
          status: string;
          recipients: { signers: Array<{ roleName: string; routingOrder: string }> };
        };
        expect(payload.status).toBe("sent");
        const byRole = Object.fromEntries(
          payload.recipients.signers.map((signer) => [signer.roleName, signer.routingOrder]),
        );
        expect(byRole.buyer_signer).toBe("1");
        expect(byRole.buyer_witness).toBe("2");
        expect(byRole.seller_signer).toBe("3");
        expect(byRole.seller_witness).toBe("4");
        return new Response(JSON.stringify({ envelopeId: "env-live-submit", status: "sent" }), {
          status: 201,
        });
      }
      throw new Error(`Unexpected URL ${url}`);
    });

    const sent = await sendDocuSignForEngagement(submitted, { fetch: fetchMock });
    expect(sent.docusign.mode).toBe("live");
    expect(sent.docusign.envelopeId).toBe("env-live-submit");
    expect(sent.docusign.status).toBe("sent");
    expect(sent.status).toBe("accepted");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("records an intake-submit send failure without dropping accepted-for-signing", () => {
    const submitted = applySubmit(draft(), "docusign");
    const failed = recordDocuSignSendFailure(submitted, "DocuSign 400", "intake_submit");
    expect(failed.status).toBe("accepted");
    expect(failed.docusign.envelopeId).toBeNull();
    expect(failed.docusign.lastMessage).toMatch(/after intake submit/);
    expect(shouldSendDocuSignOnSubmit(failed)).toBe(true);
  });

  it("wires public intake submit to send before admin Accept", () => {
    const submitSrc = readFileSync(resolve(process.cwd(), "app/actions/engagements.ts"), "utf8");
    const adminSrc = readFileSync(resolve(process.cwd(), "app/actions/admin.ts"), "utf8");
    expect(submitSrc).toContain("shouldSendDocuSignOnSubmit");
    expect(submitSrc).toContain("next = await sendDocuSignForEngagement(next)");
    expect(submitSrc.indexOf("Persist submit before populate")).toBeLessThan(
      submitSrc.indexOf("next = await sendDocuSignForEngagement(next)"),
    );
    expect(submitSrc).toContain("intake_submit");
    expect(adminSrc).toContain("shouldSendDocuSignOnSubmit");
    expect(adminSrc).toContain("resendDocuSign");
    expect(adminSrc).toContain("Persist Accept before DOCX populate");
    expect(adminSrc.indexOf("Persist Accept before DOCX populate")).toBeLessThan(
      adminSrc.indexOf("next = await sendDocuSignForEngagement(next)"),
    );
    expect(readFileSync(resolve(process.cwd(), "lib/docusign-send.ts"), "utf8")).toContain(
      "stampProvisionalExpiration: true",
    );
  });
});
