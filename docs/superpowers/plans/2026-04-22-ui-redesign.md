# UI Redesign — Minimalist Financial Dashboard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign investor app UI to be minimalist, responsive, and professional — light background, Geist font, sidebar layout on desktop, bottom nav on mobile.

**Architecture:** Tailwind v4 overhaul. Replace inline styles and custom CSS classes with Tailwind utilities. New design tokens in `globals.css`. Two new navigation components (Sidebar + BottomNav) placed in `page.tsx` so they share state with the view toggle. Components migrated one by one; at every commit the app remains functional.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, Geist (next/font/google), Vitest + @testing-library/react

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `vitest.config.ts` | Modify | Add setupFiles for jest-dom |
| `__tests__/setup.ts` | Create | Import @testing-library/jest-dom |
| `src/app/globals.css` | Rewrite | Design tokens, base styles, keep legacy classes updated |
| `src/app/layout.tsx` | Modify | Apply Geist font |
| `src/app/page.tsx` | Modify | Add Sidebar + BottomNav, responsive wrapper |
| `src/components/NavBar.tsx` | Delete | Replaced by Sidebar + BottomNav |
| `src/components/Sidebar.tsx` | Create | Desktop left navigation |
| `src/components/BottomNav.tsx` | Create | Mobile bottom tab bar |
| `src/components/Skeleton.tsx` | Create | Shimmer loading placeholder |
| `src/components/TimeRangeSelector.tsx` | Rewrite | Underline tab style |
| `src/components/AreaSelector.tsx` | Rewrite | Underline tab style |
| `src/components/Header.tsx` | Rewrite | Hero price display |
| `src/components/GoldView.tsx` | Modify | Use Skeleton, remove `.card` wrapper |
| `src/components/ApartmentView.tsx` | Modify | Use Skeleton, update bedroom filter tabs |
| `src/components/PriceChart.tsx` | Modify | Update chart colors to light theme |
| `src/components/ApartmentChart.tsx` | Modify | Update chart colors to light theme |
| `src/components/StatsBar.tsx` | Rewrite | Tailwind utility classes |
| `src/components/ApartmentStatsBar.tsx` | Rewrite | Tailwind utility classes |
| `src/components/PriceTable.tsx` | Rewrite | Tailwind, tabular-nums, right-align numbers |
| `src/components/ApartmentPriceTable.tsx` | Rewrite | Tailwind, tabular-nums, right-align numbers |
| `src/components/ApartmentListings.tsx` | Rewrite | Clean accordion, Tailwind |
| `__tests__/components/TimeRangeSelector.test.tsx` | Create | Renders buttons, active underline |
| `__tests__/components/Sidebar.test.tsx` | Create | Renders nav items, active state |
| `__tests__/components/BottomNav.test.tsx` | Create | Renders tabs, fires onChange |
| `__tests__/components/Skeleton.test.tsx` | Create | Renders shimmer div |
| `__tests__/components/Header.test.tsx` | Create | Renders price, change badge |
| `__tests__/components/ApartmentListings.test.tsx` | Create | Accordion expand/collapse |

---

## Task 1: Test infrastructure + Geist font + globals.css

**Files:**
- Modify: `vitest.config.ts`
- Create: `__tests__/setup.ts`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

### Step 1.1 — Add jest-dom setup to vitest

- [ ] Edit `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["__tests__/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] Create `__tests__/setup.ts`:

```ts
import "@testing-library/jest-dom";
```

- [ ] Verify existing tests still pass:

```bash
npm test
```

Expected: all existing tests pass (lib + api tests).

### Step 1.2 — Rewrite globals.css

- [ ] Replace entire `src/app/globals.css` with:

```css
@import "tailwindcss";

:root {
  --bg: #ffffff;
  --bg-subtle: #f5f5f5;
  --sidebar-bg: #0a0a0a;
  --text: #0a0a0a;
  --text-secondary: #525252;
  --text-muted: #a3a3a3;
  --border: #e5e5e5;
  --green: #16a34a;
  --red: #dc2626;
  --radius: 6px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
}

/* Legacy classes — kept during migration, removed in Task 12 */
.card {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 12px;
}

.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-item {
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
}

.stat-label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 500;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  margin-top: 4px;
  font-variant-numeric: tabular-nums;
}

.price-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.price-table th {
  text-align: left;
  padding: 0 0 10px;
  color: var(--text-muted);
  font-weight: 500;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-bottom: 1px solid var(--text);
}

.price-table td {
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
  color: var(--text-secondary);
}

.table-scroll {
  margin-bottom: 12px;
}

.pill-group {
  display: flex;
  gap: 6px;
  margin: 12px 0;
}

.pill {
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.pill.active {
  background: var(--text);
  color: var(--bg);
  border-color: var(--text);
}

.price-up {
  color: var(--red);
}

.price-down {
  color: var(--green);
}
```

### Step 1.3 — Add Geist font to layout.tsx

- [ ] Replace `src/app/layout.tsx`:

```tsx
import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "Investor",
  description: "Track gold and apartment prices",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={geist.variable}>
      <body style={{ fontFamily: "var(--font-geist), -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
```

### Step 1.4 — Verify app renders

- [ ] Start dev server and confirm app loads with new light theme and Geist font:

```bash
npm run dev
```

Open http://localhost:3000 — background should be white, font should be Geist.

### Step 1.5 — Commit

- [ ] Commit:

```bash
git add vitest.config.ts __tests__/setup.ts src/app/globals.css src/app/layout.tsx
git commit -m "feat: redesign foundation — Geist font, light theme tokens, test setup"
```

---

## Task 2: TimeRangeSelector + AreaSelector — underline tab style

**Files:**
- Rewrite: `src/components/TimeRangeSelector.tsx`
- Rewrite: `src/components/AreaSelector.tsx`
- Create: `__tests__/components/TimeRangeSelector.test.tsx`

### Step 2.1 — Write failing test

- [ ] Create `__tests__/components/TimeRangeSelector.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import TimeRangeSelector from "@/components/TimeRangeSelector";

describe("TimeRangeSelector", () => {
  it("renders all range buttons", () => {
    render(<TimeRangeSelector selected="1m" onChange={vi.fn()} />);
    expect(screen.getByText("1M")).toBeInTheDocument();
    expect(screen.getByText("3M")).toBeInTheDocument();
    expect(screen.getByText("6M")).toBeInTheDocument();
  });

  it("active button has border-b-2 class", () => {
    render(<TimeRangeSelector selected="3m" onChange={vi.fn()} />);
    const active = screen.getByText("3M");
    expect(active.className).toMatch(/border-b-2/);
  });

  it("calls onChange with correct value on click", () => {
    const onChange = vi.fn();
    render(<TimeRangeSelector selected="1m" onChange={onChange} />);
    fireEvent.click(screen.getByText("6M"));
    expect(onChange).toHaveBeenCalledWith("6m");
  });
});
```

### Step 2.2 — Run test to confirm it fails

```bash
npm test -- --reporter=verbose TimeRangeSelector
```

Expected: FAIL — component doesn't have `border-b-2` class.

### Step 2.3 — Rewrite TimeRangeSelector.tsx

- [ ] Replace `src/components/TimeRangeSelector.tsx`:

```tsx
"use client";

interface TimeRangeSelectorProps {
  selected: string;
  onChange: (range: string) => void;
}

const RANGES = ["1m", "3m", "6m"];

export default function TimeRangeSelector({ selected, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex gap-6 border-b border-[var(--border)] mb-4">
      {RANGES.map((range) => {
        const isActive = selected === range;
        return (
          <button
            key={range}
            onClick={() => onChange(range)}
            className={[
              "pb-2 text-sm font-medium transition-colors",
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
```

### Step 2.4 — Run test to confirm it passes

```bash
npm test -- --reporter=verbose TimeRangeSelector
```

Expected: all 3 tests PASS.

### Step 2.5 — Rewrite AreaSelector.tsx

- [ ] Replace `src/components/AreaSelector.tsx`:

```tsx
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
```

### Step 2.6 — Run all tests

```bash
npm test
```

Expected: all tests pass.

### Step 2.7 — Commit

```bash
git add src/components/TimeRangeSelector.tsx src/components/AreaSelector.tsx __tests__/components/TimeRangeSelector.test.tsx
git commit -m "feat: underline tab style for TimeRangeSelector and AreaSelector"
```

---

## Task 3: Skeleton component

**Files:**
- Create: `src/components/Skeleton.tsx`
- Create: `__tests__/components/Skeleton.test.tsx`

### Step 3.1 — Write failing test

- [ ] Create `__tests__/components/Skeleton.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Skeleton from "@/components/Skeleton";

describe("Skeleton", () => {
  it("renders a div with animate-pulse", () => {
    const { container } = render(<Skeleton className="h-10 w-48" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/animate-pulse/);
  });

  it("applies additional className", () => {
    const { container } = render(<Skeleton className="h-4 w-24" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/h-4/);
    expect(el.className).toMatch(/w-24/);
  });
});
```

### Step 3.2 — Run test to confirm it fails

```bash
npm test -- --reporter=verbose Skeleton
```

Expected: FAIL — component not found.

### Step 3.3 — Create Skeleton.tsx

- [ ] Create `src/components/Skeleton.tsx`:

```tsx
interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-[var(--bg-subtle)] rounded-[var(--radius)] ${className}`}
    />
  );
}
```

### Step 3.4 — Run test to confirm it passes

```bash
npm test -- --reporter=verbose Skeleton
```

Expected: 2 tests PASS.

### Step 3.5 — Commit

```bash
git add src/components/Skeleton.tsx __tests__/components/Skeleton.test.tsx
git commit -m "feat: add Skeleton shimmer loading component"
```

---

## Task 4: Sidebar + BottomNav components

**Files:**
- Create: `src/components/Sidebar.tsx`
- Create: `src/components/BottomNav.tsx`
- Create: `__tests__/components/Sidebar.test.tsx`
- Create: `__tests__/components/BottomNav.test.tsx`

### Step 4.1 — Write failing tests

- [ ] Create `__tests__/components/Sidebar.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Sidebar from "@/components/Sidebar";

describe("Sidebar", () => {
  it("renders Gold and Apartment nav items", () => {
    render(<Sidebar active="gold" onChange={vi.fn()} />);
    expect(screen.getByText("Gold")).toBeInTheDocument();
    expect(screen.getByText("Apartment")).toBeInTheDocument();
  });

  it("active item has white text class", () => {
    render(<Sidebar active="gold" onChange={vi.fn()} />);
    const goldBtn = screen.getByText("Gold").closest("button")!;
    expect(goldBtn.className).toMatch(/text-white/);
  });

  it("inactive item does not have white text", () => {
    render(<Sidebar active="gold" onChange={vi.fn()} />);
    const aptBtn = screen.getByText("Apartment").closest("button")!;
    expect(aptBtn.className).not.toMatch(/text-white /);
  });

  it("calls onChange when nav item clicked", () => {
    const onChange = vi.fn();
    render(<Sidebar active="gold" onChange={onChange} />);
    fireEvent.click(screen.getByText("Apartment"));
    expect(onChange).toHaveBeenCalledWith("apartment");
  });
});
```

- [ ] Create `__tests__/components/BottomNav.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import BottomNav from "@/components/BottomNav";

describe("BottomNav", () => {
  it("renders Gold and Apartment tabs", () => {
    render(<BottomNav active="gold" onChange={vi.fn()} />);
    expect(screen.getByText("Gold")).toBeInTheDocument();
    expect(screen.getByText("Apartment")).toBeInTheDocument();
  });

  it("calls onChange when tab clicked", () => {
    const onChange = vi.fn();
    render(<BottomNav active="gold" onChange={onChange} />);
    fireEvent.click(screen.getByText("Apartment"));
    expect(onChange).toHaveBeenCalledWith("apartment");
  });
});
```

### Step 4.2 — Run tests to confirm they fail

```bash
npm test -- --reporter=verbose Sidebar BottomNav
```

Expected: FAIL — components not found.

### Step 4.3 — Create Sidebar.tsx

- [ ] Create `src/components/Sidebar.tsx`:

```tsx
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
                  : "text-neutral-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent",
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
```

### Step 4.4 — Create BottomNav.tsx

- [ ] Create `src/components/BottomNav.tsx`:

```tsx
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
```

### Step 4.5 — Run tests to confirm they pass

```bash
npm test -- --reporter=verbose Sidebar BottomNav
```

Expected: all tests PASS.

### Step 4.6 — Commit

```bash
git add src/components/Sidebar.tsx src/components/BottomNav.tsx __tests__/components/Sidebar.test.tsx __tests__/components/BottomNav.test.tsx
git commit -m "feat: add Sidebar (desktop) and BottomNav (mobile) navigation"
```

---

## Task 5: page.tsx — responsive layout + remove NavBar

**Files:**
- Modify: `src/app/page.tsx`
- Delete: `src/components/NavBar.tsx`

### Step 5.1 — Rewrite page.tsx

- [ ] Replace `src/app/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import GoldView from "@/components/GoldView";
import ApartmentView from "@/components/ApartmentView";

export default function Home() {
  const [view, setView] = useState<"gold" | "apartment">("gold");

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      {/* Desktop sidebar */}
      <Sidebar active={view} onChange={setView} />

      {/* Main content */}
      <main className="flex-1 md:ml-[200px] min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-8 pb-20 md:pb-8">
          {view === "gold" && <GoldView />}
          {view === "apartment" && <ApartmentView />}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav active={view} onChange={setView} />
    </div>
  );
}
```

### Step 5.2 — Delete NavBar.tsx

```bash
rm /path/to/project/src/components/NavBar.tsx
```

Replace `/path/to/project` with the actual project root, e.g.:
```bash
rm src/components/NavBar.tsx
```

### Step 5.3 — Verify app renders correctly

```bash
npm run dev
```

- Desktop (≥ 768px): dark sidebar left, white content right
- Mobile (< 768px): no sidebar, black bottom bar visible
- Switching Gold/Apartment works

### Step 5.4 — Commit

```bash
git add src/app/page.tsx
git rm src/components/NavBar.tsx
git commit -m "feat: responsive layout — sidebar desktop, bottom nav mobile"
```

---

## Task 6: Header.tsx — hero price redesign

**Files:**
- Rewrite: `src/components/Header.tsx`
- Create: `__tests__/components/Header.test.tsx`

### Step 6.1 — Write failing test

- [ ] Create `__tests__/components/Header.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Header from "@/components/Header";

const samplePrices = [
  { date: "2026-04-21", buy_price: 15300000, sell_price: 15800000 },
  { date: "2026-04-22", buy_price: 15500000, sell_price: 16000000 },
];

describe("Header", () => {
  it("renders empty state when no prices", () => {
    render(<Header prices={[]} />);
    expect(screen.getByText(/no price data/i)).toBeInTheDocument();
  });

  it("renders latest sell price in large text", () => {
    render(<Header prices={samplePrices} />);
    expect(screen.getByText("16.000.000 ₫")).toBeInTheDocument();
  });

  it("shows positive change badge when price increased", () => {
    render(<Header prices={samplePrices} />);
    const badge = screen.getByText(/\+200\.000/);
    expect(badge).toBeInTheDocument();
    expect(badge.className).toMatch(/text-\[var\(--green\)\]/);
  });

  it("shows buy and sell prices", () => {
    render(<Header prices={samplePrices} />);
    expect(screen.getByText("15.500.000")).toBeInTheDocument();
    expect(screen.getByText("16.000.000")).toBeInTheDocument();
  });
});
```

### Step 6.2 — Run test to confirm it fails

```bash
npm test -- --reporter=verbose Header
```

Expected: FAIL — price format and badge class don't match.

### Step 6.3 — Rewrite Header.tsx

- [ ] Replace `src/components/Header.tsx`:

```tsx
import { PriceRow, calculateChange } from "@/lib/indicators";

interface HeaderProps {
  prices: PriceRow[];
}

function formatVND(value: number): string {
  return value.toLocaleString("vi-VN");
}

export default function Header({ prices }: HeaderProps) {
  if (prices.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-[var(--text-muted)] text-sm">No price data available yet</p>
      </div>
    );
  }

  const latest = prices[prices.length - 1];
  const previous = prices.length > 1 ? prices[prices.length - 2] : null;
  const buyChange = previous ? calculateChange(previous.buy_price, latest.buy_price) : null;
  const isUp = buyChange ? buyChange.absolute > 0 : false;
  const isDown = buyChange ? buyChange.absolute < 0 : false;

  return (
    <div className="pb-8 mb-6 border-b border-[var(--border)]">
      {/* Date + label */}
      <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-3">
        Vàng 9999 · {latest.date}
      </p>

      {/* Hero price */}
      <div className="text-4xl font-bold tabular-nums mb-2 text-[var(--text)]">
        {formatVND(latest.sell_price)} ₫
      </div>

      {/* Change badge */}
      {buyChange && (
        <span
          className={[
            "inline-block text-sm font-medium px-2.5 py-0.5 rounded mb-4",
            isUp
              ? "bg-green-50 text-[var(--green)]"
              : isDown
              ? "bg-red-50 text-[var(--red)]"
              : "bg-[var(--bg-subtle)] text-[var(--text-muted)]",
          ].join(" ")}
        >
          {buyChange.absolute > 0 ? "+" : ""}
          {formatVND(buyChange.absolute)} ({buyChange.percentage > 0 ? "+" : ""}
          {buyChange.percentage.toFixed(2)}%)
        </span>
      )}

      {/* Buy / Sell row */}
      <div className="flex gap-8 text-sm text-[var(--text-secondary)]">
        <div>
          <span className="text-[var(--text-muted)] text-xs uppercase tracking-wide mr-2">Mua</span>
          <span className="font-semibold text-[var(--text)] tabular-nums">
            {formatVND(latest.buy_price)}
          </span>
        </div>
        <div>
          <span className="text-[var(--text-muted)] text-xs uppercase tracking-wide mr-2">Bán</span>
          <span className="font-semibold text-[var(--text)] tabular-nums">
            {formatVND(latest.sell_price)}
          </span>
        </div>
      </div>
    </div>
  );
}
```

### Step 6.4 — Run test to confirm it passes

```bash
npm test -- --reporter=verbose Header
```

Expected: all 4 tests PASS.

### Step 6.5 — Commit

```bash
git add src/components/Header.tsx __tests__/components/Header.test.tsx
git commit -m "feat: redesign Header with hero price layout"
```

---

## Task 7: GoldView + ApartmentView — Skeleton loading + cleanup

**Files:**
- Modify: `src/components/GoldView.tsx`
- Modify: `src/components/ApartmentView.tsx`

### Step 7.1 — Update GoldView.tsx

- [ ] Replace `src/components/GoldView.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import TimeRangeSelector from "@/components/TimeRangeSelector";
import PriceChart from "@/components/PriceChart";
import StatsBar from "@/components/StatsBar";
import PriceTable from "@/components/PriceTable";
import Skeleton from "@/components/Skeleton";
import { PriceRow } from "@/lib/indicators";

const RANGE_DAYS: Record<string, number> = {
  "1m": 30,
  "3m": 90,
  "6m": 180,
};

export default function GoldView() {
  const [range, setRange] = useState("3m");
  const [allPrices, setAllPrices] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrices = useCallback(async (selectedRange: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/prices?range=${selectedRange}`);
      const data: PriceRow[] = await res.json();
      setAllPrices(data);
    } catch (err) {
      console.error("Failed to fetch prices:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices(range);
  }, [range, fetchPrices]);

  const visibleStartIndex =
    allPrices.length > RANGE_DAYS[range] ? allPrices.length - RANGE_DAYS[range] : 0;
  const visiblePrices = allPrices.slice(visibleStartIndex);

  if (loading) {
    return (
      <div>
        <div className="pb-8 mb-6 border-b border-[var(--border)]">
          <Skeleton className="h-3 w-32 mb-3" />
          <Skeleton className="h-10 w-56 mb-2" />
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="flex gap-8">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-[280px] w-full mb-4" />
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Header prices={visiblePrices} />
      <TimeRangeSelector selected={range} onChange={setRange} />
      <PriceChart prices={allPrices} visibleStartIndex={visibleStartIndex} />
      <StatsBar prices={visiblePrices} />
      <PriceTable prices={visiblePrices} />
    </>
  );
}
```

### Step 7.2 — Update ApartmentView.tsx

- [ ] Replace `src/components/ApartmentView.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import TimeRangeSelector from "@/components/TimeRangeSelector";
import AreaSelector from "@/components/AreaSelector";
import ApartmentChart, { type ApartmentPriceRow } from "@/components/ApartmentChart";
import ApartmentStatsBar from "@/components/ApartmentStatsBar";
import ApartmentPriceTable from "@/components/ApartmentPriceTable";
import ApartmentListings from "@/components/ApartmentListings";
import Skeleton from "@/components/Skeleton";

const BEDROOM_TYPES = ["1pn", "2pn", "3pn"];

export default function ApartmentView() {
  const [range, setRange] = useState("1m");
  const [area, setArea] = useState("all");
  const [bedroomFilter, setBedroomFilter] = useState("2pn");
  const [prices, setPrices] = useState<ApartmentPriceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrices = useCallback(async (selectedRange: string, selectedArea: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ range: selectedRange });
      if (selectedArea !== "all") params.set("area", selectedArea);
      const res = await fetch(`/api/apartment-prices?${params}`);
      const data: ApartmentPriceRow[] = await res.json();
      setPrices(data);
    } catch (err) {
      console.error("Failed to fetch apartment prices:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices(range, area);
  }, [range, area, fetchPrices]);

  return (
    <>
      {/* Section header */}
      <div className="pb-6 mb-6 border-b border-[var(--border)]">
        <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-2">
          Vinhomes Ocean Park
        </p>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Apartment Prices</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Average price per m²</p>
      </div>

      <AreaSelector selected={area} onChange={setArea} />
      <TimeRangeSelector selected={range} onChange={setRange} />

      {/* Bedroom filter — only shown in "all" mode */}
      {area === "all" && (
        <div className="flex gap-6 border-b border-[var(--border)] mb-4">
          {BEDROOM_TYPES.map((bt) => {
            const isActive = bedroomFilter === bt;
            return (
              <button
                key={bt}
                onClick={() => setBedroomFilter(bt)}
                className={[
                  "pb-2 text-sm font-medium transition-colors",
                  isActive
                    ? "border-b-2 border-[var(--text)] text-[var(--text)] -mb-px"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
                ].join(" ")}
              >
                {bt.toUpperCase()}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div>
          <Skeleton className="h-[280px] w-full mb-4" />
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </div>
      ) : prices.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[var(--text-muted)] text-sm">
            No apartment data yet. Data will appear after the first daily crawl.
          </p>
        </div>
      ) : (
        <>
          <ApartmentChart prices={prices} selectedArea={area} selectedBedroom={bedroomFilter} />
          <ApartmentStatsBar prices={prices} selectedArea={area} />
          <ApartmentPriceTable prices={prices} selectedArea={area} />
          <ApartmentListings prices={prices} selectedArea={area} />
        </>
      )}
    </>
  );
}
```

### Step 7.3 — Verify in browser

```bash
npm run dev
```

Both views should show skeleton shimmer while loading, no more raw "Loading..." text.

### Step 7.4 — Commit

```bash
git add src/components/GoldView.tsx src/components/ApartmentView.tsx
git commit -m "feat: skeleton loading states for Gold and Apartment views"
```

---

## Task 8: Chart colors — light theme

**Files:**
- Modify: `src/components/PriceChart.tsx`
- Modify: `src/components/ApartmentChart.tsx`

### Step 8.1 — Update PriceChart chart options

- [ ] In `src/components/PriceChart.tsx`, replace the `options` object and dataset colors:

Replace the `data` datasets section:
```tsx
const data = {
  labels,
  datasets: [
    {
      label: "Mua (Buy)",
      data: visiblePrices.map((p) => p.buy_price),
      borderColor: "#0a0a0a",
      backgroundColor: "rgba(10, 10, 10, 0.05)",
      borderWidth: 1.5,
      pointRadius: buyPointRadius,
      pointBackgroundColor: buyPointBgColor,
      pointBorderColor: buyPointBgColor,
      tension: 0.3,
      fill: false,
    },
    {
      label: "Bán (Sell)",
      data: visiblePrices.map((p) => p.sell_price),
      borderColor: "#737373",
      backgroundColor: "transparent",
      borderWidth: 1.5,
      pointRadius: 0,
      tension: 0.3,
      fill: false,
    },
    {
      label: "MA7",
      data: visibleMA7,
      borderColor: "rgba(10, 10, 10, 0.25)",
      borderWidth: 1,
      pointRadius: 0,
      tension: 0.3,
      borderDash: [4, 4],
      fill: false,
    },
    {
      label: "MA30",
      data: visibleMA30,
      borderColor: "rgba(10, 10, 10, 0.12)",
      borderWidth: 1,
      pointRadius: 0,
      tension: 0.3,
      borderDash: [6, 4],
      fill: false,
    },
  ],
};
```

Replace the `options` object:
```tsx
const options: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  plugins: {
    legend: {
      display: true,
      position: "bottom",
      labels: { color: "#a3a3a3", font: { size: 11 }, boxWidth: 12, padding: 12 },
    },
    tooltip: {
      backgroundColor: "#ffffff",
      titleColor: "#0a0a0a",
      bodyColor: "#525252",
      borderColor: "#e5e5e5",
      borderWidth: 1,
      padding: 10,
      callbacks: {
        label(ctx) {
          if (ctx.raw === null) return "";
          const val = ctx.raw as number;
          return `${ctx.dataset.label}: ${val.toLocaleString("vi-VN")} đ`;
        },
      },
    },
  },
  scales: {
    x: {
      ticks: { color: "#a3a3a3", font: { size: 10 }, maxRotation: 45 },
      grid: { color: "rgba(0, 0, 0, 0.05)" },
    },
    y: {
      ticks: {
        color: "#a3a3a3",
        font: { size: 10 },
        callback: (value) => formatMillions(value as number),
      },
      grid: { color: "rgba(0, 0, 0, 0.05)" },
    },
  },
};
```

### Step 8.2 — Update ApartmentChart colors

- [ ] In `src/components/ApartmentChart.tsx`, update the `BEDROOM_COLORS` and `AREA_COLORS` maps and the `options` object:

```tsx
const BEDROOM_COLORS: Record<string, string> = {
  "1pn": "#0a0a0a",
  "2pn": "#525252",
  "3pn": "#a3a3a3",
};

const AREA_COLORS: Record<string, string> = {
  ocean_park_1: "#0a0a0a",
  ocean_park_2: "#525252",
  ocean_park_3: "#a3a3a3",
};
```

Replace the `options` object (same structure as PriceChart step 8.1):
```tsx
const options: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  plugins: {
    legend: {
      display: true,
      position: "bottom",
      labels: { color: "#a3a3a3", font: { size: 11 }, boxWidth: 12, padding: 12 },
    },
    tooltip: {
      backgroundColor: "#ffffff",
      titleColor: "#0a0a0a",
      bodyColor: "#525252",
      borderColor: "#e5e5e5",
      borderWidth: 1,
      padding: 10,
      callbacks: {
        label(ctx) {
          if (ctx.raw === null) return "";
          return `${ctx.dataset.label}: ${formatMillions(ctx.raw as number)}/m²`;
        },
      },
    },
  },
  scales: {
    x: {
      ticks: { color: "#a3a3a3", font: { size: 10 }, maxRotation: 45 },
      grid: { color: "rgba(0, 0, 0, 0.05)" },
    },
    y: {
      ticks: {
        color: "#a3a3a3",
        font: { size: 10 },
        callback: (value) => formatMillions(value as number),
      },
      grid: { color: "rgba(0, 0, 0, 0.05)" },
    },
  },
};
```

### Step 8.3 — Run all tests

```bash
npm test
```

Expected: all tests pass (chart changes don't affect unit tests).

### Step 8.4 — Commit

```bash
git add src/components/PriceChart.tsx src/components/ApartmentChart.tsx
git commit -m "feat: update chart colors for light theme"
```

---

## Task 9: StatsBar + ApartmentStatsBar — Tailwind

**Files:**
- Rewrite: `src/components/StatsBar.tsx`
- Rewrite: `src/components/ApartmentStatsBar.tsx`

### Step 9.1 — Rewrite StatsBar.tsx

- [ ] Replace `src/components/StatsBar.tsx`:

```tsx
import { PriceRow, calculateChange, findHighLow } from "@/lib/indicators";

interface StatsBarProps {
  prices: PriceRow[];
}

function formatVND(value: number): string {
  return value.toLocaleString("vi-VN");
}

export default function StatsBar({ prices }: StatsBarProps) {
  if (prices.length < 2) return null;

  const first = prices[0];
  const latest = prices[prices.length - 1];
  const { high, low } = findHighLow(prices, "buy_price");
  const periodChange = calculateChange(first.buy_price, latest.buy_price);
  const spread = latest.sell_price - latest.buy_price;

  const stats = [
    {
      label: "Period High",
      value: formatVND(high.value),
      sub: high.date,
      valueClass: "text-[var(--red)]",
    },
    {
      label: "Period Low",
      value: formatVND(low.value),
      sub: low.date,
      valueClass: "text-[var(--green)]",
    },
    {
      label: "Period Change",
      value: `${periodChange.percentage > 0 ? "+" : ""}${periodChange.percentage.toFixed(2)}%`,
      sub: null,
      valueClass:
        periodChange.absolute > 0
          ? "text-[var(--red)]"
          : periodChange.absolute < 0
          ? "text-[var(--green)]"
          : "text-[var(--text)]",
    },
    {
      label: "Spread",
      value: formatVND(spread),
      sub: null,
      valueClass: "text-[var(--text)]",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {stats.map(({ label, value, sub, valueClass }) => (
        <div
          key={label}
          className="bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius)] p-4"
        >
          <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1">
            {label}
          </p>
          <p className={`text-xl font-semibold tabular-nums ${valueClass}`}>{value}</p>
          {sub && <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{sub}</p>}
        </div>
      ))}
    </div>
  );
}
```

### Step 9.2 — Rewrite ApartmentStatsBar.tsx

- [ ] Replace `src/components/ApartmentStatsBar.tsx`:

```tsx
import { type ApartmentPriceRow } from "@/components/ApartmentChart";

interface ApartmentStatsBarProps {
  prices: ApartmentPriceRow[];
  selectedArea: string;
}

function formatM(value: number): string {
  return (value / 1_000_000).toFixed(1) + "M";
}

export default function ApartmentStatsBar({ prices, selectedArea }: ApartmentStatsBarProps) {
  if (prices.length === 0) return null;

  const bedroomTypes = ["1pn", "2pn", "3pn"];
  const areas =
    selectedArea === "all"
      ? ["ocean_park_1", "ocean_park_2", "ocean_park_3"]
      : [selectedArea];

  const latestDate = prices.reduce((max, p) => (p.date > max ? p.date : max), "");
  const latestPrices = prices.filter((p) => p.date === latestDate && areas.includes(p.area));

  const weekAgo = new Date(latestDate);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split("T")[0];
  const oldPrices = prices.filter((p) => p.date <= weekAgoStr && areas.includes(p.area));
  const oldestRelevant = oldPrices.reduce((max, p) => (p.date > max ? p.date : max), "");
  const oldPricesByType = new Map(
    oldPrices
      .filter((p) => p.date === oldestRelevant)
      .map((p) => [`${p.area}:${p.bedroom_type}`, p])
  );

  const cards = bedroomTypes
    .map((bt) => {
      const current = latestPrices.filter((p) => p.bedroom_type === bt);
      if (current.length === 0) return null;

      const avgPrice = Math.round(
        current.reduce((sum, p) => sum + p.avg_price_per_m2, 0) / current.length
      );
      const totalListings = current.reduce((sum, p) => sum + p.listing_count, 0);

      let changePct: number | null = null;
      const oldEntries = current
        .map((c) => oldPricesByType.get(`${c.area}:${c.bedroom_type}`))
        .filter(Boolean);
      if (oldEntries.length > 0) {
        const oldAvg = Math.round(
          oldEntries.reduce((sum, p) => sum + p!.avg_price_per_m2, 0) / oldEntries.length
        );
        changePct = ((avgPrice - oldAvg) / oldAvg) * 100;
      }

      return { bt, avgPrice, totalListings, changePct };
    })
    .filter(Boolean) as { bt: string; avgPrice: number; totalListings: number; changePct: number | null }[];

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {cards.map(({ bt, avgPrice, totalListings, changePct }) => (
        <div
          key={bt}
          className="bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius)] p-4"
        >
          <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1">
            {bt}
          </p>
          <p className="text-xl font-semibold tabular-nums text-[var(--text)]">
            {formatM(avgPrice)}/m²
          </p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            {totalListings} listings
            {changePct !== null && (
              <span
                className={`ml-1.5 font-medium ${
                  changePct > 0 ? "text-[var(--red)]" : "text-[var(--green)]"
                }`}
              >
                {changePct > 0 ? "+" : ""}
                {changePct.toFixed(1)}%
              </span>
            )}
          </p>
        </div>
      ))}
    </div>
  );
}
```

### Step 9.3 — Run all tests

```bash
npm test
```

Expected: all tests pass.

### Step 9.4 — Commit

```bash
git add src/components/StatsBar.tsx src/components/ApartmentStatsBar.tsx
git commit -m "feat: redesign stats cards with Tailwind"
```

---

## Task 10: PriceTable + ApartmentPriceTable — Tailwind + tabular-nums

**Files:**
- Rewrite: `src/components/PriceTable.tsx`
- Rewrite: `src/components/ApartmentPriceTable.tsx`

### Step 10.1 — Rewrite PriceTable.tsx

- [ ] Replace `src/components/PriceTable.tsx`:

```tsx
import { PriceRow } from "@/lib/indicators";

interface PriceTableProps {
  prices: PriceRow[];
}

function formatVND(value: number): string {
  return value.toLocaleString("vi-VN");
}

export default function PriceTable({ prices }: PriceTableProps) {
  if (prices.length === 0) return null;

  const reversed = [...prices].reverse();

  return (
    <div className="mb-6">
      <table className="w-full text-[13px]">
        <thead>
          <tr>
            {["Date", "Buy", "Sell", "Change"].map((h) => (
              <th
                key={h}
                className={`pb-2.5 text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest border-b border-[var(--text)] ${
                  h === "Date" ? "text-left" : "text-right"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {reversed.map((row, i) => {
            const prevRow = reversed[i + 1];
            const change = prevRow ? row.buy_price - prevRow.buy_price : 0;
            const changeClass =
              change > 0
                ? "text-[var(--red)]"
                : change < 0
                ? "text-[var(--green)]"
                : "text-[var(--text-muted)]";

            return (
              <tr
                key={row.date}
                className="border-b border-[var(--border)] hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <td className="py-3 text-[var(--text-secondary)]">{row.date.slice(5)}</td>
                <td className="py-3 text-right tabular-nums font-medium text-[var(--text)]">
                  {formatVND(row.buy_price)}
                </td>
                <td className="py-3 text-right tabular-nums text-[var(--text-secondary)]">
                  {formatVND(row.sell_price)}
                </td>
                <td className={`py-3 text-right tabular-nums font-medium ${changeClass}`}>
                  {change !== 0 ? `${change > 0 ? "+" : ""}${formatVND(change)}` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

### Step 10.2 — Rewrite ApartmentPriceTable.tsx

- [ ] Replace `src/components/ApartmentPriceTable.tsx`:

```tsx
import { type ApartmentPriceRow } from "@/components/ApartmentChart";

interface ApartmentPriceTableProps {
  prices: ApartmentPriceRow[];
  selectedArea: string;
}

function formatM(value: number): string {
  return (value / 1_000_000).toFixed(1);
}

export default function ApartmentPriceTable({ prices, selectedArea }: ApartmentPriceTableProps) {
  if (prices.length === 0) return null;

  const areas =
    selectedArea === "all"
      ? ["ocean_park_1", "ocean_park_2", "ocean_park_3"]
      : [selectedArea];

  const filtered = prices.filter((p) => areas.includes(p.area));
  const dates = [...new Set(filtered.map((p) => p.date))].sort().reverse();

  const getAvg = (dayPrices: ApartmentPriceRow[], bt: string): string => {
    const entries = dayPrices.filter((p) => p.bedroom_type === bt);
    if (entries.length === 0) return "—";
    const avg = Math.round(
      entries.reduce((s, p) => s + p.avg_price_per_m2, 0) / entries.length
    );
    return formatM(avg);
  };

  return (
    <div className="mb-6">
      <table className="w-full text-[13px]">
        <thead>
          <tr>
            {["Date", "1PN", "2PN", "3PN"].map((h) => (
              <th
                key={h}
                className={`pb-2.5 text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest border-b border-[var(--text)] ${
                  h === "Date" ? "text-left" : "text-right"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dates.map((date) => {
            const dayPrices = filtered.filter((p) => p.date === date);
            return (
              <tr
                key={date}
                className="border-b border-[var(--border)] hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <td className="py-3 text-[var(--text-secondary)]">{date.slice(5)}</td>
                <td className="py-3 text-right tabular-nums font-medium text-[var(--text)]">
                  {getAvg(dayPrices, "1pn")}
                </td>
                <td className="py-3 text-right tabular-nums font-medium text-[var(--text)]">
                  {getAvg(dayPrices, "2pn")}
                </td>
                <td className="py-3 text-right tabular-nums font-medium text-[var(--text)]">
                  {getAvg(dayPrices, "3pn")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

### Step 10.3 — Run all tests

```bash
npm test
```

Expected: all tests pass.

### Step 10.4 — Commit

```bash
git add src/components/PriceTable.tsx src/components/ApartmentPriceTable.tsx
git commit -m "feat: redesign tables — tabular-nums, right-align, hover rows"
```

---

## Task 11: ApartmentListings — clean accordion

**Files:**
- Rewrite: `src/components/ApartmentListings.tsx`
- Create: `__tests__/components/ApartmentListings.test.tsx`

### Step 11.1 — Write failing test

- [ ] Create `__tests__/components/ApartmentListings.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ApartmentListings from "@/components/ApartmentListings";
import { type ApartmentPriceRow } from "@/components/ApartmentChart";

const sampleListings = JSON.stringify([
  {
    url: "https://example.com/1",
    title: "Căn hộ 2PN Ocean Park 1",
    price: 2500000000,
    areaM2: 65,
    pricePerM2: 38461538,
    source: "nhatot",
  },
]);

const samplePrices: ApartmentPriceRow[] = [
  {
    date: "2026-04-22",
    area: "ocean_park_1",
    bedroom_type: "2pn",
    avg_price_per_m2: 38000000,
    min_price_per_m2: 35000000,
    max_price_per_m2: 42000000,
    listing_count: 1,
    sample_listings: sampleListings,
  },
];

describe("ApartmentListings", () => {
  it("renders accordion button with listing count", () => {
    render(<ApartmentListings prices={samplePrices} selectedArea="ocean_park_1" />);
    expect(screen.getByText(/1 listing/)).toBeInTheDocument();
  });

  it("listings are hidden by default", () => {
    render(<ApartmentListings prices={samplePrices} selectedArea="ocean_park_1" />);
    expect(screen.queryByText("Căn hộ 2PN Ocean Park 1")).not.toBeInTheDocument();
  });

  it("expands listings on button click", () => {
    render(<ApartmentListings prices={samplePrices} selectedArea="ocean_park_1" />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Căn hộ 2PN Ocean Park 1")).toBeInTheDocument();
  });

  it("collapses listings on second click", () => {
    render(<ApartmentListings prices={samplePrices} selectedArea="ocean_park_1" />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(screen.queryByText("Căn hộ 2PN Ocean Park 1")).not.toBeInTheDocument();
  });
});
```

### Step 11.2 — Run test to confirm it fails

```bash
npm test -- --reporter=verbose ApartmentListings
```

Expected: some tests FAIL (accordion behavior may differ from current implementation).

### Step 11.3 — Rewrite ApartmentListings.tsx

- [ ] Replace `src/components/ApartmentListings.tsx`:

```tsx
"use client";

import { useState } from "react";
import { type ApartmentPriceRow, type ListingSample } from "@/components/ApartmentChart";

interface ApartmentListingsProps {
  prices: ApartmentPriceRow[];
  selectedArea: string;
}

function parseListings(raw: string | ListingSample[] | undefined): ListingSample[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return raw;
}

function formatPrice(value: number): string {
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(2) + " tỷ";
  return (value / 1_000_000).toFixed(0) + " triệu";
}

function formatM(value: number): string {
  return (value / 1_000_000).toFixed(1) + "M";
}

const AREA_LABELS: Record<string, string> = {
  ocean_park_1: "OP1",
  ocean_park_2: "OP2",
  ocean_park_3: "OP3",
};

export default function ApartmentListings({ prices, selectedArea }: ApartmentListingsProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const areas =
    selectedArea === "all"
      ? ["ocean_park_1", "ocean_park_2", "ocean_park_3"]
      : [selectedArea];

  const latestDate = prices.reduce((max, p) => (p.date > max ? p.date : max), "");
  const latestPrices = prices.filter((p) => p.date === latestDate && areas.includes(p.area));

  if (latestPrices.length === 0) return null;

  const bedroomTypes = ["1pn", "2pn", "3pn"];

  const groups = areas.flatMap((area) =>
    bedroomTypes.map((bt) => {
      const row = latestPrices.find((p) => p.area === area && p.bedroom_type === bt);
      if (!row) return null;
      const listings = parseListings(row.sample_listings);
      if (listings.length === 0) return null;
      const key = `${area}-${bt}`;
      const label =
        selectedArea === "all"
          ? `${AREA_LABELS[area]} · ${bt.toUpperCase()}`
          : bt.toUpperCase();
      return { key, label, listings };
    })
  ).filter(Boolean) as { key: string; label: string; listings: ListingSample[] }[];

  if (groups.length === 0) return null;

  return (
    <div className="mb-6">
      <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest mb-3">
        Sample Listings · {latestDate}
      </p>

      <div className="border border-[var(--border)] rounded-[var(--radius)] divide-y divide-[var(--border)]">
        {groups.map(({ key, label, listings }) => {
          const isExpanded = expanded === key;
          return (
            <div key={key}>
              {/* Accordion header */}
              <button
                onClick={() => setExpanded(isExpanded ? null : key)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <span className="font-medium text-[var(--text)]">
                  {label}
                  <span className="ml-2 text-[var(--text-muted)] font-normal">
                    {listings.length} listing{listings.length !== 1 ? "s" : ""}
                  </span>
                </span>
                <span className="text-[var(--text-muted)] text-base leading-none">
                  {isExpanded ? "−" : "+"}
                </span>
              </button>

              {/* Expanded listings */}
              {isExpanded && (
                <div className="divide-y divide-[var(--border)]">
                  {listings.map((l, i) => (
                    <a
                      key={i}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col gap-1 px-4 py-3 hover:bg-[var(--bg-subtle)] transition-colors no-underline"
                    >
                      <span className="text-[13px] text-[#2563eb] truncate">
                        {l.title || "View listing"}
                      </span>
                      <div className="flex gap-4 text-[12px] text-[var(--text-muted)] tabular-nums">
                        <span>{formatPrice(l.price)}</span>
                        <span>{l.areaM2} m²</span>
                        <span>{formatM(l.pricePerM2)}/m²</span>
                        <span className="opacity-60">{l.source}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### Step 11.4 — Run test to confirm it passes

```bash
npm test -- --reporter=verbose ApartmentListings
```

Expected: all 4 tests PASS.

### Step 11.5 — Run all tests

```bash
npm test
```

Expected: all tests pass.

### Step 11.6 — Commit

```bash
git add src/components/ApartmentListings.tsx __tests__/components/ApartmentListings.test.tsx
git commit -m "feat: redesign ApartmentListings with clean accordion"
```

---

## Task 12: Final cleanup — remove legacy CSS classes

**Files:**
- Modify: `src/app/globals.css`

### Step 12.1 — Remove legacy classes from globals.css

At this point all components use Tailwind utilities. Remove the legacy block from `globals.css`.

- [ ] Delete the entire "Legacy classes" section (everything from `/* Legacy classes */` to the end of `.price-down {}`) in `src/app/globals.css`, leaving only:

```css
@import "tailwindcss";

:root {
  --bg: #ffffff;
  --bg-subtle: #f5f5f5;
  --sidebar-bg: #0a0a0a;
  --text: #0a0a0a;
  --text-secondary: #525252;
  --text-muted: #a3a3a3;
  --border: #e5e5e5;
  --green: #16a34a;
  --red: #dc2626;
  --radius: 6px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
}
```

### Step 12.2 — Verify app renders correctly

```bash
npm run dev
```

Check both Gold and Apartment views — no broken styles.

### Step 12.3 — Run all tests

```bash
npm test
```

Expected: all tests pass.

### Step 12.4 — Commit

```bash
git add src/app/globals.css
git commit -m "chore: remove legacy CSS classes — all components now use Tailwind"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Implemented in |
|---|---|
| Responsive: mobile + desktop | Task 5 (page.tsx), Task 4 (Sidebar/BottomNav) |
| Sidebar desktop (200px, dark) | Task 4 (Sidebar.tsx) |
| Bottom nav mobile | Task 4 (BottomNav.tsx) |
| Geist font | Task 1 (layout.tsx) |
| Light bg, new design tokens | Task 1 (globals.css) |
| Underline tab selectors | Task 2 (TimeRangeSelector, AreaSelector) |
| Bedroom filter → underline tabs | Task 7 (ApartmentView.tsx) |
| Skeleton loading | Task 3 (Skeleton.tsx), Tasks 7 |
| Hero price Header | Task 6 (Header.tsx) |
| Chart light colors | Task 8 |
| Stats cards Tailwind | Task 9 |
| Tables tabular-nums, right-align | Task 10 |
| Accordion listings | Task 11 |
| Remove legacy CSS | Task 12 |

**No placeholders found.** All steps contain actual code.

**Type consistency:** `ApartmentPriceRow` and `ListingSample` types are imported from `ApartmentChart.tsx` consistently across Tasks 9, 10, 11. `PriceRow` imported from `@/lib/indicators` in Tasks 6, 9, 10.
