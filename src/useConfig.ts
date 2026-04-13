import { useMemo } from "react";
import configData from "../public/worldtour.config.json";

export interface WorldTourConfig {
  startYear: number;
  endYear: number | null;
  visited: Record<string, {
    countries?: string[]; // ISO A3 codes, e.g. "USA", "FRA"
    states?:    string[]; // state names, e.g. "California"
  }>;
}

export function useConfig(): WorldTourConfig {
  return configData as WorldTourConfig;
}

const CURRENT_YEAR = new Date().getFullYear();

/** Cumulative visited sets for all years ≤ selectedYear */
export function useVisited(config: WorldTourConfig | null, selectedYear: number) {
  return useMemo(() => {
    const countries = new Set<string>();
    const states    = new Set<string>();
    if (!config) return { countries, states };

    const data = config.visited[String(selectedYear)];
    data?.countries?.forEach((c) => countries.add(c));
    data?.states?.forEach((s)    => states.add(s));
    return { countries, states };
  }, [config, selectedYear]);
}

export function resolveEndYear(config: WorldTourConfig | null): number {
  return config?.endYear ?? CURRENT_YEAR;
}

/** Maps each country/state code → sorted list of years it was visited. */
export function useAllVisitedYears(config: WorldTourConfig | null): {
  countries: Map<string, number[]>;
  states:    Map<string, number[]>;
} {
  return useMemo(() => {
    const countries = new Map<string, number[]>();
    const states    = new Map<string, number[]>();
    if (!config) return { countries, states };

    for (const [yearStr, entry] of Object.entries(config.visited)) {
      const year = Number(yearStr);
      for (const c of entry.countries ?? []) {
        if (!countries.has(c)) countries.set(c, []);
        countries.get(c)!.push(year);
      }
      for (const s of entry.states ?? []) {
        if (!states.has(s)) states.set(s, []);
        states.get(s)!.push(year);
      }
    }

    for (const arr of countries.values()) arr.sort((a, b) => a - b);
    for (const arr of states.values())    arr.sort((a, b) => a - b);

    return { countries, states };
  }, [config]);
}
