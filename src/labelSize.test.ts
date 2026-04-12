import { describe, it, expect } from "vitest";
import { labelSizeFromArea } from "./labelSize";

// geoArea returns steradians on unit sphere (total = 4π ≈ 12.566).
// Approximate values: country_km² / 510_072_000 * 4π
//
//  Country       km²        steradians
//  Russia        17 098 242  0.421
//  USA            9 833 517  0.242
//  China          9 596 960  0.236
//  Brazil         8 515 767  0.210
//  Australia      7 692 024  0.189
//  India          3 287 263  0.081
//  ──── large / medium boundary: 0.05 ────
//  France           551 695  0.0136
//  Japan            377 972  0.0093
//  Germany          357 114  0.0088
//  UK               243 610  0.0060
//  ──── medium / small boundary: 0.0005 ────
//  Luxembourg         2 586  0.000064
//  Singapore            728  0.000018

describe("labelSizeFromArea", () => {
  describe("large (> 0.05 sr) → 3px", () => {
    it.each([
      ["Russia",    0.421],
      ["USA",       0.242],
      ["China",     0.236],
      ["Brazil",    0.210],
      ["Australia", 0.189],
      ["India",     0.081],
    ])("%s (≈ %f sr)", (_name, area) => {
      expect(labelSizeFromArea(area)).toBe(3);
    });
  });

  describe("medium (0.0005–0.05 sr) → 2px", () => {
    it.each([
      ["France",  0.0136],
      ["Japan",   0.0093],
      ["Germany", 0.0088],
      ["UK",      0.0060],
    ])("%s (≈ %f sr)", (_name, area) => {
      expect(labelSizeFromArea(area)).toBe(2);
    });
  });

  describe("small (≤ 0.0005 sr) → 1px", () => {
    it.each([
      ["Luxembourg", 0.000064],
      ["Singapore",  0.000018],
    ])("%s (≈ %f sr)", (_name, area) => {
      expect(labelSizeFromArea(area)).toBe(1);
    });
  });

  describe("boundary values", () => {
    it("exactly at large threshold (0.05) → medium", () => {
      expect(labelSizeFromArea(0.05)).toBe(2);
    });
    it("just above large threshold → large", () => {
      expect(labelSizeFromArea(0.050001)).toBe(3);
    });
    it("exactly at medium threshold (0.0005) → small", () => {
      expect(labelSizeFromArea(0.0005)).toBe(1);
    });
    it("just above medium threshold → medium", () => {
      expect(labelSizeFromArea(0.000501)).toBe(2);
    });
  });
});
