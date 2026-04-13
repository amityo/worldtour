import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  ComposableMap,
  Marker,
  ZoomableGroup,
  useGeographies,
  useMapContext,
} from "react-simple-maps";
import { geoCentroid, geoArea } from "d3-geo";
import polylabel from "polylabel";
import { labelSize } from "./labelSize";
import { useConfig, useVisited, useAllVisitedYears, resolveEndYear } from "./useConfig";
import { Timeline } from "./Timeline";
import { ZoomControls } from "./ZoomControls";
import "./WorldMap.css";

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const ZOOM_STEP = 1.5;
const ANIM_MS   = 350;

const WORLD_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";
const US_STATES_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const palettes = {
  signature: { background: "#87CEEB", land: "#FFF8DC", secondary: "#FFDEAD", text: "#800000" },
  grey:      { background: "#fafafa", land: "#d3d3d3", secondary: "#939393", text: "#191919" },
  green:     { background: "#dda15e", land: "#606c38", secondary: "#394021", text: "#fefae0" },
  calm:      { background: "#9dc7e2", land: "#e1e0d0", secondary: "#c3c1a1", text: "#191919" },
  purple:    { background: "#ffcdb2", land: "#b5838d", secondary: "#6d6875", text: "#023047" },
  dark:      { background: "#2c3e50", land: "#f4a261", secondary: "#92613a", text: "#ffffff" },
} as const;

type PaletteName = keyof typeof palettes;
type Palette = typeof palettes[PaletteName];


interface GeoLayerProps {
  geography: string | object;
  getName:      (props: Record<string, string>) => string;
  getKey:       (props: Record<string, string>) => string;
  visitedKeys?: Set<string>;
  visitedYears?: Map<string, number[]>;
  showLabel:    (geo: { properties: Record<string, string> }, zoom: number) => boolean;
  palette: Palette;
  zoom: number;
  onTooltip: (name: string, years?: number[]) => void;
}

// Pole of inaccessibility — better visual center than centroid for irregular shapes.
// For MultiPolygon, runs on the largest component by spherical area.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function polylabelCenter(geo: any): [number, number] {
  const geom = geo.geometry;
  if (!geom) return geoCentroid(geo);

  if (geom.type === "Polygon") {
    const pt = polylabel(geom.coordinates as number[][][]);
    return [pt[0], pt[1]];
  }

  if (geom.type === "MultiPolygon") {
    const largest = (geom.coordinates as number[][][][]).reduce(
      (best: number[][][], rings: number[][][]) => {
        const a = geoArea({ type: "Feature", geometry: { type: "Polygon", coordinates: rings }, properties: null });
        const b = geoArea({ type: "Feature", geometry: { type: "Polygon", coordinates: best  }, properties: null });
        return a > b ? rings : best;
      },
      geom.coordinates[0] as number[][][]
    );
    const pt = polylabel(largest);
    return [pt[0], pt[1]];
  }

  return geoCentroid(geo);
}

function GeoLayer({ geography, getName, getKey, visitedKeys, visitedYears, showLabel, palette, zoom, onTooltip }: GeoLayerProps) {
  const { geographies } = useGeographies({ geography });
  const { path } = useMapContext();
  const [hovered, setHovered] = useState<string | null>(null);
  const sw = 0.5 / zoom;

  // Centroid and label-size are stable per geography — compute once, not per render.
  const geoMeta = useMemo(() => {
    const m = new Map<string, { centroid: [number, number]; fs: number }>();
    for (const geo of geographies) {
      m.set(geo.rsmKey, { centroid: polylabelCenter(geo), fs: labelSize(geo) });
    }
    return m;
  }, [geographies]);

  // Dev: warn if visited keys never match any loaded geography
  useEffect(() => {
    if (!import.meta.env.DEV || !visitedKeys || visitedKeys.size === 0 || geographies.length === 0) return;
    const matched = geographies.some((g) => visitedKeys.has(getKey(g.properties as Record<string, string>)));
    if (!matched) console.warn("[GeoLayer] no visitedKeys matched. Check ISO codes in config.", [...visitedKeys]);
  }, [geographies, visitedKeys, getKey]);

  return (
    <>
      <g>
        {geographies.map((geo) => {
          const props   = geo.properties as Record<string, string>;
          const name    = getName(props);
          const key     = getKey(props);
          const visited = !!visitedKeys?.has(key);
          const isHover = hovered === geo.rsmKey;
          const fill    = isHover || visited ? palette.secondary : palette.land;
          return (
            <path
              key={geo.rsmKey}
              d={path(geo) ?? ""}
              fill={fill}
              stroke={palette.secondary}
              strokeWidth={sw}
              style={{ outline: "none", cursor: "default" }}
              onMouseEnter={() => { setHovered(geo.rsmKey); onTooltip(name, visitedYears?.get(key)); }}
              onMouseLeave={() => { setHovered(null);       onTooltip("");                           }}
            />
          );
        })}
      </g>

      <g pointerEvents="none">
        {geographies.map((geo) => {
          if (!showLabel(geo, zoom)) return null;
          const name = getName(geo.properties as Record<string, string>);
          const meta = geoMeta.get(geo.rsmKey);
          if (!meta) return null;
          return (
            <Marker key={`lbl-${geo.rsmKey}`} coordinates={meta.centroid}>
              <text
                className="wt-geo-label"
                textAnchor="middle"
                dominantBaseline="central"
                style={{ fontSize: meta.fs, fill: palette.text }}
              >
                {name}
              </text>
            </Marker>
          );
        })}
      </g>
    </>
  );
}

export default function WorldMap() {
  const [tooltip, setTooltip] = useState<{ name: string; years?: number[] } | null>(null);
  const [mouse, setMouse] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [0, 0],
    zoom: 1,
  });
  const [paletteName, setPaletteName] = useState<PaletteName>("signature");
  const [showLabels, setShowLabels] = useState(true);

  const config      = useConfig();
  const endYear     = resolveEndYear(config);
  const allVisited  = useAllVisitedYears(config);
  const [year, setYear] = useState<number | null>(null);

  // Once config loads, start at startYear so only that year's visits are highlighted
  useEffect(() => {
    if (config) setYear(config.startYear);
  }, [config]);

  const activeYear = year ?? endYear;
  const visited = useVisited(config, activeYear);

  const palette = palettes[paletteName];
  const zoom = position.zoom;

  const rafRef = useRef<number>(0);
  const posRef = useRef(position);
  posRef.current = position; // keep ref current without an effect

  const animateTo = useCallback((
    targetZoom:   number,
    targetCoords: [number, number]
  ) => {
    cancelAnimationFrame(rafRef.current);
    const { zoom: z0, coordinates: c0 } = posRef.current;
    const t0 = performance.now();

    const frame = (now: number) => {
      const t     = Math.min((now - t0) / ANIM_MS, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setPosition({
        zoom: z0 + (targetZoom - z0) * eased,
        coordinates: [
          c0[0] + (targetCoords[0] - c0[0]) * eased,
          c0[1] + (targetCoords[1] - c0[1]) * eased,
        ],
      });
      if (t < 1) rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
  }, []);

  const zoomIn  = useCallback(() => animateTo(Math.min(posRef.current.zoom * ZOOM_STEP, MAX_ZOOM), posRef.current.coordinates), [animateTo]);
  const zoomOut = useCallback(() => animateTo(Math.max(posRef.current.zoom / ZOOM_STEP, MIN_ZOOM), posRef.current.coordinates), [animateTo]);
  const reset   = useCallback(() => animateTo(1, [0, 0]), [animateTo]);

  const worldLabel = (geo: { properties: Record<string, string> }) => {
    const pop = Number(geo.properties.POP_EST) || 0;
    return showLabels && (pop === 0 || pop >= 5_000_000);
  };

  const stateLabel = (_geo: { properties: Record<string, string> }) =>
    showLabels;

  return (
    <div
      className="wt-root"
      style={{ background: palette.background }}
      onMouseMove={(e) => setMouse({ x: e.clientX, y: e.clientY })}
    >
      {tooltip && (
        <div
          className="wt-tooltip"
          style={{
            left: mouse.x + 14,
            top:  mouse.y + 14,
            background: palette.secondary,
            color: palette.text,
            border: `1px solid ${palette.text}44`,
          }}
        >
          <span>{tooltip.name}</span>
          {tooltip.years && (
            <span className="wt-tooltip-years" style={{ color: `${palette.text}99` }}>
              {tooltip.years.join(" · ")}
            </span>
          )}
        </div>
      )}

      <div
        className="wt-controls"
        style={{
          background: palette.background,
          border: `1px solid ${palette.text}44`,
        }}
      >
        <button
          className="wt-label-btn"
          title="Toggle labels"
          onClick={() => setShowLabels((v) => !v)}
          style={{
            border: `1px solid ${palette.text}66`,
            background: showLabels ? palette.text : "transparent",
            color: showLabels ? palette.background : palette.text,
          }}
        >
          Labels
        </button>

        <div className="wt-divider" style={{ background: `${palette.text}33` }} />

        {(Object.keys(palettes) as PaletteName[]).map((name) => (
          <button
            key={name}
            className="wt-swatch"
            title={name}
            onClick={() => setPaletteName(name)}
            style={{
              background: palettes[name].land,
              border: name === paletteName
                ? `3px solid ${palette.text}`
                : `2px solid ${palettes[name].text}66`,
            }}
          />
        ))}
      </div>

      <ComposableMap projection="geoEqualEarth" style={{ background: palette.background }}>
        <ZoomableGroup center={position.coordinates} zoom={zoom} onMoveEnd={setPosition}>
          <GeoLayer
            geography={WORLD_URL}
            getName={(p) => p.NAME || p.ADMIN || ""}
            getKey={(p) => p.ISO_A3 || p.ADM0_A3 || ""}
            visitedKeys={visited.countries}
            visitedYears={allVisited.countries}
            showLabel={worldLabel}
            palette={palette}
            zoom={zoom}
            onTooltip={(name, years) => name ? setTooltip({ name, years }) : setTooltip(null)}
          />
          <GeoLayer
            geography={US_STATES_URL}
            getName={(p) => p.name || ""}
            getKey={(p) => p.name || ""}
            visitedKeys={visited.states}
            visitedYears={allVisited.states}
            showLabel={stateLabel}
            palette={palette}
            zoom={zoom}
            onTooltip={(name, years) => name ? setTooltip({ name, years }) : setTooltip(null)}
          />
        </ZoomableGroup>
      </ComposableMap>

      <Timeline
        min={config?.startYear}
        max={endYear}
        value={activeYear}
        onChange={setYear}
        palette={palette}
      />

      <ZoomControls
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={reset}
        palette={palette}
      />
    </div>
  );
}
