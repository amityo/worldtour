import React from "react";

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  palette: { background: string; text: string };
}

export function ZoomControls({ onZoomIn, onZoomOut, onReset, palette }: ZoomControlsProps) {
  const btn: React.CSSProperties = {
    flex: 1,
    background: "transparent",
    color: palette.text,
    border: `1px solid ${palette.text}44`,
    borderRadius: 6,
    height: 32,
    cursor: "pointer",
    fontSize: 18,
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const resetBtn: React.CSSProperties = {
    ...btn,
    flex: "unset",
    width: "100%",
    fontSize: 12,
    fontFamily: "sans-serif",
    letterSpacing: "0.03em",
  };

  return (
    <div
      className="wt-zoom-controls"
      style={{ background: palette.background, border: `1px solid ${palette.text}33` }}
    >
      <div style={{ display: "flex", gap: 4 }}>
        <button style={btn} title="Zoom in"  onClick={onZoomIn}>+</button>
        <button style={btn} title="Zoom out" onClick={onZoomOut}>−</button>
      </div>
      <button style={resetBtn} title="Reset view" onClick={onReset}>Reset</button>
    </div>
  );
}
