import { createHmac, generateKeyPairSync } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { brand, getSellerWitness } from "./brand";
import {
  DOCUSIGN_ANCHOR_UNITS,
  DOCUSIGN_ANCHORS,
  DOCUSIGN_TAB_OFFSETS,
} from "./docusign-anchors";
import {
  buildEnvelopeDefinition,
  buildEnvelopeRecipients,
  createJwtAssertion,
  dateSignedAnchorsForRole,
  dateSignedTabForRole,
  describeDocuSignSeam,
  DOCUSIGN_DATE_TAB_FONT,
  DOCUSIGN_DATE_TAB_FONT_SIZE,
  DOCUSIGN_ENV_VARS,
  extractBuyerSignedDateTime,
  getLiveEnvelopeStatus,
  isCompleteEnvelopeStatus,
  missingLiveConfigVars,
  parseConnectPayload,
  resetDocuSignTokenCache,
  sendEnvelope,
  signHereTab,
  verifyConnectSignature,
} from "./docusign";
import type { EnvelopeRecipient, IntakeFields } from "./types";

const recipients: EnvelopeRecipient[] = [
  { role: "buyer_signer", name: "Avery Cole", email: "avery@ridge.example" },
  { role: "seller_signer", name: "Andrew V. Pittman, Jr.", email: "vpittman@beachparkcap.com" },
  { role: "buyer_witness", name: "Lee Park", email: "lee@ridge.example" },
  { role: "seller_witness", name: "Pat Morales", email: "pat@canaanpreserve.example" },
];

const originalEnv = { ...process.env };
const { privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});

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

function sendInput() {
  return {
    engagementId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    reference: "CP-2026-TEST",
    recipients,
    document: {
      name: "CP-2026-TEST-canaan-preserve-agreement.docx",
      bytes: new Uint8Array([80, 75, 3, 4]),
      fileExtension: "docx",
    },
  };
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
  delete process.env.CANAAN_WITNESS_NAME;
  delete process.env.CANAAN_WITNESS_EMAIL;
  delete process.env.CANAAN_BUYER_WITNESS_EMAIL;
  resetDocuSignTokenCache();
});

describe("DocuSign seam", () => {
  it("defaults to a local stub and never claims network access", async () => {
    delete process.env.DOCUSIGN_ENABLED;
    const fetchMock = vi.fn();
    const seam = describeDocuSignSeam();
    expect(seam.mode).toBe("stub");
    expect(seam.makesNetworkCalls).toBe(false);

    const result = await sendEnvelope(sendInput(), { fetch: fetchMock });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.mode).toBe("stub");
    expect(result.status).toBe("sent");
    expect(result.envelopeId.startsWith("stub-")).toBe(true);
    expect(result.message).toMatch(/No DocuSign API call was made/i);
    expect(result.message).toContain("buyer_witness: Lee Park <lee@ridge.example>");
    expect(result.message).toContain("seller_witness: Pat Morales <pat@canaanpreserve.example>");
    expect(result.recipients).toEqual(recipients);
  });

  it("refuses live mode without credentials and still makes no API call", async () => {
    const fetchMock = vi.fn();
    process.env.DOCUSIGN_ENABLED = "true";
    process.env.DOCUSIGN_SECRET_KEY = "only-the-developer-app-secret";
    await expect(sendEnvelope(sendInput(), { fetch: fetchMock })).rejects.toThrow(
      /No API call was made/i,
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(missingLiveConfigVars()).toEqual(
      expect.arrayContaining([
        "DOCUSIGN_INTEGRATION_KEY",
        "DOCUSIGN_USER_ID",
        "DOCUSIGN_ACCOUNT_ID",
        "DOCUSIGN_PRIVATE_KEY or DOCUSIGN_PRIVATE_KEY_PATH",
      ]),
    );
  });

  it("lists env-only secret names and never embeds credential values", () => {
    expect(DOCUSIGN_ENV_VARS).toContain("DOCUSIGN_SECRET_KEY");
    expect(DOCUSIGN_ENV_VARS).toContain("DOCUSIGN_PRIVATE_KEY");
    expect(DOCUSIGN_ENV_VARS).toContain("DOCUSIGN_WEBHOOK_SECRET");
    expect(DOCUSIGN_ENV_VARS).not.toContain(privateKey);
  });

  it("keeps User ID and Account ID as empty names in committed env examples", () => {
    const envExample = readFileSync(resolve(process.cwd(), ".env.example"), "utf8");
    const devVars = readFileSync(resolve(process.cwd(), ".dev.vars.example"), "utf8");
    const guidAssignment =
      /DOCUSIGN_(USER_ID|ACCOUNT_ID)=[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
    expect(envExample).toMatch(/^DOCUSIGN_USER_ID=$/m);
    expect(envExample).toMatch(/^DOCUSIGN_ACCOUNT_ID=$/m);
    expect(envExample).not.toMatch(guidAssignment);
    expect(devVars).not.toMatch(guidAssignment);
  });

  it("sends a live envelope with JWT auth when DOCUSIGN_ENABLED=true", async () => {
    liveEnv();
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/oauth/token")) {
        const body = String(init?.body ?? "");
        expect(body).toContain("urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer");
        expect(body).toContain("assertion=");
        return new Response(
          JSON.stringify({ access_token: "tok-live", token_type: "Bearer", expires_in: 3600 }),
          { status: 200 },
        );
      }
      if (url.endsWith("/envelopes")) {
        const payload = JSON.parse(String(init?.body ?? "{}")) as ReturnType<
          typeof buildEnvelopeDefinition
        >;
        expect(init?.headers).toMatchObject({
          Authorization: "Bearer tok-live",
        });
        expect(payload.documents[0]?.fileExtension).toBe("docx");
        expect(payload.documents[0]?.documentBase64).toBe(
          Buffer.from(sendInput().document.bytes).toString("base64"),
        );
        expect(payload.recipients.signers.map((signer) => signer.roleName)).toEqual([
          "buyer_signer",
          "seller_signer",
          "buyer_witness",
          "seller_witness",
        ]);
        expect(payload.eventNotification?.url).toBe(
          "https://canaanpreserve.com/api/docusign/webhook",
        );
        return new Response(JSON.stringify({ envelopeId: "env-live-1", status: "sent" }), {
          status: 201,
        });
      }
      throw new Error(`Unexpected URL ${url}`);
    });

    const seam = describeDocuSignSeam();
    expect(seam.mode).toBe("live");
    expect(seam.makesNetworkCalls).toBe(true);
    expect(seam.missingLiveVars).toEqual([]);

    const result = await sendEnvelope(sendInput(), { fetch: fetchMock });
    expect(result.mode).toBe("live");
    expect(result.envelopeId).toBe("env-live-1");
    expect(result.message).toMatch(/DocuSign live/i);
    expect(result.message).toContain("buyer_witness: Lee Park <lee@ridge.example>");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not treat a non-PEM DOCUSIGN_SECRET_KEY as a JWT private key", () => {
    process.env.DOCUSIGN_ENABLED = "true";
    process.env.DOCUSIGN_INTEGRATION_KEY = "ik-test";
    process.env.DOCUSIGN_USER_ID = "user-guid";
    process.env.DOCUSIGN_ACCOUNT_ID = "account-guid";
    process.env.DOCUSIGN_SECRET_KEY = "app-secret-only";
    expect(missingLiveConfigVars()).toContain("DOCUSIGN_PRIVATE_KEY or DOCUSIGN_PRIVATE_KEY_PATH");
    expect(describeDocuSignSeam().makesNetworkCalls).toBe(false);
  });

  it("builds JWT claims from env placeholders only", () => {
    liveEnv();
    const jwt = createJwtAssertion(privateKey, 1_700_000_000);
    const [, payload] = jwt.split(".");
    const claims = JSON.parse(Buffer.from(payload!, "base64url").toString("utf8")) as {
      iss: string;
      sub: string;
      aud: string;
      scope: string;
    };
    expect(claims.iss).toBe("ik-test");
    expect(claims.sub).toBe("user-guid");
    expect(claims.aud).toBe("account-d.docusign.com");
    expect(claims.scope).toBe("signature impersonation");
  });

  it("routes Buyer and Canaan Ranch LLP signers plus Buyer witness and the fixed Canaan witness", () => {
    delete process.env.CANAAN_WITNESS_NAME;
    delete process.env.CANAAN_WITNESS_EMAIL;
    const intake = {
      buyerAttention: "Avery Cole",
      buyerEmail: "avery@ridge.example",
      buyerWitnessName: "Lee Park",
      buyerWitnessEmail: "lee@ridge.example",
      sellerWitnessName: "Pat Morales",
      sellerWitnessEmail: "pat@canaanpreserve.example",
    } as IntakeFields;
    const routed = buildEnvelopeRecipients(intake);
    expect(routed.map((row) => row.role)).toEqual([
      "buyer_signer",
      "seller_signer",
      "buyer_witness",
      "seller_witness",
    ]);
    expect(routed.find((row) => row.role === "seller_witness")).toEqual({
      role: "seller_witness",
      name: brand.sellerWitnessName,
      email: brand.sellerWitnessEmail,
    });
    expect(routed.find((row) => row.role === "seller_witness")?.name).not.toBe("Pat Morales");
    expect(routed.find((row) => row.role === "seller_signer")).toEqual({
      role: "seller_signer",
      name: brand.signatoryName,
      email: "vpittman@beachparkcap.com",
    });
    expect(brand.sellerWitnessName).toBe("Seller Witness");
    expect(brand.sellerWitnessEmail).toBe("vpittman@bourne-partners.com");
    expect(routed.find((row) => row.role === "buyer_witness")).toEqual({
      role: "buyer_witness",
      name: "Lee Park",
      email: "lee@ridge.example",
    });
  });

  it("uses intake Buyer witness email when CANAAN_BUYER_WITNESS_EMAIL is unset", () => {
    delete process.env.CANAAN_BUYER_WITNESS_EMAIL;
    const intake = {
      buyerAttention: "Avery Cole",
      buyerEmail: "avery@ridge.example",
      buyerWitnessName: "Lee Park",
      buyerWitnessEmail: "lee@ridge.example",
    } as IntakeFields;
    const routed = buildEnvelopeRecipients(intake);
    expect(routed.find((row) => row.role === "buyer_witness")).toEqual({
      role: "buyer_witness",
      name: "Lee Park",
      email: "lee@ridge.example",
    });
    expect(routed.find((row) => row.role === "buyer_signer")).toEqual({
      role: "buyer_signer",
      name: "Avery Cole",
      email: "avery@ridge.example",
    });
    expect(routed.find((row) => row.role === "seller_signer")?.email).toBe(brand.email);
  });

  it("overrides Buyer witness email from CANAAN_BUYER_WITNESS_EMAIL and keeps intake name", () => {
    process.env.CANAAN_BUYER_WITNESS_EMAIL = "vanpittman12@yahoo.com";
    const intake = {
      buyerAttention: "Avery Cole",
      buyerEmail: "avery@ridge.example",
      buyerWitnessName: "Lee Park",
      buyerWitnessEmail: "lee@ridge.example",
    } as IntakeFields;
    const routed = buildEnvelopeRecipients(intake);
    expect(routed.find((row) => row.role === "buyer_witness")).toEqual({
      role: "buyer_witness",
      name: "Lee Park",
      email: "vanpittman12@yahoo.com",
    });
    expect(routed.find((row) => row.role === "buyer_signer")).toEqual({
      role: "buyer_signer",
      name: "Avery Cole",
      email: "avery@ridge.example",
    });
    expect(routed.find((row) => row.role === "seller_signer")).toEqual({
      role: "seller_signer",
      name: brand.signatoryName,
      email: brand.email,
    });
    expect(routed.find((row) => row.role === "seller_witness")?.email).not.toBe(
      "vanpittman12@yahoo.com",
    );
  });

  it("uses env-overridable Canaan witness on stub routing", () => {
    process.env.CANAAN_WITNESS_NAME = "Jordan Blake";
    process.env.CANAAN_WITNESS_EMAIL = "jordan.blake@canaanpreserve.example";
    const intake = {
      buyerAttention: "Avery Cole",
      buyerEmail: "avery@ridge.example",
      buyerWitnessName: "Lee Park",
      buyerWitnessEmail: "lee@ridge.example",
    } as IntakeFields;
    expect(getSellerWitness()).toEqual({
      name: "Jordan Blake",
      email: "jordan.blake@canaanpreserve.example",
    });
    expect(buildEnvelopeRecipients(intake).find((row) => row.role === "seller_witness")).toEqual({
      role: "seller_witness",
      name: "Jordan Blake",
      email: "jordan.blake@canaanpreserve.example",
    });
  });
});

describe("DocuSign Connect and polling", () => {
  it("verifies HMAC signatures and parses JSON or XML payloads", () => {
    const body = JSON.stringify({
      event: "envelope-completed",
      data: { envelopeId: "env-1", envelopeSummary: { status: "completed" } },
    });
    const secret = "connect-hmac";
    const header = createHmac("sha256", secret).update(body, "utf8").digest("base64");
    expect(verifyConnectSignature(body, header, secret)).toBe(true);
    expect(verifyConnectSignature(body, "nope", secret)).toBe(false);
    expect(parseConnectPayload(body)).toEqual({
      envelopeId: "env-1",
      status: "completed",
      event: "envelope-completed",
      completedDateTime: null,
      buyerSignedDateTime: null,
    });
    expect(
      parseConnectPayload("<EnvelopeStatus><EnvelopeID>env-xml</EnvelopeID><Status>Completed</Status></EnvelopeStatus>"),
    ).toEqual({
      envelopeId: "env-xml",
      status: "Completed",
      event: null,
      completedDateTime: null,
      buyerSignedDateTime: null,
    });
    expect(isCompleteEnvelopeStatus("completed")).toBe(true);
    expect(isCompleteEnvelopeStatus("envelope-completed")).toBe(true);
    expect(isCompleteEnvelopeStatus("sent")).toBe(false);
  });

  it("polls envelope status through the live API", async () => {
    liveEnv();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/oauth/token")) {
        return new Response(JSON.stringify({ access_token: "tok-poll", expires_in: 3600 }), {
          status: 200,
        });
      }
      if (url.includes("/envelopes/env-live-1")) {
        expect(url).toContain("include=recipients");
        return new Response(
          JSON.stringify({
            envelopeId: "env-live-1",
            status: "completed",
            completedDateTime: "2026-06-03T16:00:00.000Z",
            recipients: {
              signers: [
                {
                  roleName: "buyer_signer",
                  signedDateTime: "2026-06-02T09:00:00.000Z",
                },
              ],
            },
          }),
          { status: 200 },
        );
      }
      throw new Error(`Unexpected URL ${url}`);
    });

    const snapshot = await getLiveEnvelopeStatus("env-live-1", { fetch: fetchMock });
    expect(snapshot).toEqual({
      envelopeId: "env-live-1",
      status: "completed",
      completedDateTime: "2026-06-03T16:00:00.000Z",
      buyerSignedDateTime: "2026-06-02T09:00:00.000Z",
    });
    expect(isCompleteEnvelopeStatus(snapshot.status)).toBe(true);
  });

  it("places Date Signed tabs only on signature blocks, never on body leftovers", () => {
    const definition = buildEnvelopeDefinition(sendInput());
    const roles = ["buyer_signer", "seller_signer", "buyer_witness", "seller_witness"] as const;
    expect(dateSignedAnchorsForRole("buyer_signer")).toEqual([DOCUSIGN_ANCHORS.buyer_signer.date]);
    expect(dateSignedAnchorsForRole("buyer_witness")).toEqual([DOCUSIGN_ANCHORS.buyer_witness.date]);
    expect(dateSignedAnchorsForRole("seller_signer")).toEqual([DOCUSIGN_ANCHORS.seller_signer.date]);
    expect(dateSignedAnchorsForRole("seller_witness")).toEqual([DOCUSIGN_ANCHORS.seller_witness.date]);

    for (const role of roles) {
      const signer = definition.recipients.signers.find((row) => row.roleName === role);
      expect(signer).toBeDefined();
      expect(signer?.tabs).not.toHaveProperty("textTabs");
      expect(signer?.tabs).not.toHaveProperty("dateTabs");
      expect(signer?.tabs.dateSignedTabs.map((tab) => tab.anchorString)).toEqual(
        dateSignedAnchorsForRole(role),
      );
      expect(
        signer?.tabs.dateSignedTabs.every(
          (tab) =>
            tab.anchorUnits === DOCUSIGN_ANCHOR_UNITS &&
            tab.anchorXOffset === DOCUSIGN_TAB_OFFSETS[role].date.anchorXOffset &&
            tab.anchorYOffset === DOCUSIGN_TAB_OFFSETS[role].date.anchorYOffset &&
            tab.anchorIgnoreIfNotPresent === "false" &&
            tab.font === DOCUSIGN_DATE_TAB_FONT &&
            tab.fontSize === DOCUSIGN_DATE_TAB_FONT_SIZE &&
            tab.fontColor === "Black" &&
            tab.underline === "false",
        ),
      ).toBe(true);
      expect(signer?.tabs.dateSignedTabs.some((tab) => tab.anchorString === "/date_effective/")).toBe(
        false,
      );
    }
  });

  it("offsets Sign Here and Date Signed tabs per role so they sit on the signature line", () => {
    const definition = buildEnvelopeDefinition(sendInput());
    const roles = ["buyer_signer", "seller_signer", "buyer_witness", "seller_witness"] as const;

    for (const role of roles) {
      const signer = definition.recipients.signers.find((row) => row.roleName === role);
      const sign = signer?.tabs.signHereTabs[0];
      const date = signer?.tabs.dateSignedTabs[0];
      const expectedSign = signHereTab(role);
      const expectedDate = dateSignedTabForRole(role);

      expect(sign).toEqual(expectedSign);
      expect(date).toEqual(expectedDate);
      expect(sign?.anchorUnits).toBe("pixels");
      expect(sign?.anchorXOffset).toMatch(/^-?\d+$/);
      expect(sign?.anchorYOffset).toMatch(/^-?\d+$/);
      expect(Number(sign?.anchorYOffset)).toBeLessThan(0);
      expect(Number(date?.anchorXOffset)).toBeGreaterThan(0);
      expect(Number(date?.anchorYOffset)).toBeLessThan(0);
    }

    const buyerSign = signHereTab("buyer_signer");
    const sellerSign = signHereTab("seller_signer");
    expect(Number(sellerSign.anchorXOffset)).toBeLessThan(Number(buyerSign.anchorXOffset));
    expect(Number(dateSignedTabForRole("seller_signer").anchorXOffset)).toBeLessThan(
      Number(dateSignedTabForRole("buyer_signer").anchorXOffset),
    );
    expect(DOCUSIGN_TAB_OFFSETS.buyer_witness).toEqual(DOCUSIGN_TAB_OFFSETS.seller_witness);
  });

  it("reads the Buyer Date Signed from an envelope or Connect payload", () => {
    expect(
      extractBuyerSignedDateTime({
        completedDateTime: "2026-06-03T16:00:00.000Z",
        recipients: {
          signers: [
            { roleName: "seller_signer", signedDateTime: "2026-06-03T16:00:00.000Z" },
            { roleName: "buyer_signer", signedDateTime: "2026-06-02T09:00:00.000Z" },
          ],
        },
      }),
    ).toBe("2026-06-02T09:00:00.000Z");

    const payload = parseConnectPayload(
      JSON.stringify({
        event: "envelope-completed",
        data: {
          envelopeId: "env-2",
          envelopeSummary: {
            status: "completed",
            completedDateTime: "2026-06-03T16:00:00.000Z",
            recipients: {
              signers: [{ roleName: "buyer_signer", signedDateTime: "2026-06-02T09:15:00.000Z" }],
            },
          },
        },
      }),
    );
    expect(payload.buyerSignedDateTime).toBe("2026-06-02T09:15:00.000Z");
    expect(payload.completedDateTime).toBe("2026-06-03T16:00:00.000Z");
  });
});
