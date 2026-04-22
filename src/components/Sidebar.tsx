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
    <aside className="hidden md:flex flex-col w-[200px] h-screen bg-[var(--sidebar-bg)] border-r border-[var(--border)] sticky top-0 overflow-y-auto shrink-0">
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
                "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] text-sm font-medium transition-colors text-left",
                isActive
                  ? "bg-white/5 text-white"
                  : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5",
              ].join(" ")}
            >
              <span className="text-base">{icon}</span>
              {label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-6">
        <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-widest">
          Updated daily
        </p>
      </div>
    </aside>
  );
}
