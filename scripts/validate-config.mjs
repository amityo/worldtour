#!/usr/bin/env node
/**
 * Validates public/worldtour.config.json at build time.
 * Exits with code 1 if any country or state entry is unrecognised.
 *
 * Country codes: ISO 3166-1 alpha-3 (same property the map reads: ISO_A3 / ADM0_A3).
 * State names:   50 US states as used by us-atlas (title-cased full names).
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import countries from "i18n-iso-countries";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG_PATH = resolve(ROOT, "public/worldtour.config.json");

// ── Country resolution: accepts ISO alpha-3 OR full English name ─────────────
/** Resolve a config entry to ISO alpha-3, or null if unrecognised. */
function resolveCountry(entry) {
  // Already an alpha-3 code
  if (countries.isValid(entry)) return entry;
  // Try resolving as an English name → alpha-2 → alpha-3
  const alpha2 = countries.getAlpha2Code(entry, "en");
  if (alpha2) return countries.alpha2ToAlpha3(alpha2);
  return null;
}

// ── US states (us-atlas title-cased names) ───────────────────────────────────
const VALID_STATES = new Set([
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada",
  "New Hampshire","New Jersey","New Mexico","New York","North Carolina",
  "North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island",
  "South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont",
  "Virginia","Washington","West Virginia","Wisconsin","Wyoming",
  "District of Columbia",
]);

// ── Load config ──────────────────────────────────────────────────────────────
let config;
try {
  config = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
} catch (e) {
  console.error(`validate-config: cannot read ${CONFIG_PATH}\n  ${e.message}`);
  process.exit(1);
}

let errors = 0;

for (const [year, entry] of Object.entries(config.visited ?? {})) {
  for (const code of entry.countries ?? []) {
    if (!resolveCountry(code)) {
      console.error(`validate-config: unknown country "${code}" in year ${year} (expected ISO alpha-3 or English name)`);
      errors++;
    }
  }
  for (const state of entry.states ?? []) {
    if (!VALID_STATES.has(state)) {
      console.error(`validate-config: unknown state "${state}" in year ${year}`);
      errors++;
    }
  }
}

if (errors > 0) {
  console.error(`\nvalidate-config: ${errors} error(s) found — build aborted.`);
  process.exit(1);
}

console.log("validate-config: OK");
