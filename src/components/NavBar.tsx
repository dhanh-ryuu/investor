"use client";

interface NavBarProps {
  active: "gold" | "apartment";
  onChange: (view: "gold" | "apartment") => void;
}

export default function NavBar({ active, onChange }: NavBarProps) {
  return (
    <div className="pill-group" style={{ marginBottom: "4px" }}>
      <button
        className={`pill ${active === "gold" ? "active" : ""}`}
        onClick={() => onChange("gold")}
      >
        GOLD
      </button>
      <button
        className={`pill ${active === "apartment" ? "active" : ""}`}
        onClick={() => onChange("apartment")}
      >
        APARTMENT
      </button>
    </div>
  );
}
