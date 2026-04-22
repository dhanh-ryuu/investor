"use client";

interface AreaSelectorProps {
  selected: string;
  onChange: (area: string) => void;
}

const AREAS = [
  { key: "all", label: "All" },
  { key: "ocean_park_1", label: "OP1" },
  { key: "ocean_park_2", label: "OP2" },
  { key: "ocean_park_3", label: "OP3" },
];

export default function AreaSelector({ selected, onChange }: AreaSelectorProps) {
  return (
    <div className="flex gap-6 border-b border-[var(--border)] mb-4">
      {AREAS.map(({ key, label }) => {
        const isActive = selected === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={[
              "pb-2 text-sm font-medium transition-colors",
              isActive
                ? "border-b-2 border-[var(--text)] text-[var(--text)] -mb-px"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
