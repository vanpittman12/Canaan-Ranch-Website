#!/usr/bin/env node
/**
 * OpenNext + Cloudflare Static Assets only upload `.open-next/assets`.
 * Force-static `/privacy` and `/terms` are prerendered into `.open-next/cache`
 * (and `.next/server/app/*.html`) but are not copied to the asset root, so a
 * production Worker with the default dummy incremental cache can 404 them
 * while `/` and `/intake` still SSR.
 *
 * This script:
 * 1. Asserts Next.js / OpenNext manifests include the legal routes
 * 2. Copies the prerendered HTML into `.open-next/assets` so `/privacy` and
 *    `/terms` are served as static files after `npm run deploy`
 * 3. Stages the incremental cache under `cdn-cgi/_next_cache` for the
 *    static-assets incremental cache adapter
 */
import { cpSync, copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const nextDir = path.join(root, ".next");
const openNextDir = path.join(root, ".open-next");
const assetsDir = path.join(openNextDir, "assets");
const cacheRoot = path.join(openNextDir, "cache");
const staticAssetsCacheDir = path.join(assetsDir, "cdn-cgi", "_next_cache");

const LEGAL_ROUTES = ["privacy", "terms"];

function fail(message) {
  console.error(`ensure-legal-routes: ${message}`);
  process.exit(1);
}

function readJson(file) {
  if (!existsSync(file)) {
    fail(`missing ${path.relative(root, file)}`);
  }
  return JSON.parse(readFileSync(file, "utf8"));
}

if (!existsSync(nextDir) || !existsSync(openNextDir) || !existsSync(assetsDir)) {
  fail("run `opennextjs-cloudflare build` first");
}

const appPaths = readJson(path.join(nextDir, "server/app-paths-manifest.json"));
const prerender = readJson(path.join(nextDir, "prerender-manifest.json"));

for (const route of LEGAL_ROUTES) {
  if (!appPaths[`/${route}/page`]) {
    fail(`app-paths-manifest.json is missing /${route}/page`);
  }
  if (!prerender.routes?.[`/${route}`]) {
    fail(`prerender-manifest.json is missing /${route}`);
  }
}

const cacheBuilds = existsSync(cacheRoot)
  ? readdirSync(cacheRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory())
  : [];
if (cacheBuilds.length === 0) {
  fail("OpenNext cache directory is empty");
}

for (const route of LEGAL_ROUTES) {
  const htmlSrc = path.join(nextDir, "server/app", `${route}.html`);
  if (!existsSync(htmlSrc)) {
    fail(`prerendered HTML missing at ${path.relative(root, htmlSrc)}`);
  }
  const html = readFileSync(htmlSrc, "utf8");
  if (!html.includes(`<title>`) || !html.toLowerCase().includes(route === "privacy" ? "privacy" : "terms")) {
    fail(`${route}.html does not look like the legal page`);
  }
  copyFileSync(htmlSrc, path.join(assetsDir, `${route}.html`));

  const cacheHit = cacheBuilds.some((dir) =>
    existsSync(path.join(cacheRoot, dir.name, `${route}.cache`)),
  );
  if (!cacheHit) {
    fail(`OpenNext cache is missing ${route}.cache`);
  }
}

mkdirSync(path.dirname(staticAssetsCacheDir), { recursive: true });
cpSync(cacheRoot, staticAssetsCacheDir, { recursive: true });

for (const route of LEGAL_ROUTES) {
  if (!existsSync(path.join(assetsDir, `${route}.html`))) {
    fail(`failed to copy ${route}.html into OpenNext assets`);
  }
}

console.log(
  "ensure-legal-routes: /privacy and /terms are in the Next.js manifests, OpenNext cache, and Worker assets.",
);
