# Gold Comparison Chart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a multi-line chart to the Gold page comparing SJC Vietnam, Asia session gold price (XAU/USD open), and World gold price (XAU/USD NY close) — all in VND/lượng — for the last 30 days.

**Architecture:** A new fetcher module parses stooq.com CSV and converts to VND/lượng. A cached Next.js API route wraps it. A new `GoldComparisonChart` component renders 3 Chart.js lines. `GoldView` fetches world gold once on mount (independent of the range selector) and renders the chart below `StatsBar`.

**Tech Stack:** Next.js App Router, Chart.js + react-chartjs-2, stooq.com (free CSV, no API key), Vitest + @testing-library/react, Tailwind v4.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/world-gold-fetcher.ts` | Create | Fetch stooq CSV, parse, convert XAU/USD → VND/lượng |
| `src/app/api/world-gold/route.ts` | Create | Cached API route (1h), thin wrapper over fetcher |
| `src/components/GoldComparisonChart.tsx` | Create | 3-line Chart.js component (SJC + Asia + World) |
| `src/components/GoldView.tsx` | Modify | Add world gold state, mount fetch, render comparison chart |
| `__tests__/lib/world-gold-fetcher.test.ts` | Create | Unit tests for CSV parser and conversion math |
| `__tests__/components/GoldComparisonChart.test.tsx` | Create | Component tests (colors, tooltip, null render) |

**Note on test runner:** This project uses Vitest 4.x which requires Node 20.12+. If running locally on Node 18.x, tests will fail with a `styleText` error — this is a pre-existing environment issue. Tests pass on Vercel CI (Node 20+). The `npm test` command is `vitest run`.

---

## Task 1: Fetcher module — parser and converter

**Files:**
- Create: `src/lib/world-gold-fetcher.ts`
- Create: `__tests__/lib/world-gold-fetcher.test.ts`

### Conversion background
- 1 troy oz = 31.1035g
- 1 lượng (Vietnamese tael) = 37.5g
- `OZ_PER_LUONG = 37.5 / 31.1035 ≈ 1.20563`
- `asia_vnd = open_xauusd × OZ_PER_LUONG × usdvnd_close`
- `world_vnd = close_xauusd × OZ_PER_LUONG × usdvnd_close`

### stooq.com CSV format
```
Date,Open,High,Low,Close,Volume
2026-04-24,3320.10,3340.50,3310.20,3330.00,0
2026-04-23,3300.00,3325.00,3295.00,3315.50,0
```
Rows are newest-first. Column indices: 0=Date, 1=Open, 4=Close.

---

- [ ] **Step 1: Write the failing tests**

Create `__tests__/lib/world-gold-fetcher.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseStooqCsv, convertToVnd } from "@/lib/world-gold-fetcher";

const OZ_PER_LUONG = 37.5 / 31.1035;

describe("parseStooqCsv", () => {
  it("parses header + 2 data rows correctly", () => {
    const csv = `Date,Open,High,Low,Close,Volume
2026-04-24,3320.10,3340.50,3310.20,3330.00,0
2026-04-23,3300.00,3325.00,3295.00,3315.50,0`;
    const result = parseStooqCsv(csv);
    expect(result.size).toBe(2);
    expect(result.get("2026-04-24")).toEqual({ open: 3320.1, close: 3330.0 });
    expect(result.get("2026-04-23")).toEqual({ open: 3300.0, close: 3315.5 });
  });

  it("skips rows with non-numeric values", () => {
    const csv = `Date,Open,High,Low,Close,Volume
2026-04-24,N/A,N/A,N/A,N/A,0
2026-04-23,3300.00,3325.00,3295.00,3315.50,0`;
    const result = parseStooqCsv(csv);
    expect(result.size).toBe(1);
    expect(result.has("2026-04-24")).toBe(false);
  });

  it("returns empty map for header-only CSV", () => {
    expect(parseStooqCsv("Date,Open,High,Low,Close,Volume").size).toBe(0);
  });

  it("returns empty map for empty string", () => {
    expect(parseStooqCsv("").size).toBe(0);
  });
});

describe("convertToVnd", () => {
  it("converts open and close USD/oz to VND/lượng", () => {
    const result = convertToVnd(3000, 3100, 25000);
    expect(result.asia_vnd).toBe(Math.round(3000 * OZ_PER_LUONG * 25000));
    expect(result.world_vnd).toBe(Math.round(3100 * OZ_PER_LUONG * 25000));
  });

  it("returns integer values (Math.round)", () => {
    const result = convertToVnd(3333.33, 3444.44, 25123);
    expect(Number.isInteger(result.asia_vnd)).toBe(true);
    expect(Number.isInteger(result.world_vnd)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --reporter=verbose 2>&1 | grep -E "(FAIL|PASS|world-gold)"
```

Expected: FAIL — `Cannot find module '@/lib/world-gold-fetcher'`

- [ ] **Step 3: Implement the fetcher module**

Create `src/lib/world-gold-fetcher.ts`:

```ts
export interface WorldGoldRow {
  date: string;      // "2026-04-24"
  asia_vnd: number;  // VND per lượng — Asian session (daily open price)
  world_vnd: number; // VND per lượng — NY/global close
}

const OZ_PER_LUONG = 37.5 / 31.1035;

const XAU_URL = "https://stooq.com/q/d/l/?s=xauusd&i=d";
const VND_URL = "https://stooq.com/q/d/l/?s=usdvnd&i=d";

export function parseStooqCsv(csv: string): Map<string, { open: number; close: number }> {
  const result = new Map<string, { open: number; close: number }>();
  const lines = csv.trim().split("\n");
  // lines[0] is the header — skip it
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length < 5) continue;
    const date = parts[0].trim();
    const open = parseFloat(parts[1]);
    const close = parseFloat(parts[4]);
    if (isNaN(open) || isNaN(close)) continue;
    result.set(date, { open, close });
  }
  return result;
}

export function convertToVnd(
  openUsd: number,
  closeUsd: number,
  usdVnd: number
): { asia_vnd: number; world_vnd: number } {
  return {
    asia_vnd: Math.round(openUsd * OZ_PER_LUONG * usdVnd),
    world_vnd: Math.round(closeUsd * OZ_PER_LUONG * usdVnd),
  };
}

export async function fetchWorldGold(days: number): Promise<WorldGoldRow[]> {
  try {
    const [xauRes, vndRes] = await Promise.all([
      fetch(XAU_URL),
      fetch(VND_URL),
    ]);
    if (!xauRes.ok || !vndRes.ok) return [];

    const [xauCsv, vndCsv] = await Promise.all([
      xauRes.text(),
      vndRes.text(),
    ]);

    const xauMap = parseStooqCsv(xauCsv);
    const vndMap = parseStooqCsv(vndCsv);

    const rows: WorldGoldRow[] = [];
    for (const [date, xau] of xauMap) {
      const vnd = vndMap.get(date);
      if (!vnd) continue; // skip dates with no VND rate (holiday mismatch)
      const { asia_vnd, world_vnd } = convertToVnd(xau.open, xau.close, vnd.close);
      rows.push({ date, asia_vnd, world_vnd });
    }

    // stooq returns newest-first; sort ascending then take last `days`
    rows.sort((a, b) => a.date.localeCompare(b.date));
    return rows.slice(-days);
  } catch {
    return [];
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --reporter=verbose 2>&1 | grep -E "(FAIL|PASS|world-gold)"
```

Expected: PASS — all 6 tests in `world-gold-fetcher.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/lib/world-gold-fetcher.ts __tests__/lib/world-gold-fetcher.test.ts
git commit -m "feat: add world gold fetcher — stooq CSV parser + VND/lượng converter"
```

---

## Task 2: API route `/api/world-gold`

**Files:**
- Create: `src/app/api/world-gold/route.ts`

No separate test needed — this is a thin wrapper over the already-tested `fetchWorldGold`.

---

- [ ] **Step 1: Create the route**

Create `src/app/api/world-gold/route.ts`:

```ts
import { NextResponse } from "next/server";
import { fetchWorldGold } from "@/lib/world-gold-fetcher";

export const revalidate = 3600; // cache for 1 hour

export async function GET() {
  const rows = await fetchWorldGold(30);
  return NextResponse.json(rows);
}
```

- [ ] **Step 2: Smoke-test the route locally**

```bash
npm run dev &
sleep 3
curl -s "http://localhost:3000/api/world-gold" | head -c 200
```

Expected: JSON array of objects with `date`, `asia_vnd`, `world_vnd` fields. If stooq is unreachable in the dev environment, `[]` is also acceptable.

Kill the dev server after checking: `kill %1`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/world-gold/route.ts
git commit -m "feat: add /api/world-gold cached route"
```

---

## Task 3: GoldComparisonChart component

**Files:**
- Create: `src/components/GoldComparisonChart.tsx`
- Create: `__tests__/components/GoldComparisonChart.test.tsx`

### Design reference
- 3 datasets, all `pointRadius: 0`, `tension: 0.3`, `fill: false`, `borderWidth: 2`
- Colors: SJC=`#a78bfa`, Asia=`#60a5fa`, World=`#fb923c`
- Tooltip bg: `#141414`, grid: `rgba(255, 255, 255, 0.04)`
- Y-axis: `formatMillions` (e.g. `85.5M`)
- Returns `null` when `worldGold` is empty

---

- [ ] **Step 1: Write the failing tests**

Create `__tests__/components/GoldComparisonChart.test.tsx`:

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
  Line: vi.fn(() => <div data-testid="comparison-chart" />),
}));

import GoldComparisonChart from "@/components/GoldComparisonChart";
import type { PriceRow } from "@/lib/indicators";
import type { WorldGoldRow } from "@/lib/world-gold-fetcher";

const sjcPrices: PriceRow[] = [
  { date: "2026-04-01", buy_price: 85_000_000, sell_price: 86_000_000 },
  { date: "2026-04-02", buy_price: 85_500_000, sell_price: 86_500_000 },
];

const worldGold: WorldGoldRow[] = [
  { date: "2026-04-01", asia_vnd: 84_000_000, world_vnd: 84_500_000 },
  { date: "2026-04-02", asia_vnd: 84_200_000, world_vnd: 84_700_000 },
];

describe("GoldComparisonChart", () => {
  beforeEach(() => {
    vi.mocked(Line).mockClear();
  });

  it("renders null when worldGold is empty", () => {
    const { container } = render(
      <GoldComparisonChart sjcPrices={sjcPrices} worldGold={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("SJC line uses borderColor #a78bfa", () => {
    render(<GoldComparisonChart sjcPrices={sjcPrices} worldGold={worldGold} />);
    const [props] = vi.mocked(Line).mock.calls[0];
    const sjc = props.data.datasets.find((d: { label?: string }) => d.label === "SJC Mua");
    expect(sjc?.borderColor).toBe("#a78bfa");
  });

  it("Asia line uses borderColor #60a5fa", () => {
    render(<GoldComparisonChart sjcPrices={sjcPrices} worldGold={worldGold} />);
    const [props] = vi.mocked(Line).mock.calls[0];
    const asia = props.data.datasets.find(
      (d: { label?: string }) => d.label === "Châu Á (Asian session)"
    );
    expect(asia?.borderColor).toBe("#60a5fa");
  });

  it("World line uses borderColor #fb923c", () => {
    render(<GoldComparisonChart sjcPrices={sjcPrices} worldGold={worldGold} />);
    const [props] = vi.mocked(Line).mock.calls[0];
    const world = props.data.datasets.find(
      (d: { label?: string }) => d.label === "Thế giới (NY close)"
    );
    expect(world?.borderColor).toBe("#fb923c");
  });

  it("tooltip background is #141414", () => {
    render(<GoldComparisonChart sjcPrices={sjcPrices} worldGold={worldGold} />);
    const [props] = vi.mocked(Line).mock.calls[0];
    expect(
      (props.options as { plugins: { tooltip: { backgroundColor: string } } })
        .plugins.tooltip.backgroundColor
    ).toBe("#141414");
  });

  it("grid uses rgba(255, 255, 255, 0.04)", () => {
    render(<GoldComparisonChart sjcPrices={sjcPrices} worldGold={worldGold} />);
    const [props] = vi.mocked(Line).mock.calls[0];
    expect(
      (props.options as { scales: { x: { grid: { color: string } } } }).scales.x.grid.color
    ).toBe("rgba(255, 255, 255, 0.04)");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --reporter=verbose 2>&1 | grep -E "(FAIL|PASS|GoldComparison)"
```

Expected: FAIL — `Cannot find module '@/components/GoldComparisonChart'`

- [ ] **Step 3: Implement GoldComparisonChart**

Create `src/components/GoldComparisonChart.tsx`:

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
import { PriceRow } from "@/lib/indicators";
import { WorldGoldRow } from "@/lib/world-gold-fetcher";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

interface GoldComparisonChartProps {
  sjcPrices: PriceRow[];
  worldGold: WorldGoldRow[];
}

function formatMillions(value: number): string {
  return (value / 1_000_000).toFixed(1) + "M";
}

export default function GoldComparisonChart({
  sjcPrices,
  worldGold,
}: GoldComparisonChartProps) {
  if (worldGold.length === 0) return null;

  // Inner join by date
  const sjcByDate = new Map(sjcPrices.map((r) => [r.date, r]));
  const worldByDate = new Map(worldGold.map((r) => [r.date, r]));

  const dates = worldGold
    .map((r) => r.date)
    .filter((d) => sjcByDate.has(d));

  if (dates.length === 0) return null;

  const labels = dates.map((d) => d.slice(5));
  const sjcData = dates.map((d) => sjcByDate.get(d)!.buy_price);
  const asiaData = dates.map((d) => worldByDate.get(d)!.asia_vnd);
  const worldData = dates.map((d) => worldByDate.get(d)!.world_vnd);

  const data = {
    labels,
    datasets: [
      {
        label: "SJC Mua",
        data: sjcData,
        borderColor: "#a78bfa",
        backgroundColor: "transparent",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
        fill: false,
      },
      {
        label: "Châu Á (Asian session)",
        data: asiaData,
        borderColor: "#60a5fa",
        backgroundColor: "transparent",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
        fill: false,
      },
      {
        label: "Thế giới (NY close)",
        data: worldData,
        borderColor: "#fb923c",
        backgroundColor: "transparent",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
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

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --reporter=verbose 2>&1 | grep -E "(FAIL|PASS|GoldComparison)"
```

Expected: PASS — all 6 tests in `GoldComparisonChart.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add src/components/GoldComparisonChart.tsx __tests__/components/GoldComparisonChart.test.tsx
git commit -m "feat: add GoldComparisonChart — SJC vs Asia vs World 3-line chart"
```

---

## Task 4: Wire up GoldView

**Files:**
- Modify: `src/components/GoldView.tsx`

---

- [ ] **Step 1: Read the current GoldView**

Current file is at `src/components/GoldView.tsx`. It currently has:
- State: `range`, `allPrices`, `loading`
- One `useCallback` for `fetchPrices(selectedRange)`
- One `useEffect` tied to `[range, fetchPrices]`
- Loading skeleton JSX
- Return JSX with: `Header`, `TimeRangeSelector`, `PriceChart`, `StatsBar`, `PriceTable`

- [ ] **Step 2: Rewrite GoldView with world gold integration**

Replace the entire file `src/components/GoldView.tsx` with:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import TimeRangeSelector from "@/components/TimeRangeSelector";
import PriceChart from "@/components/PriceChart";
import StatsBar from "@/components/StatsBar";
import PriceTable from "@/components/PriceTable";
import GoldComparisonChart from "@/components/GoldComparisonChart";
import Skeleton from "@/components/Skeleton";
import { PriceRow } from "@/lib/indicators";
import { WorldGoldRow } from "@/lib/world-gold-fetcher";

const RANGE_DAYS: Record<string, number> = {
  "1m": 30,
  "3m": 90,
  "6m": 180,
};

export default function GoldView() {
  const [range, setRange] = useState("3m");
  const [allPrices, setAllPrices] = useState<PriceRow[]>([]);
  const [worldGold, setWorldGold] = useState<WorldGoldRow[]>([]);
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

  // World gold fetched once on mount — not tied to range selector
  useEffect(() => {
    fetch("/api/world-gold")
      .then((res) => res.json())
      .then((data: WorldGoldRow[]) => setWorldGold(data))
      .catch(() => setWorldGold([]));
  }, []);

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
        <Skeleton className="h-[300px] w-full mb-4" />
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-[300px] w-full mb-4" />
      </div>
    );
  }

  return (
    <>
      <Header prices={visiblePrices} />
      <TimeRangeSelector selected={range} onChange={setRange} />
      <PriceChart prices={allPrices} visibleStartIndex={visibleStartIndex} />
      <StatsBar prices={visiblePrices} />
      <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-4">
        So sánh với giá vàng quốc tế · 30 ngày
      </p>
      <GoldComparisonChart sjcPrices={allPrices} worldGold={worldGold} />
      <PriceTable prices={visiblePrices} />
    </>
  );
}
```

- [ ] **Step 3: Run all tests**

```bash
npm test -- --reporter=verbose 2>&1 | tail -20
```

Expected: all previously passing tests still pass. No new failures introduced.

- [ ] **Step 4: Commit**

```bash
git add src/components/GoldView.tsx
git commit -m "feat: wire GoldComparisonChart into GoldView"
```

---

## Task 5: Push and deploy

- [ ] **Step 1: Push to origin**

```bash
git push origin main
```

- [ ] **Step 2: Verify Vercel deployment**

Vercel auto-deploys on push to `main`. Check the deployment dashboard or wait ~1 minute then visit the production URL to verify the comparison chart appears below StatsBar on the Gold page.

If the chart section shows only the section label but no chart (i.e. `GoldComparisonChart` returns `null`), this means stooq.com returned no data. Check:
1. Is `https://stooq.com/q/d/l/?s=xauusd&i=d` reachable from Vercel?
2. Does `/api/world-gold` return data in the production environment?
