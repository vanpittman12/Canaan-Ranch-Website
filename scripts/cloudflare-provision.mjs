#!/usr/bin/env node
/**
 * Creates the D1 database and R2 bucket, writes the D1 id into wrangler.jsonc,
 * and applies migrations. Requires `npx wrangler login` first.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const wranglerPath = path.join(root, "wrangler.jsonc");
const databaseName = "canaan-preserve";
const bucketName = "canaan-preserve-uploads";

function run(args, { allowFail = false } = {}) {
  const result = spawnSync("npx", ["wrangler", ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: ["inherit", "pipe", "pipe"],
  });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  if (result.status !== 0 && !allowFail) {
    console.error(output);
    process.exit(result.status ?? 1);
  }
  return output;
}

function extractDatabaseId(text) {
  const match =
    text.match(/database_id\s*=\s*"([^"]+)"/i) ||
    text.match(/"database_id"\s*:\s*"([^"]+)"/i) ||
    text.match(/database_id["']?\s*[:=]\s*["']([0-9a-f-]{36})/i);
  return match?.[1] ?? null;
}

console.log("Checking Wrangler login…");
const whoami = run(["whoami"], { allowFail: true });
if (/not authenticated|not logged in|login/i.test(whoami) && /error/i.test(whoami)) {
  console.error("Run `npx wrangler login` first, then rerun this script.");
  process.exit(1);
}

console.log(`Creating D1 database ${databaseName} (ok if it already exists)…`);
const created = run(["d1", "create", databaseName], { allowFail: true });
let databaseId = extractDatabaseId(created);

if (!databaseId) {
  console.log("Looking up existing D1 databases…");
  const listed = run(["d1", "list"]);
  const line = listed
    .split("\n")
    .find((row) => row.includes(databaseName));
  databaseId = line?.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0] ?? null;
}

if (!databaseId) {
  console.error("Could not determine the D1 database_id. Create it in the dashboard and paste it into wrangler.jsonc.");
  process.exit(1);
}

let wrangler = readFileSync(wranglerPath, "utf8");
wrangler = wrangler.replace(
  /"database_id":\s*"[^"]+"/,
  `"database_id": "${databaseId}"`,
);
writeFileSync(wranglerPath, wrangler);
console.log(`Wrote database_id ${databaseId} to wrangler.jsonc`);

console.log(`Creating R2 bucket ${bucketName} (ok if it already exists)…`);
run(["r2", "bucket", "create", bucketName], { allowFail: true });

console.log("Applying D1 migrations (remote)…");
run(["d1", "migrations", "apply", databaseName, "--remote"]);

console.log(`
Next:
  npx wrangler secret put ADMIN_PASSWORD
  npx wrangler secret put ADMIN_SESSION_SECRET
  # optional:
  npx wrangler secret put CANAAN_WITNESS_NAME
  npx wrangler secret put CANAAN_WITNESS_EMAIL
  npm run deploy
`);
