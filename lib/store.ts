import "server-only";

import { getStore } from "./storage/resolve";
import type { Engagement, IntakeFields } from "./types";

export async function listEngagements() {
  return (await getStore()).listEngagements();
}

export async function getEngagement(id: string) {
  return (await getStore()).getEngagement(id);
}

export async function getEngagementByEnvelopeId(envelopeId: string) {
  if (!envelopeId) {
    return null;
  }
  const items = await listEngagements();
  return items.find((item) => item.docusign.envelopeId === envelopeId) ?? null;
}

export async function createEngagementRecord(intake: IntakeFields) {
  return (await getStore()).createEngagementRecord(intake);
}

export async function saveEngagement(next: Engagement) {
  return (await getStore()).saveEngagement(next);
}

export async function putUpload(storedName: string, bytes: Uint8Array) {
  return (await getStore()).putUpload(storedName, bytes);
}

export async function getUpload(storedName: string) {
  return (await getStore()).getUpload(storedName);
}
