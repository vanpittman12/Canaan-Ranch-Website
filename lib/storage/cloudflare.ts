import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createEmptyEngagement, stampUpdated } from "./record";
import { parseStoredEngagement } from "./normalize";
import { uploadObjectKey } from "./names";
import type { EngagementStore } from "./types";
import type { Engagement, IntakeFields } from "../types";

type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  all<T extends Record<string, unknown>>(): Promise<{ results: T[] }>;
  first<T extends Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<{ success: boolean; meta?: { changes?: number } }>;
};

type D1Binding = {
  prepare(query: string): D1Statement;
  batch(statements: D1Statement[]): Promise<unknown>;
};

type R2Object = {
  arrayBuffer(): Promise<ArrayBuffer>;
};

type R2Binding = {
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
  get(key: string): Promise<R2Object | null>;
};

type WorkerEnv = {
  ENGAGEMENTS?: D1Binding;
  UPLOADS?: R2Binding;
};

let schemaReady = false;

async function bindings() {
  const { env } = await getCloudflareContext({ async: true });
  const { ENGAGEMENTS, UPLOADS } = env as WorkerEnv;
  if (!ENGAGEMENTS || !UPLOADS) {
    throw new Error(
      "Cloudflare storage requires ENGAGEMENTS (D1) and UPLOADS (R2) bindings. See the README deploy steps.",
    );
  }
  return { db: ENGAGEMENTS, uploads: UPLOADS };
}

async function ensureSchema(db: D1Binding) {
  if (schemaReady) {
    return;
  }
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS engagements (
        id TEXT PRIMARY KEY,
        reference TEXT NOT NULL,
        status TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        payload TEXT NOT NULL
      )
    `),
    db.prepare(
      `CREATE INDEX IF NOT EXISTS engagements_updated_at ON engagements(updated_at)`,
    ),
  ]);
  schemaReady = true;
}

export const cloudflareStore: EngagementStore = {
  async listEngagements() {
    const { db } = await bindings();
    await ensureSchema(db);
    const { results } = await db
      .prepare(`SELECT payload FROM engagements ORDER BY updated_at DESC`)
      .all<{ payload: string }>();
    return results.map((row) => parseStoredEngagement(row.payload));
  },

  async getEngagement(id: string) {
    const { db } = await bindings();
    await ensureSchema(db);
    const row = await db
      .prepare(`SELECT payload FROM engagements WHERE id = ?`)
      .bind(id)
      .first<{ payload: string }>();
    return row ? parseStoredEngagement(row.payload) : null;
  },

  async createEngagementRecord(intake: IntakeFields) {
    const { db } = await bindings();
    await ensureSchema(db);
    const engagement = createEmptyEngagement(intake);
    await db
      .prepare(
        `INSERT INTO engagements (id, reference, status, updated_at, payload) VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(
        engagement.id,
        engagement.reference,
        engagement.status,
        engagement.updatedAt,
        JSON.stringify(engagement),
      )
      .run();
    return engagement;
  },

  async saveEngagement(next: Engagement) {
    const { db } = await bindings();
    await ensureSchema(db);
    const updated = stampUpdated(next);
    const result = await db
      .prepare(
        `UPDATE engagements SET reference = ?, status = ?, updated_at = ?, payload = ? WHERE id = ?`,
      )
      .bind(
        updated.reference,
        updated.status,
        updated.updatedAt,
        JSON.stringify(updated),
        updated.id,
      )
      .run();
    if (!result.success || result.meta?.changes === 0) {
      throw new Error("Engagement not found.");
    }
    return updated;
  },

  async putUpload(storedName: string, bytes: Uint8Array) {
    const { uploads } = await bindings();
    await uploads.put(uploadObjectKey(storedName), bytes, {
      httpMetadata: { contentType: "application/pdf" },
    });
  },

  async getUpload(storedName: string) {
    const { uploads } = await bindings();
    const object = await uploads.get(uploadObjectKey(storedName));
    if (!object) {
      return null;
    }
    return new Uint8Array(await object.arrayBuffer());
  },
};
