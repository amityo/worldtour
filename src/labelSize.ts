import { geoArea } from "d3-geo";

// Thresholds in steradians on the unit sphere (total = 4π ≈ 12.566).
// Approximate geoArea values:
//   Russia 0.421 · USA 0.242 · China 0.236 · Brazil 0.210 · Australia 0.189 · India 0.081
//   France 0.014 · Japan 0.009 · Germany 0.009 · UK 0.006
//   Luxembourg 0.000064 · Singapore 0.000018
const LARGE  = 0.05;   // > 0.05  → large  (continental/subcontinental)
const MEDIUM = 0.0005; // > 0.0005 → medium (most sovereign states)

export function labelSizeFromArea(area: number): number {
  if (area > LARGE)  return 5;
  if (area > MEDIUM) return 2;
  return 1;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function labelSize(geo: any): number {
  return labelSizeFromArea(geoArea(geo));
}
