import { useEffect, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import { geoCentroid } from "d3-geo";

// Natural Earth 110m — includes POP_EST, NAME, etc.
const WORLD_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const US_STATES_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// Swap WORLD_URL to a Natural Earth GeoJSON (e.g. ne_110m_admin_0_countries.geojson)
// if you need POP_EST-based filtering/sizing.

const palettes = {
  signature: { background: "#87CEEB", land: "#FFF8DC", secondary: "#FFDEAD", text: "#800000" },
  grey:      { background: "#fafafa", land: "#d3d3d3", secondary: "#939393", text: "#191919" },
  green:     { background: "#dda15e", land: "#606c38", secondary: "#394021", text: "#fefae0" },
  calm:      { background: "#9dc7e2", land: "#e1e0d0", secondary: "#c3c1a1", text: "#191919" },
  purple:    { background: "#ffcdb2", land: "#b5838d", secondary: "#6d6875", text: "#023047" },
  dark:      { background: "#2c3e50", land: "#f4a261", secondary: "#92613a", text: "#ffffff" },
} as const;

type PaletteName = keyof typeof palettes;

function labelFontSize(pop: number | undefined): number {
  if (!pop) return 10;
  if (pop > 100_000_000) return 14;
  if (pop > 50_000_000) return 12;
  return 10;
}

export default function WorldMap() {
  const [tooltip, setTooltip] = useState("");
  const [usStates, setUsStates] = useState(null);
  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [0, 0],
    zoom: 1,
  });
  const [paletteName, setPaletteName] = useState<PaletteName>("signature");
  const [showLabels, setShowLabels] = useState(false);

  const palette = palettes[paletteName];
  const zoom = position.zoom;

  useEffect(() => {
    fetch(US_STATES_URL)
      .then((res) => res.json())
      .then((data) => setUsStates(data));
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh", background: palette.background }}>
      {/* Tooltip */}
      <div
        style={{
          position: "fixed",
          top: 10,
          left: 10,
          background: palette.background,
          color: palette.text,
          padding: "6px 10px",
          border: `1px solid ${palette.text}44`,
          borderRadius: "8px",
          pointerEvents: "none",
          fontFamily: "sans-serif",
          fontSize: 14,
        }}
      >
        {tooltip || "Hover a country/state"}
      </div>

      {/* Controls */}
      <div
        style={{
          position: "fixed",
          top: 10,
          right: 10,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: palette.background,
          padding: "6px 10px",
          border: `1px solid ${palette.text}44`,
          borderRadius: "8px",
        }}
      >
        <button
          title="Toggle labels"
          onClick={() => setShowLabels((v) => !v)}
          style={{
            fontSize: 12,
            fontFamily: "sans-serif",
            padding: "2px 8px",
            borderRadius: 4,
            border: `1px solid ${palette.text}66`,
            background: showLabels ? palette.text : "transparent",
            color: showLabels ? palette.background : palette.text,
            cursor: "pointer",
          }}
        >
          Labels
        </button>

        <div style={{ width: 1, height: 18, background: `${palette.text}33` }} />

        {(Object.keys(palettes) as PaletteName[]).map((name) => (
          <button
            key={name}
            title={name}
            onClick={() => setPaletteName(name)}
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: palettes[name].land,
              border: name === paletteName
                ? `3px solid ${palette.text}`
                : `2px solid ${palettes[name].text}66`,
              cursor: "pointer",
              padding: 0,
            }}
          />
        ))}
      </div>

      <ComposableMap projection="geoEqualEarth" style={{ background: palette.background }}>
        <ZoomableGroup center={position.coordinates} zoom={zoom} onMoveEnd={setPosition}>

          {/* Countries */}
          <Geographies geography={WORLD_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const name: string = geo.properties.name || geo.properties.ADMIN || "";
                const pop: number | undefined = geo.properties.POP_EST as number | undefined;
                const centroid = geoCentroid(geo);

                // Skip label for tiny countries; keep Geography regardless
                const showThisLabel =
                  showLabels &&
                  zoom > 2 &&
                  (pop === undefined || pop >= 5_000_000);

                const fs = labelFontSize(pop) / zoom;

                return (
                  <g key={geo.rsmKey}>
                    <Geography
                      geography={geo}
                      onMouseEnter={() => setTooltip(name)}
                      onMouseLeave={() => setTooltip("")}
                      style={{
                        default: { fill: palette.land, outline: "none" },
                        hover:   { fill: palette.secondary, outline: "none" },
                        pressed: { fill: palette.secondary, outline: "none" },
                      }}
                    />
                    {showThisLabel && (
                      <Marker coordinates={centroid as [number, number]}>
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          style={{
                            fontFamily: "system-ui",
                            fontSize: fs,
                            fill: palette.text,
                            pointerEvents: "none",
                            userSelect: "none",
                          }}
                        >
                          {name}
                        </text>
                      </Marker>
                    )}
                  </g>
                );
              })
            }
          </Geographies>

          {/* US States overlay */}
          {usStates && (
            <Geographies geography={usStates}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const name: string = geo.properties.name || "";
                  const centroid = geoCentroid(geo);
                  const fs = 10 / zoom;

                  return (
                    <g key={geo.rsmKey}>
                      <Geography
                        geography={geo}
                        onMouseEnter={() => setTooltip(name)}
                        onMouseLeave={() => setTooltip("")}
                        style={{
                          default: { fill: palette.land, outline: "none" },
                          hover:   { fill: palette.secondary, outline: "none" },
                          pressed: { fill: palette.secondary, outline: "none" },
                        }}
                      />
                      {showLabels && zoom > 4 && (
                        <Marker coordinates={centroid as [number, number]}>
                          <text
                            textAnchor="middle"
                            dominantBaseline="central"
                            style={{
                              fontFamily: "system-ui",
                              fontSize: fs,
                              fill: palette.text,
                              stroke: palette.background,
                              strokeWidth: 3 / zoom,
                              paintOrder: "stroke",
                              pointerEvents: "none",
                              userSelect: "none",
                            }}
                          >
                            {name}
                          </text>
                        </Marker>
                      )}
                    </g>
                  );
                })
              }
            </Geographies>
          )}

        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
