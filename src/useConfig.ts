import { useMemo } from "react";
import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import configData from "./worldtour.config.json";

countries.registerLocale(en);

export interface WorldTourConfig {
  startYear: number;
  endYear: number | null;
  visited: Record<string, {
    countries?: string[]; // ISO A3 codes, e.g. "USA", "FRA"
    states?:    string[]; // state names, e.g. "California"
  }>;
}

function resolveAlpha3(entry: string): string {
  if (countries.isValid(entry)) return entry;
  const alpha2 = countries.getAlpha2Code(entry, "en");
  if (alpha2) return countries.alpha2ToAlpha3(alpha2) ?? entry;
  return entry;
}

function normalizeConfig(raw: typeof configData): WorldTourConfig {
  const visited: WorldTourConfig["visited"] = {};
  for (const [year, entry] of Object.entries(raw.visited)) {
    visited[year] = {
      ...entry,
      countries: entry.countries?.map(resolveAlpha3),
    };
  }
  return { ...raw, visited };
}

const normalizedConfig = normalizeConfig(configData);

export function useConfig(): WorldTourConfig {
  return normalizedConfig;
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
