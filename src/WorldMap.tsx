import { useState } from "react";
import {
  ComposableMap,
  Geography,
  Marker,
  ZoomableGroup,
  useGeographies,
} from "react-simple-maps";
import { geoCentroid, geoArea } from "d3-geo";
import polylabel from "polylabel";
import { labelSize } from "./labelSize";
import "./WorldMap.css";

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
  getName: (props: Record<string, string>) => string;
  showLabel: (geo: { properties: Record<string, string> }, zoom: number) => boolean;
  palette: Palette;
  zoom: number;
  onTooltip: (name: string) => void;
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

function geoStyle(palette: Palette, zoom: number) {
  const sw = 0.5 / zoom;
  return {
    default: { fill: palette.land,      stroke: palette.secondary, strokeWidth: sw, outline: "none" },
    hover:   { fill: palette.secondary, stroke: palette.secondary, strokeWidth: sw, outline: "none" },
    pressed: { fill: palette.secondary, stroke: palette.secondary, strokeWidth: sw, outline: "none" },
  };
}


function GeoLayer({ geography, getName, showLabel, palette, zoom, onTooltip }: GeoLayerProps) {
  const { geographies } = useGeographies({ geography });
  const style = geoStyle(palette, zoom);

  return (
    <>
      {/* Group 1: fills + borders — data iterated once */}
      <g>
        {geographies.map((geo) => {
          const name = getName(geo.properties as Record<string, string>);
          return (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              onMouseEnter={() => onTooltip(name)}
              onMouseLeave={() => onTooltip("")}
              style={style}
            />
          );
        })}
      </g>

      {/* Group 2: labels always above every border */}
      <g pointerEvents="none">
        {geographies.map((geo) => {
          if (!showLabel(geo, zoom)) return null;
          const name = getName(geo.properties as Record<string, string>);
          const centroid = polylabelCenter(geo);
          const fs = labelSize(geo);
          return (
            <Marker key={`lbl-${geo.rsmKey}`} coordinates={centroid as [number, number]}>
              <text
                className="wt-geo-label"
                textAnchor="middle"
                dominantBaseline="central"
                style={{ fontSize: fs, fill: palette.text }}
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
  const [tooltip, setTooltip] = useState("");
  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [0, 0],
    zoom: 1,
  });
  const [paletteName, setPaletteName] = useState<PaletteName>("signature");
  const [showLabels, setShowLabels] = useState(true);

  const palette = palettes[paletteName];
  const zoom = position.zoom;

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
    >
      <div
        className="wt-tooltip"
        style={{
          background: palette.background,
          color: palette.text,
          border: `1px solid ${palette.text}44`,
        }}
      >
        {tooltip || "Hover a country/state"}
      </div>

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
            showLabel={worldLabel}
            palette={palette}
            zoom={zoom}
            onTooltip={setTooltip}
          />
          <GeoLayer
            geography={US_STATES_URL}
            getName={(p) => p.name || ""}
            showLabel={stateLabel}
            palette={palette}
            zoom={zoom}
            onTooltip={setTooltip}
          />
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
