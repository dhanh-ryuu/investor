"use client";

interface SidebarProps {
  active: "gold" | "apartment";
  onChange: (view: "gold" | "apartment") => void;
}

const NAV_ITEMS: { key: "gold" | "apartment"; label: string; icon: string }[] = [
  { key: "gold", label: "Gold", icon: "◆" },
  { key: "apartment", label: "Apartment", icon: "⊞" },
];

export default function Sidebar({ active, onChange }: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-[200px] min-h-screen bg-[#0a0a0a] fixed left-0 top-0 z-10">
      {/* Logo */}
      <div className="px-6 py-8">
        <span className="text-white text-xs font-semibold tracking-[0.2em] uppercase">
          Investor
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col px-3 gap-1 flex-1">
        {NAV_ITEMS.map(({ key, label, icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors text-left",
                isActive
                  ? "text-white bg-white/10 border-l-2 border-white"
                  : "text-neutral-400 hover:text-neutral-100 hover:bg-white/5 border-l-2 border-transparent",
              ].join(" ")}
            >
              <span className="text-base">{icon}</span>
              {label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-6">
        <p className="text-[11px] text-neutral-600 uppercase tracking-widest">
          Updated daily
        </p>
      </div>
    </aside>
  );
}
