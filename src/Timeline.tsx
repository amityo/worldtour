import React, { useMemo } from "react";

interface TimelineProps {
  min?: number;
  max?: number;
  value: number;
  onChange: (year: number) => void;
  palette: { background: string; secondary: string; text: string };
}

const MIN_DEFAULT = 1900;
const MAX_DEFAULT = 2024;

function tickSteps(range: number): { major: number; minor: number } {
  if (range > 200) return { major: 50, minor: 10 };
  if (range > 100) return { major: 25, minor: 5  };
  if (range > 50)  return { major: 10, minor: 2  };
  if (range > 20)  return { major: 5,  minor: 1  };
  if (range > 10)  return { major: 2,  minor: 1  };
  return           { major: 1,  minor: 1  };
}

export function Timeline({
  min = MIN_DEFAULT,
  max = MAX_DEFAULT,
  value,
  onChange,
  palette,
}: TimelineProps) {
  const pct   = ((value - min) / (max - min)) * 100;
  const range = max - min;
  const { major: majorStep, minor: minorStep } = tickSteps(range);

  const ticks = useMemo(() => {
    const result: { year: number; major: boolean }[] = [];
    for (let y = min; y <= max; y++) {
      if (y % minorStep === 0) result.push({ year: y, major: y % majorStep === 0 });
    }
    return result;
  }, [min, max, majorStep, minorStep]);

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
