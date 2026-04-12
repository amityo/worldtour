import React from "react";

interface TimelineProps {
  min?: number;
  max?: number;
  value: number;
  onChange: (year: number) => void;
  palette: { background: string; secondary: string; text: string };
}

const MIN_DEFAULT = 1900;
const MAX_DEFAULT = 2024;
const MAJOR_STEP  = 25;
const MINOR_STEP  = 5;

export function Timeline({
  min = MIN_DEFAULT,
  max = MAX_DEFAULT,
  value,
  onChange,
  palette,
}: TimelineProps) {
  const pct = ((value - min) / (max - min)) * 100;

  const ticks: { year: number; major: boolean }[] = [];
  for (let y = min; y <= max; y++) {
    if (y % MINOR_STEP === 0) ticks.push({ year: y, major: y % MAJOR_STEP === 0 });
  }

  const trackStyle: React.CSSProperties = {
    background: `linear-gradient(to right, ${palette.secondary} ${pct}%, ${palette.text}22 ${pct}%)`,
  };

  return (
    <div
      className="wt-timeline"
      style={{ background: palette.background, border: `1px solid ${palette.text}33` }}
    >
      <span className="wt-timeline-year" style={{ color: palette.text }}>
        {value}
      </span>

      <div className="wt-timeline-track">
        <input
          type="range"
          className="wt-timeline-input"
          min={min}
          max={max}
          value={value}
          step={1}
          onChange={(e) => onChange(Number(e.target.value))}
          style={
            {
              ...trackStyle,
              "--thumb": palette.secondary,
              "--thumb-border": palette.background,
            } as React.CSSProperties
          }
        />

        <div className="wt-timeline-ticks">
          {ticks.map(({ year, major }) => (
            <div
              key={year}
              className={`wt-tick${major ? " wt-tick--major" : ""}`}
              style={{
                left: `${((year - min) / (max - min)) * 100}%`,
                background: palette.text,
              }}
            >
              {major && (
                <span className="wt-tick-label" style={{ color: palette.text }}>
                  {year}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
