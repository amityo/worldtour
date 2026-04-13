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

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG_PATH = resolve(ROOT, "public/worldtour.config.json");

// ── ISO 3166-1 alpha-3 ───────────────────────────────────────────────────────
const VALID_COUNTRIES = new Set([
  "AFG","ALB","DZA","AND","AGO","ATG","ARG","ARM","AUS","AUT","AZE",
  "BHS","BHR","BGD","BRB","BLR","BEL","BLZ","BEN","BTN","BOL","BIH",
  "BWA","BRA","BRN","BGR","BFA","BDI","CPV","KHM","CMR","CAN","CAF",
  "TCD","CHL","CHN","COL","COM","COD","COG","CRI","CIV","HRV","CUB",
  "CYP","CZE","DNK","DJI","DOM","ECU","EGY","SLV","GNQ","ERI","EST",
  "SWZ","ETH","FJI","FIN","FRA","GAB","GMB","GEO","DEU","GHA","GRC",
  "GRD","GTM","GIN","GNB","GUY","HTI","HND","HUN","ISL","IND","IDN",
  "IRN","IRQ","IRL","ISR","ITA","JAM","JPN","JOR","KAZ","KEN","KIR",
  "PRK","KOR","XKX","KWT","KGZ","LAO","LVA","LBN","LSO","LBR","LBY",
  "LIE","LTU","LUX","MDG","MWI","MYS","MDV","MLI","MLT","MHL","MRT",
  "MUS","MEX","FSM","MDA","MCO","MNG","MNE","MAR","MOZ","MMR","NAM",
  "NRU","NPL","NLD","NZL","NIC","NER","NGA","MKD","NOR","OMN","PAK",
  "PLW","PAN","PNG","PRY","PER","PHL","POL","PRT","QAT","ROU","RUS",
  "RWA","KNA","LCA","VCT","WSM","SMR","STP","SAU","SEN","SRB","SYC",
  "SLE","SGP","SVK","SVN","SLB","SOM","ZAF","SSD","ESP","LKA","SDN",
  "SUR","SWE","CHE","SYR","TWN","TJK","TZA","THA","TLS","TGO","TON",
  "TTO","TUN","TUR","TKM","TUV","UGA","UKR","ARE","GBR","USA","URY",
  "UZB","VUT","VEN","VNM","YEM","ZMB","ZWE",
  // Territories / special entries common in Natural Earth
  "ATA","GRL","ESH","PSE","SOL","KOS","SCR",
  // Natural Earth uses -99 or ADM0_A3 for some disputed/unrecognised territories;
  // the codes below cover the most common ones that appear in ne_110m data.
  "TWN","SOM","KOS","SOL",
]);

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
    if (!VALID_COUNTRIES.has(code)) {
      console.error(`validate-config: unknown country code "${code}" in year ${year}`);
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
