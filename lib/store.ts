import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import type { Engagement, IntakeFields } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "engagements.json");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

let writeQueue: Promise<void> = Promise.resolve();

function emptyDocuSign() {
  return {
    mode: "stub" as const,
    envelopeId: null,
    status: "not_sent" as const,
    sentAt: null,
    completedAt: null,
    lastMessage: null,
  };
}

function createReference() {
  const year = new Date().getFullYear();
  const suffix = randomBytes(3).toString("hex").toUpperCase().slice(0, 4);
  return `CR-${year}-${suffix}`;
}

async function ensureDataDir() {
  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(UPLOAD_DIR, { recursive: true });
}

async function readAll(): Promise<Engagement[]> {
  await ensureDataDir();
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Engagement[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function writeAll(engagements: Engagement[]) {
  await ensureDataDir();
  const tempPath = `${STORE_PATH}.${randomUUID()}.tmp`;
  await writeFile(tempPath, JSON.stringify(engagements, null, 2), "utf8");
  await rename(tempPath, STORE_PATH);
}

function enqueueWrite<T>(task: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(task, task);
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function listEngagements() {
  const items = await readAll();
  return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getEngagement(id: string) {
  const items = await readAll();
  return items.find((item) => item.id === id) ?? null;
}

export async function createEngagementRecord(intake: IntakeFields) {
  return enqueueWrite(async () => {
    const now = new Date().toISOString();
    const engagement: Engagement = {
      id: randomUUID(),
      reference: createReference(),
      status: "draft",
      intake,
      signingMethod: null,
      signedArtifact: null,
      docusign: emptyDocuSign(),
      reviews: [],
      changeRequestNote: null,
      createdAt: now,
      updatedAt: now,
      submittedAt: null,
      acceptedAt: null,
      executedAt: null,
    };
    const items = await readAll();
    items.push(engagement);
    await writeAll(items);
    return engagement;
  });
}

export async function saveEngagement(next: Engagement) {
  return enqueueWrite(async () => {
    const items = await readAll();
    const index = items.findIndex((item) => item.id === next.id);
    if (index === -1) {
      throw new Error("Engagement not found.");
    }
    items[index] = { ...next, updatedAt: new Date().toISOString() };
    await writeAll(items);
    return items[index];
  });
}

export function getUploadDir() {
  return UPLOAD_DIR;
}

export function getStoredUploadPath(storedName: string) {
  const safeName = path.basename(storedName);
  return path.join(UPLOAD_DIR, safeName);
}
