import { useState, useEffect, useMemo } from "react";

export interface WorldTourConfig {
  startYear: number;
  endYear: number | null;
  visited: Record<string, {
    countries?: string[]; // ISO A3 codes, e.g. "USA", "FRA"
    states?:    string[]; // state names, e.g. "California"
  }>;
}

export function useConfig() {
  const [config, setConfig] = useState<WorldTourConfig | null>(null);

  useEffect(() => {
    fetch("/worldtour.config.json")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => setConfig(null));
  }, []);

  return config;
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
