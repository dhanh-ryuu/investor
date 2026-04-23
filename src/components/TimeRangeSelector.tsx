"use client";

interface TimeRangeSelectorProps {
  selected: string;
  onChange: (range: string) => void;
}

const RANGES = ["1m", "3m", "6m"];

export default function TimeRangeSelector({ selected, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex gap-6 border-b border-[var(--border)] mb-6">
      {RANGES.map((range) => {
        const isActive = selected === range;
        return (
          <button
            key={range}
            onClick={() => onChange(range)}
            className={[
              "pb-3 text-sm font-medium transition-colors",
              isActive
                ? "border-b-2 border-[var(--text)] text-[var(--text)] -mb-px"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
            ].join(" ")}
          >
            {range.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
