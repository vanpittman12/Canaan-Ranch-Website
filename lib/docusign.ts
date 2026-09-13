/**
 * DocuSign integration seam.
 *
 * This module never performs live DocuSign HTTP calls. When DOCUSIGN_ENABLED
 * is not "true", sendEnvelope() records a local stub envelope. When the flag
 * is true, sendEnvelopeLive() is the documented insertion point for JWT auth
 * and Envelopes:create — it still does not call the network.
 */
import { randomUUID } from "node:crypto";

export const DOCUSIGN_ENV_VARS = [
  "DOCUSIGN_ENABLED",
  "DOCUSIGN_INTEGRATION_KEY",
  "DOCUSIGN_USER_ID",
  "DOCUSIGN_ACCOUNT_ID",
  "DOCUSIGN_ACCOUNT_BASE_URI",
  "DOCUSIGN_AUTH_SERVER",
  "DOCUSIGN_PRIVATE_KEY",
  "DOCUSIGN_PRIVATE_KEY_PATH",
  "DOCUSIGN_WEBHOOK_SECRET",
  "DOCUSIGN_RETURN_URL",
] as const;

export type DocuSignMode = "stub" | "live_placeholder";

export interface DocuSignSendResult {
  mode: DocuSignMode;
  envelopeId: string;
  status: "sent";
  message: string;
}

const REQUIRED_LIVE_VARS = [
  "DOCUSIGN_INTEGRATION_KEY",
  "DOCUSIGN_USER_ID",
  "DOCUSIGN_ACCOUNT_ID",
  "DOCUSIGN_ACCOUNT_BASE_URI",
  "DOCUSIGN_AUTH_SERVER",
] as const;

export function isDocuSignEnabled() {
  return process.env.DOCUSIGN_ENABLED === "true";
}

export function missingLiveConfigVars() {
  const missing: string[] = REQUIRED_LIVE_VARS.filter((name) => !process.env[name]);
  const hasKey =
    Boolean(process.env.DOCUSIGN_PRIVATE_KEY) ||
    Boolean(process.env.DOCUSIGN_PRIVATE_KEY_PATH);
  if (!hasKey) {
    missing.push("DOCUSIGN_PRIVATE_KEY or DOCUSIGN_PRIVATE_KEY_PATH");
  }
  return missing;
}

export function describeDocuSignSeam() {
  const enabled = isDocuSignEnabled();
  const missing = missingLiveConfigVars();
  return {
    enabled,
    mode: enabled ? ("live_placeholder" as const) : ("stub" as const),
    missingLiveVars: missing,
    makesNetworkCalls: false,
  };
}

export async function sendEnvelope(input: {
  engagementId: string;
  reference: string;
  signerName: string;
  signerEmail: string;
}): Promise<DocuSignSendResult> {
  if (isDocuSignEnabled()) {
    return sendEnvelopeLive(input);
  }
  return sendEnvelopeStub(input);
}

function sendEnvelopeStub(input: {
  engagementId: string;
  reference: string;
}): DocuSignSendResult {
  return {
    mode: "stub",
    envelopeId: `stub-${input.engagementId.slice(0, 8)}-${randomUUID().slice(0, 8)}`,
    status: "sent",
    message: `DocuSign stub: envelope queued locally for ${input.reference}. No DocuSign API call was made. Set DOCUSIGN_ENABLED=true and implement sendEnvelopeLive() to go live.`,
  };
}

/**
 * PLACEHOLDER — implement JWT grant + Envelopes:create here.
 *
 * Intended live steps (do not execute in this codebase):
 * 1. Sign a JWT with DOCUSIGN_PRIVATE_KEY for DOCUSIGN_INTEGRATION_KEY / DOCUSIGN_USER_ID.
 * 2. POST to `${DOCUSIGN_AUTH_SERVER}/oauth/token` for an access token.
 * 3. POST the envelope to
 *    `${DOCUSIGN_ACCOUNT_BASE_URI}/restapi/v2.1/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes`
 *    with the generated contract PDF and a signer tab for the client.
 * 4. Persist the returned envelopeId and rely on DOCUSIGN_WEBHOOK_SECRET to
 *    verify Connect / webhook callbacks that mark the envelope complete.
 */
export async function sendEnvelopeLive(input: {
  engagementId: string;
  reference: string;
  signerName: string;
  signerEmail: string;
}): Promise<DocuSignSendResult> {
  const missing = missingLiveConfigVars();
  if (missing.length > 0) {
    throw new Error(
      `DocuSign live mode is flagged on, but configuration is incomplete (${missing.join(", ")}). No API call was made.`,
    );
  }

  void input;
  throw new Error(
    "DocuSign live send is a documented seam only. Implement JWT auth and Envelopes:create in lib/docusign.ts#sendEnvelopeLive. This application does not make live DocuSign API calls.",
  );
}

export function buildStubSignedFilename(reference: string) {
  return `${reference}-docusign-stub-signed.pdf`;
}
