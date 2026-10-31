/**
 * Small persistent security state: fixed-window rate limits and the admin
 * session version used for logout revocation.
 *
 * Production (STORAGE_ADAPTER=cloudflare) stores rows in the ENGAGEMENTS D1
 * database. Tables are created lazily (CREATE TABLE IF NOT EXISTS), and also
 * ship as migrations/0002_security_state.sql. Other adapters (local dev, tests)
 * use an in-memory map.
 */
import { resolveStorageAdapter } from "./storage/resolve";

type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  first<T extends Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
};
type D1Binding = {
  prepare(query: string): D1Statement;
  batch(statements: D1Statement[]): Promise<unknown>;
};

export type RateLimitRule = { limit: number; windowMs: number };

export const ADMIN_LOGIN_RULE: RateLimitRule = { limit: 5, windowMs: 15 * 60 * 1000 };
export const INTAKE_SUBMIT_RULE: RateLimitRule = { limit: 10, windowMs: 60 * 60 * 1000 };

export type RateLimitStatus = { blocked: boolean; count: number; resetAt: number };

const memoryCounters = new Map<string, { count: number; windowStart: number }>();
let memorySessionVersion = 0;
let schemaReady = false;

export function resetSecurityStateForTests() {
  memoryCounters.clear();
  memorySessionVersion = 0;
}

async function d1(): Promise<D1Binding | null> {
  if (resolveStorageAdapter() !== "cloudflare") {
    return null;
  }
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { env } = await getCloudflareContext({ async: true });
  const db = (env as { ENGAGEMENTS?: D1Binding }).ENGAGEMENTS;
  if (!db) {
    throw new Error("security state requires the ENGAGEMENTS D1 binding");
  }
  if (!schemaReady) {
    await db.batch([
      db.prepare(
        `CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, window_start INTEGER NOT NULL)`,
      ),
      db.prepare(
        `CREATE TABLE IF NOT EXISTS admin_session_state (id INTEGER PRIMARY KEY CHECK (id = 1), version INTEGER NOT NULL)`,
      ),
    ]);
    schemaReady = true;
  }
  return db;
}

/** Normalize a client IP into a bounded key component. */
export function clientKey(ip: string | null | undefined) {
  const value = (ip ?? "").trim().slice(0, 64);
  return value || "unknown";
}

/** Read the current window without counting a hit. */
export async function rateLimitStatus(
  key: string,
  rule: RateLimitRule,
  now = Date.now(),
): Promise<RateLimitStatus> {
  const db = await d1();
  let row: { count: number; windowStart: number } | null;
  if (db) {
    const found = await db
      .prepare(`SELECT count, window_start FROM rate_limits WHERE key = ?`)
      .bind(key)
      .first<{ count: number; window_start: number }>();
    row = found ? { count: Number(found.count), windowStart: Number(found.window_start) } : null;
  } else {
    row = memoryCounters.get(key) ?? null;
  }
  if (!row || now - row.windowStart >= rule.windowMs) {
    return { blocked: false, count: 0, resetAt: now + rule.windowMs };
  }
  return {
    blocked: row.count >= rule.limit,
    count: row.count,
    resetAt: row.windowStart + rule.windowMs,
  };
}

/** Count one hit (starting a new window if the old one expired). */
export async function recordRateLimitHit(
  key: string,
  rule: RateLimitRule,
  now = Date.now(),
): Promise<RateLimitStatus> {
  const db = await d1();
  if (db) {
    const cutoff = now - rule.windowMs;
    await db
      .prepare(
        `INSERT INTO rate_limits (key, count, window_start) VALUES (?1, 1, ?2)
         ON CONFLICT(key) DO UPDATE SET
           count = CASE WHEN rate_limits.window_start <= ?3 THEN 1 ELSE rate_limits.count + 1 END,
           window_start = CASE WHEN rate_limits.window_start <= ?3 THEN ?2 ELSE rate_limits.window_start END`,
      )
      .bind(key, now, cutoff)
      .run();
  } else {
    const row = memoryCounters.get(key);
    if (!row || now - row.windowStart >= rule.windowMs) {
      memoryCounters.set(key, { count: 1, windowStart: now });
    } else {
      row.count += 1;
    }
  }
  return rateLimitStatus(key, rule, now);
}

export async function clearRateLimit(key: string) {
  const db = await d1();
  if (db) {
    await db.prepare(`DELETE FROM rate_limits WHERE key = ?`).bind(key).run();
  } else {
    memoryCounters.delete(key);
  }
}

export async function currentAdminSessionVersion(): Promise<number> {
  const db = await d1();
  if (!db) {
    return memorySessionVersion;
  }
  const row = await db
    .prepare(`SELECT version FROM admin_session_state WHERE id = 1`)
    .first<{ version: number }>();
  return row ? Number(row.version) : 0;
}

/** Invalidate every outstanding admin session. */
export async function bumpAdminSessionVersion(): Promise<number> {
  const db = await d1();
  if (!db) {
    memorySessionVersion += 1;
    return memorySessionVersion;
  }
  await db
    .prepare(
      `INSERT INTO admin_session_state (id, version) VALUES (1, 1)
       ON CONFLICT(id) DO UPDATE SET version = admin_session_state.version + 1`,
    )
    .run();
  return currentAdminSessionVersion();
}
