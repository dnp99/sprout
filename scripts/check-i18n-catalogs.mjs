#!/usr/bin/env node
/**
 * Catalog-drift check (plan 013). en-CA.json is the source of truth; every
 * other locale in src/messages must have exactly the same key tree. Fails the
 * lint run listing missing/extra keys, so a translated string can't silently
 * fall back (missing) or rot unused (extra).
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const MESSAGES_DIR = path.resolve(process.cwd(), "src/messages");
const SOURCE = "en-CA.json";

function flattenKeys(obj, prefix = "") {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object") keys.push(...flattenKeys(value, full));
    else keys.push(full);
  }
  return keys;
}

const source = new Set(
  flattenKeys(JSON.parse(readFileSync(path.join(MESSAGES_DIR, SOURCE), "utf8"))),
);

let failed = false;
for (const file of readdirSync(MESSAGES_DIR)) {
  if (!file.endsWith(".json") || file === SOURCE) continue;
  const keys = new Set(flattenKeys(JSON.parse(readFileSync(path.join(MESSAGES_DIR, file), "utf8"))));
  const missing = [...source].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !source.has(k));
  if (missing.length || extra.length) {
    failed = true;
    console.error(`✗ ${file} is out of sync with ${SOURCE}:`);
    for (const k of missing) console.error(`    missing  ${k}`);
    for (const k of extra) console.error(`    extra    ${k}`);
  }
}

if (failed) process.exit(1);
console.log(`✓ i18n catalogs in sync (${source.size} keys)`);
