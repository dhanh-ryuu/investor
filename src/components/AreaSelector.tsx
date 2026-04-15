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
    <div className="pill-group">
      {AREAS.map(({ key, label }) => (
        <button
          key={key}
          className={`pill ${selected === key ? "active" : ""}`}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
