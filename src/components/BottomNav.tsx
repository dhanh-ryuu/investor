"use client";

interface BottomNavProps {
  active: "gold" | "apartment";
  onChange: (view: "gold" | "apartment") => void;
}

const NAV_ITEMS: { key: "gold" | "apartment"; label: string; icon: string }[] = [
  { key: "gold", label: "Gold", icon: "◆" },
  { key: "apartment", label: "Apartment", icon: "⊞" },
];

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-[#0a0a0a] border-t border-neutral-800 flex h-14">
      {NAV_ITEMS.map(({ key, label, icon }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={[
              "flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors",
              isActive ? "text-white" : "text-neutral-500",
            ].join(" ")}
          >
            <span className="text-base leading-none">{icon}</span>
            {label}
          </button>
        );
      })}
    </nav>
  );
}
