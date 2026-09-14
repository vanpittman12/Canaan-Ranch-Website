import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fileStore } from "./file";

const intake = {
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

describe("file store", () => {
  const previousDir = process.env.STORAGE_DATA_DIR;
  let dir = "";

  beforeEach(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), "canaan-store-"));
    process.env.STORAGE_DATA_DIR = dir;
  });

  afterEach(async () => {
    if (previousDir === undefined) {
      delete process.env.STORAGE_DATA_DIR;
    } else {
      process.env.STORAGE_DATA_DIR = previousDir;
    }
    await rm(dir, { recursive: true, force: true });
  });

  it("creates, lists, updates, and stores uploads", async () => {
    const created = await fileStore.createEngagementRecord(intake);
    expect(created.reference).toMatch(/^CP-\d{4}-[A-F0-9]{4}$/);

    const listed = await fileStore.listEngagements();
    expect(listed).toHaveLength(1);
    expect(listed[0]?.id).toBe(created.id);

    const saved = await fileStore.saveEngagement({
      ...created,
      status: "pending_review",
      docusign: {
        ...created.docusign,
        envelopeId: "env-lookup-1",
        status: "sent",
      },
    });
    expect(saved.status).toBe("pending_review");
    expect(saved.docusign.envelopeId).toBe("env-lookup-1");
    expect(saved.updatedAt >= created.updatedAt).toBe(true);
    const byEnvelope = (await fileStore.listEngagements()).find(
      (item) => item.docusign.envelopeId === "env-lookup-1",
    );
    expect(byEnvelope?.id).toBe(created.id);

    const bytes = new Uint8Array([1, 2, 3, 4]);
    await fileStore.putUpload(`${created.id}-signed.pdf`, bytes);
    const read = await fileStore.getUpload(`${created.id}-signed.pdf`);
    expect(read).toEqual(bytes);
  });

  it("returns null for a missing upload and throws when saving an unknown id", async () => {
    expect(await fileStore.getUpload("missing.pdf")).toBeNull();
    await expect(
      fileStore.saveEngagement({
        id: "missing",
        reference: "CP-2026-XXXX",
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
        reviews: [],
        changeRequestNote: null,
        createdAt: "2026-04-01T00:00:00.000Z",
        updatedAt: "2026-04-01T00:00:00.000Z",
        submittedAt: null,
        acceptedAt: null,
        executedAt: null,
      }),
    ).rejects.toThrow("Engagement not found.");
  });
});
