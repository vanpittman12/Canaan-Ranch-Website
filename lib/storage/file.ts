import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { createEmptyEngagement, stampUpdated } from "./record";
import { normalizeEngagement, type StoredEngagement } from "./normalize";
import { safeStoredName } from "./names";
import type { EngagementStore } from "./types";
import type { Engagement, IntakeFields } from "../types";

function dataDir() {
  return process.env.STORAGE_DATA_DIR
    ? path.resolve(process.env.STORAGE_DATA_DIR)
    : path.join(process.cwd(), "data");
}

function storePath() {
  return path.join(dataDir(), "engagements.json");
}

function uploadDir() {
  return path.join(dataDir(), "uploads");
}

function storedUploadPath(storedName: string) {
  return path.join(uploadDir(), safeStoredName(storedName));
}

let writeQueue: Promise<void> = Promise.resolve();

async function ensureDataDir() {
  await mkdir(dataDir(), { recursive: true });
  await mkdir(uploadDir(), { recursive: true });
}

async function readAll(): Promise<Engagement[]> {
  await ensureDataDir();
  try {
    const raw = await readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as StoredEngagement[];
    return Array.isArray(parsed) ? parsed.map(normalizeEngagement) : [];
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
  const tempPath = `${storePath()}.${crypto.randomUUID()}.tmp`;
  await writeFile(tempPath, JSON.stringify(engagements, null, 2), "utf8");
  await rename(tempPath, storePath());
}

function enqueueWrite<T>(task: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(task, task);
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export const fileStore: EngagementStore = {
  async listEngagements() {
    const items = await readAll();
    return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async getEngagement(id: string) {
    const items = await readAll();
    return items.find((item) => item.id === id) ?? null;
  },

  async createEngagementRecord(intake: IntakeFields) {
    return enqueueWrite(async () => {
      const engagement = createEmptyEngagement(intake);
      const items = await readAll();
      items.push(engagement);
      await writeAll(items);
      return engagement;
    });
  },

  async saveEngagement(next: Engagement) {
    return enqueueWrite(async () => {
      const items = await readAll();
      const index = items.findIndex((item) => item.id === next.id);
      if (index === -1) {
        throw new Error("Engagement not found.");
      }
      items[index] = stampUpdated(next);
      await writeAll(items);
      return items[index];
    });
  },

  async putUpload(storedName: string, bytes: Uint8Array) {
    await ensureDataDir();
    await writeFile(storedUploadPath(storedName), bytes);
  },

  async getUpload(storedName: string) {
    try {
      const file = await readFile(storedUploadPath(storedName));
      return new Uint8Array(file.buffer, file.byteOffset, file.byteLength);
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code === "ENOENT") {
        return null;
      }
      throw error;
    }
  },
};
