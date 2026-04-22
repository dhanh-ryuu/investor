# Dark Pro Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyển toàn bộ UI sang dark theme ("Dark Pro") với accent violet `#a78bfa`, đổi màu chart và fix hardcode colors trong 7 files.

**Architecture:** Thay đổi CSS tokens trong `globals.css` làm nền tảng — vì tất cả component đã dùng `var(--xxx)`, phần lớn thay đổi visual tự áp dụng. Một số component có hardcode Tailwind cứng hoặc Chart.js color object cần sửa thêm từng file.

**Tech Stack:** Next.js App Router, Tailwind v4, Chart.js, react-chartjs-2, Vitest, @testing-library/react.

---

### Task 1: Color tokens — `globals.css`

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace the `:root` block**

Open `src/app/globals.css`. Replace the entire `:root` block (lines 3–14):

```css
@import "tailwindcss";

:root {
  --bg: #0d0d0d;
  --bg-subtle: #141414;
  --sidebar-bg: #0d0d0d;
  --text: #e5e5e5;
  --text-secondary: #888888;
  --text-muted: #444444;
  --border: #1f1f1f;
  --green: #4ade80;
  --red: #f87171;
  --accent: #a78bfa;
  --radius: 8px;
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

- [ ] **Step 2: Run tests to confirm nothing broke**

```bash
cd /Users/hanhnd/go/src/github.com/investor
npm test
```

Expected: all tests pass (CSS changes don't affect unit tests).

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: dark pro color tokens — bg #0d0d0d, accent violet #a78bfa"
```

---

### Task 2: Sidebar — remove hardcode bg, add accent dot

**Files:**
- Modify: `src/components/Sidebar.tsx`
- Test: `__tests__/components/Sidebar.test.tsx` (existing — should still pass without changes)

- [ ] **Step 1: Run existing Sidebar test to confirm baseline**

```bash
npm test -- __tests__/components/Sidebar.test.tsx
```

Expected: 4 tests pass.

- [ ] **Step 2: Replace Sidebar.tsx with updated version**

Full file content:

```tsx
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
```

- [ ] **Step 3: Run Sidebar tests**

```bash
npm test -- __tests__/components/Sidebar.test.tsx
```

Expected: 4 tests pass. The active item still has `text-white`, inactive does not.

- [ ] **Step 4: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat: sidebar dark tokens + violet accent dot on active item"
```

---

### Task 3: Header badge — fix rgba classes + flip VN convention

**Files:**
- Modify: `src/components/Header.tsx`
- Modify: `__tests__/components/Header.test.tsx` (update test to match new convention)

Context: VN convention is tăng = đỏ, giảm = xanh (opposite of Western). StatsBar already uses this. Header badge currently has it backwards (`isUp → green`). This task fixes it and aligns the test.

- [ ] **Step 1: Update the test first (TDD)**

Replace `__tests__/components/Header.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Header from "@/components/Header";

const samplePrices = [
  { date: "2026-04-21", buy_price: 15300000, sell_price: 15800000 },
  { date: "2026-04-22", buy_price: 15500000, sell_price: 16000000 },
];

const fallingPrices = [
  { date: "2026-04-21", buy_price: 15500000, sell_price: 16000000 },
  { date: "2026-04-22", buy_price: 15300000, sell_price: 15800000 },
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

  it("shows red badge when price increased (VN convention: tăng = đỏ)", () => {
    render(<Header prices={samplePrices} />);
    const badge = screen.getByText(/\+200\.000/);
    expect(badge).toBeInTheDocument();
    expect(badge.className).toMatch(/text-\[var\(--red\)\]/);
  });

  it("shows green badge when price decreased (VN convention: giảm = xanh)", () => {
    render(<Header prices={fallingPrices} />);
    const badge = screen.getByText(/-200\.000/);
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

- [ ] **Step 2: Run test to confirm it fails (badge is still green for up)**

```bash
npm test -- __tests__/components/Header.test.tsx
```

Expected: "shows red badge when price increased" FAILS (current code uses green for up).

- [ ] **Step 3: Update Header.tsx badge className**

In `src/components/Header.tsx`, find the `<span>` with the badge className (lines 38–45) and replace:

```tsx
        {buyChange && (
          <span
            className={[
              "inline-block text-sm font-medium px-2.5 py-0.5 rounded mb-4",
              isUp
                ? "bg-[rgba(248,113,113,0.1)] text-[var(--red)]"
                : isDown
                ? "bg-[rgba(74,222,128,0.1)] text-[var(--green)]"
                : "bg-[var(--bg-subtle)] text-[var(--text-muted)]",
            ].join(" ")}
          >
            {buyChange.absolute > 0 ? "+" : ""}
            {formatVND(buyChange.absolute)} ({buyChange.percentage > 0 ? "+" : ""}
            {buyChange.percentage.toFixed(2)}%)
          </span>
        )}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- __tests__/components/Header.test.tsx
```

Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/Header.tsx __tests__/components/Header.test.tsx
git commit -m "fix: header badge VN convention (tăng=đỏ, giảm=xanh) + rgba dark bg"
```

---

### Task 4: PriceTable — fix thead border

**Files:**
- Modify: `src/components/PriceTable.tsx`
- Create: `__tests__/components/PriceTable.test.tsx`

Context: thead currently uses `border-[var(--text)]` which on dark theme becomes `#e5e5e5` — too bright. Change to `border-b-2 border-[var(--text-secondary)]` (`#888`).

- [ ] **Step 1: Write failing test**

Create `__tests__/components/PriceTable.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import PriceTable from "@/components/PriceTable";

const prices = [
  { date: "2026-04-20", buy_price: 15400000, sell_price: 15600000 },
  { date: "2026-04-21", buy_price: 15300000, sell_price: 15500000 },
  { date: "2026-04-22", buy_price: 15500000, sell_price: 15700000 },
];

describe("PriceTable", () => {
  it("renders null when no prices", () => {
    const { container } = render(<PriceTable prices={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders header columns", () => {
    render(<PriceTable prices={prices} />);
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Buy")).toBeInTheDocument();
    expect(screen.getByText("Sell")).toBeInTheDocument();
    expect(screen.getByText("Change")).toBeInTheDocument();
  });

  it("thead uses text-secondary border not text border", () => {
    render(<PriceTable prices={prices} />);
    const dateHeader = screen.getByText("Date");
    expect(dateHeader.className).toMatch(/border-\[var\(--text-secondary\)\]/);
    expect(dateHeader.className).not.toMatch(/border-\[var\(--text\)\]/);
  });

  it("shows rows in reverse chronological order", () => {
    render(<PriceTable prices={prices} />);
    const cells = screen.getAllByText(/\/04/);
    expect(cells[0].textContent).toBe("22/04");
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- __tests__/components/PriceTable.test.tsx
```

Expected: "thead uses text-secondary border" FAILS.

- [ ] **Step 3: Update PriceTable.tsx thead className**

In `src/components/PriceTable.tsx`, find the `<th>` element className and update `border-b border-[var(--text)]` → `border-b-2 border-[var(--text-secondary)]`:

```tsx
              <th
                key={h}
                className={`pb-2.5 text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest border-b-2 border-[var(--text-secondary)] ${
                  h === "Date" ? "text-left" : "text-right"
                }`}
              >
```

- [ ] **Step 4: Run tests**

```bash
npm test -- __tests__/components/PriceTable.test.tsx
```

Expected: all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/PriceTable.tsx __tests__/components/PriceTable.test.tsx
git commit -m "fix: price table thead border uses --text-secondary for dark theme"
```

---

### Task 5: BottomNav — remove hardcode bg and border

**Files:**
- Modify: `src/components/BottomNav.tsx`
- Test: `__tests__/components/BottomNav.test.tsx` (existing — passes without changes)

- [ ] **Step 1: Run existing BottomNav tests to confirm baseline**

```bash
npm test -- __tests__/components/BottomNav.test.tsx
```

Expected: 2 tests pass.

- [ ] **Step 2: Replace BottomNav.tsx**

Full file content:

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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-[var(--sidebar-bg)] border-t border-[var(--border)] flex h-14">
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

- [ ] **Step 3: Run tests**

```bash
npm test -- __tests__/components/BottomNav.test.tsx
```

Expected: 2 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/BottomNav.tsx
git commit -m "feat: bottom nav uses CSS tokens instead of hardcoded dark colors"
```

---

### Task 6: PriceChart — dark Chart.js colors + violet buy line

**Files:**
- Modify: `src/components/PriceChart.tsx`
- Create: `__tests__/components/PriceChart.test.tsx`

- [ ] **Step 1: Write failing test**

Create `__tests__/components/PriceChart.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Line } from "react-chartjs-2";

vi.mock("chart.js", () => ({
  Chart: { register: vi.fn() },
  CategoryScale: class {},
  LinearScale: class {},
  PointElement: class {},
  LineElement: class {},
  Tooltip: class {},
  Legend: class {},
  Filler: class {},
}));

vi.mock("react-chartjs-2", () => ({
  Line: vi.fn(() => <div data-testid="chart" />),
}));

import PriceChart from "@/components/PriceChart";

const prices = Array.from({ length: 10 }, (_, i) => ({
  date: `2026-04-${String(i + 1).padStart(2, "0")}`,
  buy_price: 15000000 + i * 100000,
  sell_price: 15200000 + i * 100000,
}));

describe("PriceChart", () => {
  beforeEach(() => {
    vi.mocked(Line).mockClear();
  });

  it("renders nothing when no prices", () => {
    const { container } = render(<PriceChart prices={[]} visibleStartIndex={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("buy line uses violet border color #a78bfa", () => {
    render(<PriceChart prices={prices} visibleStartIndex={0} />);
    const [props] = vi.mocked(Line).mock.calls[0];
    expect(props.data.datasets[0].borderColor).toBe("#a78bfa");
  });

  it("buy area fill uses semi-transparent violet", () => {
    render(<PriceChart prices={prices} visibleStartIndex={0} />);
    const [props] = vi.mocked(Line).mock.calls[0];
    expect(props.data.datasets[0].backgroundColor).toBe("rgba(167, 139, 250, 0.08)");
  });

  it("tooltip background is dark #141414", () => {
    render(<PriceChart prices={prices} visibleStartIndex={0} />);
    const [props] = vi.mocked(Line).mock.calls[0];
    expect((props.options as { plugins: { tooltip: { backgroundColor: string } } }).plugins.tooltip.backgroundColor).toBe("#141414");
  });

  it("x-axis grid uses white-on-dark rgba", () => {
    render(<PriceChart prices={prices} visibleStartIndex={0} />);
    const [props] = vi.mocked(Line).mock.calls[0];
    expect((props.options as { scales: { x: { grid: { color: string } } } }).scales.x.grid.color).toBe("rgba(255, 255, 255, 0.04)");
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- __tests__/components/PriceChart.test.tsx
```

Expected: "buy line uses violet" and "tooltip background is dark" fail.

- [ ] **Step 3: Replace the datasets and options in PriceChart.tsx**

Full file `src/components/PriceChart.tsx`:

```tsx
"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { PriceRow, calculateMA, findHighLow } from "@/lib/indicators";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

interface PriceChartProps {
  prices: PriceRow[];
  visibleStartIndex: number;
}

function formatMillions(value: number): string {
  return (value / 1_000_000).toFixed(1) + "M";
}

export default function PriceChart({ prices, visibleStartIndex }: PriceChartProps) {
  if (prices.length === 0) return null;

  const ma7Buy = calculateMA(prices, 7, "buy_price");
  const ma30Buy = calculateMA(prices, 30, "buy_price");

  const visiblePrices = prices.slice(visibleStartIndex);
  const visibleMA7 = ma7Buy.slice(visibleStartIndex);
  const visibleMA30 = ma30Buy.slice(visibleStartIndex);
  const labels = visiblePrices.map((p) => p.date.slice(5));

  const { high, low } = findHighLow(visiblePrices, "buy_price");
  const buyPointRadius = visiblePrices.map((p) => (p.date === high.date || p.date === low.date ? 6 : 0));
  const buyPointBgColor = visiblePrices.map((p) =>
    p.date === high.date ? "#f87171" : p.date === low.date ? "#4ade80" : "transparent"
  );

  const data = {
    labels,
    datasets: [
      {
        label: "Mua (Buy)",
        data: visiblePrices.map((p) => p.buy_price),
        borderColor: "#a78bfa",
        backgroundColor: "rgba(167, 139, 250, 0.08)",
        borderWidth: 2,
        pointRadius: buyPointRadius,
        pointBackgroundColor: buyPointBgColor,
        pointBorderColor: buyPointBgColor,
        tension: 0.3,
        fill: true,
      },
      {
        label: "Bán (Sell)",
        data: visiblePrices.map((p) => p.sell_price),
        borderColor: "#3f3f46",
        backgroundColor: "transparent",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
        fill: false,
      },
      {
        label: "MA7",
        data: visibleMA7,
        borderColor: "rgba(167, 139, 250, 0.3)",
        borderWidth: 1,
        pointRadius: 0,
        tension: 0.3,
        borderDash: [4, 4],
        fill: false,
      },
      {
        label: "MA30",
        data: visibleMA30,
        borderColor: "rgba(167, 139, 250, 0.15)",
        borderWidth: 1,
        pointRadius: 0,
        tension: 0.3,
        borderDash: [6, 4],
        fill: false,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: { color: "#444444", font: { size: 11 }, boxWidth: 12, padding: 12 },
      },
      tooltip: {
        backgroundColor: "#141414",
        titleColor: "#e5e5e5",
        bodyColor: "#888888",
        borderColor: "#2a2a2a",
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
        ticks: { color: "#444444", font: { size: 10 }, maxRotation: 45 },
        grid: { color: "rgba(255, 255, 255, 0.04)" },
      },
      y: {
        ticks: {
          color: "#444444",
          font: { size: 10 },
          callback: (value) => formatMillions(value as number),
        },
        grid: { color: "rgba(255, 255, 255, 0.04)" },
      },
    },
  };

  return (
    <div style={{ height: "300px", marginBottom: "12px" }}>
      <Line data={data} options={options} />
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- __tests__/components/PriceChart.test.tsx
```

Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/PriceChart.tsx __tests__/components/PriceChart.test.tsx
git commit -m "feat: price chart dark colors — violet buy line, dark tooltip + grid"
```

---

### Task 7: ApartmentChart — dark colors + violet line palette

**Files:**
- Modify: `src/components/ApartmentChart.tsx`
- Create: `__tests__/components/ApartmentChart.test.tsx`

- [ ] **Step 1: Write failing test**

Create `__tests__/components/ApartmentChart.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Line } from "react-chartjs-2";

vi.mock("chart.js", () => ({
  Chart: { register: vi.fn() },
  CategoryScale: class {},
  LinearScale: class {},
  PointElement: class {},
  LineElement: class {},
  Tooltip: class {},
  Legend: class {},
}));

vi.mock("react-chartjs-2", () => ({
  Line: vi.fn(() => <div data-testid="apartment-chart" />),
}));

import ApartmentChart from "@/components/ApartmentChart";
import type { ApartmentPriceRow } from "@/components/ApartmentChart";

const makeRow = (date: string, area: string, bedroom_type: string): ApartmentPriceRow => ({
  date,
  area,
  bedroom_type,
  avg_price_per_m2: 50000000,
  min_price_per_m2: 45000000,
  max_price_per_m2: 55000000,
  listing_count: 10,
});

const prices: ApartmentPriceRow[] = [
  makeRow("2026-04-01", "ocean_park_1", "1pn"),
  makeRow("2026-04-01", "ocean_park_1", "2pn"),
  makeRow("2026-04-01", "ocean_park_1", "3pn"),
  makeRow("2026-04-02", "ocean_park_1", "1pn"),
  makeRow("2026-04-02", "ocean_park_1", "2pn"),
  makeRow("2026-04-02", "ocean_park_1", "3pn"),
];

describe("ApartmentChart", () => {
  beforeEach(() => {
    vi.mocked(Line).mockClear();
  });

  it("renders nothing when no prices", () => {
    const { container } = render(
      <ApartmentChart prices={[]} selectedArea="ocean_park_1" selectedBedroom="1pn" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("1pn line uses primary violet #a78bfa", () => {
    render(
      <ApartmentChart prices={prices} selectedArea="ocean_park_1" selectedBedroom="1pn" />
    );
    const [props] = vi.mocked(Line).mock.calls[0];
    const onePnDataset = props.data.datasets.find((d: { label: string }) => d.label === "1PN");
    expect(onePnDataset?.borderColor).toBe("#a78bfa");
  });

  it("tooltip background is dark #141414", () => {
    render(
      <ApartmentChart prices={prices} selectedArea="ocean_park_1" selectedBedroom="1pn" />
    );
    const [props] = vi.mocked(Line).mock.calls[0];
    expect(
      (props.options as { plugins: { tooltip: { backgroundColor: string } } }).plugins.tooltip
        .backgroundColor
    ).toBe("#141414");
  });

  it("grid uses white-on-dark rgba", () => {
    render(
      <ApartmentChart prices={prices} selectedArea="ocean_park_1" selectedBedroom="1pn" />
    );
    const [props] = vi.mocked(Line).mock.calls[0];
    expect(
      (props.options as { scales: { x: { grid: { color: string } } } }).scales.x.grid.color
    ).toBe("rgba(255, 255, 255, 0.04)");
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- __tests__/components/ApartmentChart.test.tsx
```

Expected: "1pn line uses primary violet" and "tooltip background is dark" fail.

- [ ] **Step 3: Replace ApartmentChart.tsx**

Full file `src/components/ApartmentChart.tsx`:

```tsx
"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export interface ListingSample {
  url: string;
  title: string;
  price: number;
  areaM2: number;
  pricePerM2: number;
  source: "nhatot" | "batdongsan";
}

export interface ApartmentPriceRow {
  date: string;
  area: string;
  bedroom_type: string;
  avg_price_per_m2: number;
  min_price_per_m2: number;
  max_price_per_m2: number;
  listing_count: number;
  sample_listings?: string | ListingSample[];
}

interface ApartmentChartProps {
  prices: ApartmentPriceRow[];
  selectedArea: string;
  selectedBedroom: string;
}

const BEDROOM_COLORS: Record<string, string> = {
  "1pn": "#a78bfa",
  "2pn": "#c4b5fd",
  "3pn": "#7c3aed",
};

const AREA_COLORS: Record<string, string> = {
  ocean_park_1: "#a78bfa",
  ocean_park_2: "#c4b5fd",
  ocean_park_3: "#7c3aed",
};

const AREA_LABELS: Record<string, string> = {
  ocean_park_1: "OP1",
  ocean_park_2: "OP2",
  ocean_park_3: "OP3",
};

function formatMillions(value: number): string {
  return (value / 1_000_000).toFixed(1) + "M";
}

export default function ApartmentChart({ prices, selectedArea, selectedBedroom }: ApartmentChartProps) {
  if (prices.length === 0) return null;

  const dates = [...new Set(prices.map((p) => p.date))].sort();
  const labels = dates.map((d) => d.slice(5));

  let datasets;

  if (selectedArea !== "all") {
    const bedroomTypes = ["1pn", "2pn", "3pn"];
    datasets = bedroomTypes.map((bt) => {
      const filtered = prices.filter((p) => p.area === selectedArea && p.bedroom_type === bt);
      const dataMap = new Map(filtered.map((p) => [p.date, p.avg_price_per_m2]));
      return {
        label: bt.toUpperCase(),
        data: dates.map((d) => dataMap.get(d) ?? null),
        borderColor: BEDROOM_COLORS[bt],
        borderWidth: 2,
        pointRadius: 2,
        tension: 0.3,
        fill: false,
      };
    });
  } else {
    const areas = ["ocean_park_1", "ocean_park_2", "ocean_park_3"];
    datasets = areas.map((area) => {
      const filtered = prices.filter((p) => p.area === area && p.bedroom_type === selectedBedroom);
      const dataMap = new Map(filtered.map((p) => [p.date, p.avg_price_per_m2]));
      return {
        label: AREA_LABELS[area],
        data: dates.map((d) => dataMap.get(d) ?? null),
        borderColor: AREA_COLORS[area],
        borderWidth: 2,
        pointRadius: 2,
        tension: 0.3,
        fill: false,
      };
    });
  }

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: { color: "#444444", font: { size: 11 }, boxWidth: 12, padding: 12 },
      },
      tooltip: {
        backgroundColor: "#141414",
        titleColor: "#e5e5e5",
        bodyColor: "#888888",
        borderColor: "#2a2a2a",
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
        ticks: { color: "#444444", font: { size: 10 }, maxRotation: 45 },
        grid: { color: "rgba(255, 255, 255, 0.04)" },
      },
      y: {
        ticks: {
          color: "#444444",
          font: { size: 10 },
          callback: (value) => formatMillions(value as number),
        },
        grid: { color: "rgba(255, 255, 255, 0.04)" },
      },
    },
  };

  return (
    <div style={{ height: "300px", marginBottom: "12px" }}>
      <Line data={{ labels, datasets }} options={options} />
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- __tests__/components/ApartmentChart.test.tsx
```

Expected: all 4 tests pass.

- [ ] **Step 5: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/ApartmentChart.tsx __tests__/components/ApartmentChart.test.tsx
git commit -m "feat: apartment chart dark colors — violet lines, dark tooltip + grid"
```
