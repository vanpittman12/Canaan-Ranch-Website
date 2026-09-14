/**
 * DocuSign integration seam.
 *
 * When DOCUSIGN_ENABLED is not "true", sendEnvelope() records a local stub
 * envelope and makes no network calls. When the flag is true, sendEnvelopeLive()
 * uses JWT grant + Envelopes:create. Secrets are read from the environment only.
 */
import { createHmac, createSign, randomUUID, timingSafeEqual } from "node:crypto";
import { brand, getSellerWitness } from "./brand";
import type {
  DocuSignEnvelopeStatus,
  DocuSignMode,
  EnvelopeRecipient,
  IntakeFields,
} from "./types";

export const DOCUSIGN_ENV_VARS = [
  "DOCUSIGN_ENABLED",
  "DOCUSIGN_INTEGRATION_KEY",
  "DOCUSIGN_SECRET_KEY",
  "DOCUSIGN_USER_ID",
  "DOCUSIGN_ACCOUNT_ID",
  "DOCUSIGN_ACCOUNT_BASE_URI",
  "DOCUSIGN_AUTH_SERVER",
  "DOCUSIGN_PRIVATE_KEY",
  "DOCUSIGN_PRIVATE_KEY_PATH",
  "DOCUSIGN_WEBHOOK_SECRET",
  "DOCUSIGN_WEBHOOK_URL",
  "DOCUSIGN_RETURN_URL",
] as const;

export type { DocuSignMode, EnvelopeRecipient };

export const DEFAULT_ACCOUNT_BASE_URI = "https://demo.docusign.net";
export const DEFAULT_AUTH_SERVER = "https://account-d.docusign.com";

import { DOCUSIGN_ANCHORS } from "./docusign-anchors";

export { DOCUSIGN_ANCHORS };

const REQUIRED_LIVE_VARS = [
  "DOCUSIGN_INTEGRATION_KEY",
  "DOCUSIGN_USER_ID",
  "DOCUSIGN_ACCOUNT_ID",
] as const;

const RECIPIENT_ROUTING: Record<
  EnvelopeRecipient["role"],
  { recipientId: string; routingOrder: string }
> = {
  buyer_signer: { recipientId: "1", routingOrder: "1" },
  buyer_witness: { recipientId: "2", routingOrder: "2" },
  seller_signer: { recipientId: "3", routingOrder: "3" },
  seller_witness: { recipientId: "4", routingOrder: "4" },
};

export interface DocuSignDocument {
  name: string;
  bytes: Uint8Array;
  fileExtension?: string;
}

export interface DocuSignSendInput {
  engagementId: string;
  reference: string;
  recipients: EnvelopeRecipient[];
  document?: DocuSignDocument;
}

export interface DocuSignSendResult {
  mode: DocuSignMode;
  envelopeId: string;
  status: "sent";
  message: string;
  recipients: EnvelopeRecipient[];
}

export interface DocuSignHttp {
  fetch: typeof fetch;
  readPrivateKeyFile?: (path: string) => Promise<string>;
}

export interface ConnectEvent {
  envelopeId: string | null;
  status: string | null;
  event: string | null;
}

export interface LiveEnvelopeSnapshot {
  envelopeId: string;
  status: string;
}

type EnvelopeSigner = {
  email: string;
  name: string;
  recipientId: string;
  routingOrder: string;
  roleName: EnvelopeRecipient["role"];
  tabs: {
    signHereTabs: Array<{
      anchorString: string;
      anchorUnits: string;
      anchorIgnoreIfNotPresent: string;
    }>;
    dateSignedTabs: Array<{
      anchorString: string;
      anchorUnits: string;
      anchorIgnoreIfNotPresent: string;
    }>;
  };
};

export type EnvelopeDefinition = {
  emailSubject: string;
  status: "sent";
  documents: Array<{
    documentId: string;
    name: string;
    fileExtension: string;
    documentBase64: string;
  }>;
  recipients: { signers: EnvelopeSigner[] };
  customFields: {
    textCustomFields: Array<{
      name: string;
      value: string;
      required: string;
      show: string;
    }>;
  };
  eventNotification?: {
    url: string;
    requireAcknowledgment: string;
    loggingEnabled: string;
    includeDocuments: string;
    includeHMAC: string;
    envelopeEvents: Array<{ envelopeEventStatusCode: string }>;
  };
};

let tokenCache: { token: string; expiresAt: number } | null = null;

export function resetDocuSignTokenCache() {
  tokenCache = null;
}

export function isDocuSignEnabled() {
  return process.env.DOCUSIGN_ENABLED === "true";
}

export function docusignAccountBaseUri() {
  return stripSlash(process.env.DOCUSIGN_ACCOUNT_BASE_URI || DEFAULT_ACCOUNT_BASE_URI);
}

export function docusignAuthServer() {
  return stripSlash(process.env.DOCUSIGN_AUTH_SERVER || DEFAULT_AUTH_SERVER);
}

export function authServerAudience() {
  return new URL(docusignAuthServer()).host;
}

export function looksLikePem(value: string) {
  return /BEGIN (?:RSA )?PRIVATE KEY/.test(value);
}

export function normalizePem(value: string) {
  let pem = value.trim();
  if (
    (pem.startsWith('"') && pem.endsWith('"')) ||
    (pem.startsWith("'") && pem.endsWith("'"))
  ) {
    pem = pem.slice(1, -1);
  }
  return pem.replace(/\\n/g, "\n");
}

export function missingLiveConfigVars() {
  const missing: string[] = REQUIRED_LIVE_VARS.filter((name) => !process.env[name]?.trim());
  if (!hasJwtPrivateKeyMaterial()) {
    missing.push("DOCUSIGN_PRIVATE_KEY or DOCUSIGN_PRIVATE_KEY_PATH");
  }
  return missing;
}

export function describeDocuSignSeam() {
  const enabled = isDocuSignEnabled();
  const missing = missingLiveConfigVars();
  return {
    enabled,
    mode: enabled ? ("live" as const) : ("stub" as const),
    missingLiveVars: missing,
    makesNetworkCalls: enabled && missing.length === 0,
  };
}

export function buildEnvelopeRecipients(intake: IntakeFields): EnvelopeRecipient[] {
  const sellerWitness = getSellerWitness();
  return [
    { role: "buyer_signer", name: intake.buyerAttention, email: intake.buyerEmail },
    { role: "seller_signer", name: brand.signatoryName, email: brand.email },
    {
      role: "buyer_witness",
      name: intake.buyerWitnessName,
      email: intake.buyerWitnessEmail,
    },
    {
      role: "seller_witness",
      name: sellerWitness.name,
      email: sellerWitness.email,
    },
  ];
}

export function formatRoutingSummary(recipients: EnvelopeRecipient[]) {
  return recipients
    .map((recipient) => `${recipient.role}: ${recipient.name} <${recipient.email}>`)
    .join("; ");
}

export function resolveWebhookUrl() {
  const explicit = process.env.DOCUSIGN_WEBHOOK_URL?.trim();
  if (explicit) {
    return stripSlash(explicit);
  }
  const returnUrl = process.env.DOCUSIGN_RETURN_URL?.trim();
  if (!returnUrl) {
    return null;
  }
  try {
    return `${new URL(returnUrl).origin}/api/docusign/webhook`;
  } catch {
    return null;
  }
}

export function resolveReturnUrl(engagementId?: string) {
  const configured = process.env.DOCUSIGN_RETURN_URL?.trim();
  if (!configured) {
    return null;
  }
  try {
    const url = new URL(configured);
    if (engagementId) {
      url.searchParams.set("engagementId", engagementId);
    }
    return url.toString();
  } catch {
    return configured;
  }
}

export function bytesToBase64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64");
}

export function documentFileExtension(document: DocuSignDocument) {
  if (document.fileExtension?.trim()) {
    return document.fileExtension.replace(/^\./, "").toLowerCase();
  }
  const match = document.name.match(/\.([a-z0-9]+)$/i);
  return match?.[1]?.toLowerCase() || "docx";
}

export function buildEnvelopeDefinition(input: DocuSignSendInput): EnvelopeDefinition {
  if (!input.document?.bytes.length) {
    throw new Error(
      "DocuSign live send requires the populated agreement (Van’s Word file with intake fields filled) as the envelope document.",
    );
  }

  const webhookUrl = resolveWebhookUrl();
  const definition: EnvelopeDefinition = {
    emailSubject: `Canaan Preserve relocation agreement ${input.reference}`,
    status: "sent",
    documents: [
      {
        documentId: "1",
        name: input.document.name,
        fileExtension: documentFileExtension(input.document),
        documentBase64: bytesToBase64(input.document.bytes),
      },
    ],
    recipients: {
      signers: input.recipients.map((recipient) => {
        const routing = RECIPIENT_ROUTING[recipient.role];
        const anchors = DOCUSIGN_ANCHORS[recipient.role];
        return {
          email: recipient.email,
          name: recipient.name,
          recipientId: routing.recipientId,
          routingOrder: routing.routingOrder,
          roleName: recipient.role,
          tabs: {
            signHereTabs: [
              {
                anchorString: anchors.sign,
                anchorUnits: "pixels",
                anchorIgnoreIfNotPresent: "false",
              },
            ],
            dateSignedTabs: [
              {
                anchorString: anchors.date,
                anchorUnits: "pixels",
                anchorIgnoreIfNotPresent: "false",
              },
            ],
          },
        };
      }),
    },
    customFields: {
      textCustomFields: [
        {
          name: "engagementId",
          value: input.engagementId,
          required: "false",
          show: "false",
        },
        {
          name: "reference",
          value: input.reference,
          required: "false",
          show: "false",
        },
      ],
    },
  };

  if (webhookUrl) {
    definition.eventNotification = {
      url: webhookUrl,
      requireAcknowledgment: "true",
      loggingEnabled: "true",
      includeDocuments: "false",
      includeHMAC: "true",
      envelopeEvents: [
        { envelopeEventStatusCode: "completed" },
        { envelopeEventStatusCode: "declined" },
        { envelopeEventStatusCode: "voided" },
      ],
    };
  }

  return definition;
}

export async function sendEnvelope(
  input: DocuSignSendInput,
  http?: DocuSignHttp,
): Promise<DocuSignSendResult> {
  if (isDocuSignEnabled()) {
    return sendEnvelopeLive(input, http);
  }
  return sendEnvelopeStub(input);
}

function sendEnvelopeStub(input: DocuSignSendInput): DocuSignSendResult {
  const routing = formatRoutingSummary(input.recipients);
  return {
    mode: "stub",
    envelopeId: `stub-${input.engagementId.slice(0, 8)}-${randomUUID().slice(0, 8)}`,
    status: "sent",
    message: `DocuSign stub: envelope queued locally for ${input.reference}. Routing: ${routing}. No DocuSign API call was made. Set DOCUSIGN_ENABLED=true with live credentials to send a real envelope.`,
    recipients: input.recipients,
  };
}

export async function sendEnvelopeLive(
  input: DocuSignSendInput,
  http: DocuSignHttp = defaultHttp(),
): Promise<DocuSignSendResult> {
  const missing = missingLiveConfigVars();
  if (missing.length > 0) {
    throw new Error(
      `DocuSign live mode is flagged on, but configuration is incomplete (${missing.join(", ")}). No API call was made.`,
    );
  }

  const definition = buildEnvelopeDefinition(input);
  const token = await requestAccessToken(http);
  const response = await http.fetch(envelopesCollectionUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(definition),
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(formatApiError("Envelopes:create", body, response.status));
  }

  const parsed = parseJson(body) as { envelopeId?: string; status?: string };
  if (!parsed.envelopeId) {
    throw new Error("DocuSign Envelopes:create did not return an envelopeId.");
  }

  const routing = formatRoutingSummary(input.recipients);
  return {
    mode: "live",
    envelopeId: parsed.envelopeId,
    status: "sent",
    message: `DocuSign live: envelope ${parsed.envelopeId} sent for ${input.reference}. Routing: ${routing}.`,
    recipients: input.recipients,
  };
}

export async function requestAccessToken(http: DocuSignHttp = defaultHttp()): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 15_000) {
    return tokenCache.token;
  }

  const pem = await readPrivateKeyPem(http);
  const assertion = createJwtAssertion(pem);
  const response = await http.fetch(`${docusignAuthServer()}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(formatTokenError(body));
  }

  const parsed = parseJson(body) as { access_token?: string; expires_in?: number };
  if (!parsed.access_token) {
    throw new Error("DocuSign token response did not include access_token.");
  }

  tokenCache = {
    token: parsed.access_token,
    expiresAt: Date.now() + (parsed.expires_in ?? 3600) * 1000,
  };
  return parsed.access_token;
}

export function createJwtAssertion(pem: string, nowSeconds = Math.floor(Date.now() / 1000)) {
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: requiredEnv("DOCUSIGN_INTEGRATION_KEY"),
    sub: requiredEnv("DOCUSIGN_USER_ID"),
    aud: authServerAudience(),
    iat: nowSeconds,
    exp: nowSeconds + 3600,
    scope: "signature impersonation",
  };
  const data = `${base64UrlJson(header)}.${base64UrlJson(payload)}`;
  const signer = createSign("RSA-SHA256");
  signer.update(data);
  signer.end();
  return `${data}.${signer.sign(normalizePem(pem), "base64url")}`;
}

export async function readPrivateKeyPem(http: DocuSignHttp = defaultHttp()) {
  const inline = process.env.DOCUSIGN_PRIVATE_KEY;
  if (inline?.trim()) {
    return normalizePem(inline);
  }
  const keyPath = process.env.DOCUSIGN_PRIVATE_KEY_PATH?.trim();
  if (keyPath) {
    const reader = http.readPrivateKeyFile ?? defaultReadPrivateKeyFile;
    return normalizePem(await reader(keyPath));
  }
  const secret = process.env.DOCUSIGN_SECRET_KEY;
  if (secret && looksLikePem(secret)) {
    return normalizePem(secret);
  }
  throw new Error(
    "DocuSign JWT grant needs an RSA private key. Set DOCUSIGN_PRIVATE_KEY (PEM) or DOCUSIGN_PRIVATE_KEY_PATH. DOCUSIGN_SECRET_KEY is the developer-app Secret Key and is not used for JWT unless it is itself a PEM.",
  );
}

export async function getLiveEnvelopeStatus(
  envelopeId: string,
  http: DocuSignHttp = defaultHttp(),
): Promise<LiveEnvelopeSnapshot> {
  const token = await requestAccessToken(http);
  const response = await http.fetch(envelopeUrl(envelopeId), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(formatApiError("Envelopes:get", body, response.status));
  }
  const parsed = parseJson(body) as { envelopeId?: string; status?: string };
  return {
    envelopeId: parsed.envelopeId ?? envelopeId,
    status: parsed.status ?? "",
  };
}

export async function downloadLiveCombinedDocument(
  envelopeId: string,
  http: DocuSignHttp = defaultHttp(),
): Promise<Uint8Array> {
  const token = await requestAccessToken(http);
  const response = await http.fetch(`${envelopeUrl(envelopeId)}/documents/combined`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/pdf",
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(formatApiError("Envelopes:documents", body, response.status));
  }
  return new Uint8Array(await response.arrayBuffer());
}

export function verifyConnectSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  secret = process.env.DOCUSIGN_WEBHOOK_SECRET,
) {
  if (!secret || !signatureHeader) {
    return false;
  }
  const candidates = signatureHeader
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return ["sha256", "sha1"].some((algorithm) => {
    const expected = createHmac(algorithm, secret).update(rawBody, "utf8").digest("base64");
    return candidates.some((candidate) => timingSafeEqualText(candidate, expected));
  });
}

export function parseConnectPayload(rawBody: string): ConnectEvent {
  const trimmed = rawBody.trim();
  if (!trimmed) {
    return { envelopeId: null, status: null, event: null };
  }
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    const json = parseJson(trimmed) as Record<string, unknown>;
    const data = asRecord(json.data) ?? json;
    const summary = asRecord(data.envelopeSummary) ?? asRecord(json.envelopeSummary) ?? {};
    return {
      envelopeId: stringOrNull(data.envelopeId ?? json.envelopeId ?? summary.envelopeId),
      status: stringOrNull(summary.status ?? data.status ?? json.status),
      event: stringOrNull(json.event ?? data.event),
    };
  }

  return {
    envelopeId: trimmed.match(/<EnvelopeID>([^<]+)<\/EnvelopeID>/i)?.[1] ?? null,
    status: trimmed.match(/<Status>([^<]+)<\/Status>/i)?.[1] ?? null,
    event: null,
  };
}

export function normalizeEnvelopeStatus(
  status: string | null | undefined,
): DocuSignEnvelopeStatus | null {
  const value = status?.trim().toLowerCase();
  if (!value) {
    return null;
  }
  if (value === "sent") {
    return "sent";
  }
  if (value === "delivered") {
    return "delivered";
  }
  if (value === "completed" || value === "envelope-completed") {
    return "completed";
  }
  if (value === "voided" || value === "declined" || value === "envelope-declined" || value === "envelope-voided") {
    return "voided";
  }
  return null;
}

export function isCompleteEnvelopeStatus(status: string | null | undefined) {
  return normalizeEnvelopeStatus(status) === "completed";
}

export function buildStubSignedFilename(reference: string) {
  return `${reference}-docusign-stub-signed.pdf`;
}

export function buildLiveSignedFilename(reference: string) {
  return `${reference}-docusign-signed.pdf`;
}

function hasJwtPrivateKeyMaterial() {
  return Boolean(
    process.env.DOCUSIGN_PRIVATE_KEY?.trim() ||
      process.env.DOCUSIGN_PRIVATE_KEY_PATH?.trim() ||
      looksLikePem(process.env.DOCUSIGN_SECRET_KEY ?? ""),
  );
}

function defaultHttp(): DocuSignHttp {
  return { fetch: globalThis.fetch.bind(globalThis) };
}

async function defaultReadPrivateKeyFile(path: string) {
  const { readFile } = await import("node:fs/promises");
  return readFile(path, "utf8");
}

function envelopesCollectionUrl() {
  return `${docusignAccountBaseUri()}/restapi/v2.1/accounts/${requiredEnv("DOCUSIGN_ACCOUNT_ID")}/envelopes`;
}

function envelopeUrl(envelopeId: string) {
  return `${envelopesCollectionUrl()}/${encodeURIComponent(envelopeId)}`;
}

function requiredEnv(name: (typeof REQUIRED_LIVE_VARS)[number]) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}.`);
  }
  return value;
}

function stripSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function base64UrlJson(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function parseJson(body: string) {
  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new Error(`DocuSign returned a non-JSON body: ${body.slice(0, 240)}`);
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function formatTokenError(body: string) {
  try {
    const parsed = JSON.parse(body) as { error?: string; error_description?: string };
    if (parsed.error === "consent_required") {
      const redirect =
        process.env.DOCUSIGN_RETURN_URL?.trim() ||
        "https://canaanpreserve.com/api/docusign/return";
      const consent = `${docusignAuthServer()}/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${encodeURIComponent(process.env.DOCUSIGN_INTEGRATION_KEY ?? "")}&redirect_uri=${encodeURIComponent(redirect)}`;
      return `DocuSign JWT consent is required. An admin must open this URL once while signed into DocuSign: ${consent}`;
    }
    return `DocuSign token request failed (${parsed.error ?? "error"}): ${parsed.error_description ?? body}`;
  } catch {
    return `DocuSign token request failed: ${body}`;
  }
}

function formatApiError(action: string, body: string, status: number) {
  try {
    const parsed = JSON.parse(body) as { errorCode?: string; message?: string };
    return `DocuSign ${action} failed (${status}${parsed.errorCode ? ` ${parsed.errorCode}` : ""}): ${parsed.message ?? body}`;
  } catch {
    return `DocuSign ${action} failed (${status}): ${body}`;
  }
}

function timingSafeEqualText(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
