"use client";

interface TimeRangeSelectorProps {
  selected: string;
  onChange: (range: string) => void;
}

const RANGES = ["1m", "3m", "6m"];

export default function TimeRangeSelector({ selected, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="pill-group">
      {RANGES.map((range) => (
        <button
          key={range}
          className={`pill ${selected === range ? "active" : ""}`}
          onClick={() => onChange(range)}
        >
          {range.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
