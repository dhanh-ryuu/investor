# Gold Comparison Chart Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a multi-line comparison chart to the Gold page showing SJC Vietnam, Asia session gold price, and World (NY close) gold price — all in VND/lượng — for the last 30 days.

**Architecture:** A new cached API route fetches XAU/USD OHLC and USD/VND rate from stooq.com, converts to VND/lượng, and returns a 30-day array. A new `GoldComparisonChart` component renders 3 lines using Chart.js. GoldView fetches both data sources in parallel and renders the chart below the existing PriceChart.

**Tech Stack:** Next.js App Router, Chart.js + react-chartjs-2, stooq.com (free, no API key), Turso/libSQL (unchanged), Tailwind v4, Vitest + @testing-library/react.

---

## Data Sources

### stooq.com CSV endpoints
- XAU/USD: `https://stooq.com/q/d/l/?s=xauusd&i=d` — daily OHLC for gold in USD/oz
- USD/VND: `https://stooq.com/q/d/l/?s=usdvnd&i=d` — daily OHLC for USD/VND exchange rate

Both return CSV format:
```
Date,Open,High,Low,Close,Volume
2026-04-24,3320.10,3340.50,3310.20,3330.00,0
...
```

Rows are ordered newest-first. Fetch 35 rows (5 buffer for weekends/holidays) to guarantee 30 trading days.

### Conversion formula
```
OZ_PER_LUONG = 37.5 / 31.1035   // ≈ 1.20563
asia_vnd  = open_xauusd  × OZ_PER_LUONG × usdvnd_close
world_vnd = close_xauusd × OZ_PER_LUONG × usdvnd_close
```

- `open_xauusd` = opening price of the day = Asian session price
- `close_xauusd` = closing price of the day = NY/London session price
- `usdvnd_close` = USD/VND closing rate for that date

Join XAU/USD rows and USD/VND rows by date. Only include dates present in both datasets. Return the 30 most recent matched dates, sorted ascending.

---

## Types

```ts
// src/lib/world-gold-fetcher.ts
export interface WorldGoldRow {
  date: string;      // "2026-04-24"
  asia_vnd: number;  // VND per lượng — Asian session (open price)
  world_vnd: number; // VND per lượng — NY/global close
}
```

---

## API Route

**File:** `src/app/api/world-gold/route.ts`

```ts
export const revalidate = 3600; // cache 1 hour

export async function GET() {
  const rows = await fetchWorldGold(30);
  return NextResponse.json(rows);
}
```

- On fetch error or parse failure: returns `NextResponse.json([])` with status 200
- No authentication required (public read)

---

## Fetcher Module

**File:** `src/lib/world-gold-fetcher.ts`

Exports:
- `parseStooqCsv(csv: string): Map<string, { open: number; close: number }>` — parses CSV, skips header, returns map keyed by date string
- `convertToVnd(openUsd: number, closeUsd: number, usdVnd: number): { asia_vnd: number; world_vnd: number }` — applies conversion formula
- `fetchWorldGold(days: number): Promise<WorldGoldRow[]>` — orchestrates both fetches, joins by date, returns sorted ascending array

Error handling in `fetchWorldGold`:
- If either fetch fails (network error, non-200 status): return `[]`
- If CSV has no parseable rows: return `[]`
- If a date has no matching USD/VND rate: skip that date

---

## Component

**File:** `src/components/GoldComparisonChart.tsx`

Props:
```ts
interface GoldComparisonChartProps {
  sjcPrices: PriceRow[];    // existing type from @/lib/indicators
  worldGold: WorldGoldRow[]; // from @/lib/world-gold-fetcher
}
```

Behaviour:
- Returns `null` if `worldGold.length === 0`
- Joins SJC and world gold by date (inner join — only dates present in both)
- Renders a Chart.js `Line` with 3 datasets

Dataset colors:
| Series | Label | `borderColor` |
|---|---|---|
| SJC Mua | `"SJC Mua"` | `"#a78bfa"` |
| Giá vàng châu Á | `"Châu Á (Asian session)"` | `"#60a5fa"` |
| Giá vàng thế giới | `"Thế giới (NY close)"` | `"#fb923c"` |

Chart.js options (matching existing PriceChart style):
- `responsive: true`, `maintainAspectRatio: false`
- `interaction: { mode: "index", intersect: false }`
- Tooltip: `backgroundColor: "#141414"`, `titleColor: "#e5e5e5"`, `bodyColor: "#888888"`, `borderColor: "#2a2a2a"`, `borderWidth: 1`
- Tooltip label callback: formats value as VND with `toLocaleString("vi-VN") + " đ"`
- Y-axis ticks: `formatMillions()` (e.g. `"85.5M"`)
- Grid color: `"rgba(255, 255, 255, 0.04)"`
- Legend: `position: "bottom"`, `color: "#444444"`, `font.size: 11`
- Height: `300px` via inline style wrapper div, `marginBottom: "12px"`
- All 3 lines: `pointRadius: 0`, `tension: 0.3`, `fill: false`, `borderWidth: 2`

---

## GoldView Changes

**File:** `src/components/GoldView.tsx`

Add parallel fetch for world gold data alongside existing SJC fetch. Add state:
```ts
const [worldGold, setWorldGold] = useState<WorldGoldRow[]>([]);
```

Add a separate `useEffect(() => { fetchWorldGold() }, [])` that runs once on mount. Do NOT fetch inside `fetchPrices` — world gold is fixed at 30 days and must not re-fetch when the user changes the 1m/3m/6m range selector. Errors are caught and leave `worldGold` as `[]`.

Render order (after loading):
```
<Header prices={visiblePrices} />
<TimeRangeSelector selected={range} onChange={setRange} />
<PriceChart prices={allPrices} visibleStartIndex={visibleStartIndex} />
<StatsBar prices={visiblePrices} />
<p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-4">
  So sánh với giá vàng quốc tế · 30 ngày
</p>
<GoldComparisonChart sjcPrices={allPrices} worldGold={worldGold} />
<PriceTable prices={visiblePrices} />
```

The world gold chart always shows 30 days regardless of the 1m/3m/6m selector (the selector only affects SJC detail sections above and below).

Loading skeleton: add `<Skeleton className="h-[300px] w-full mb-4" />` after the existing chart skeleton.

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| stooq.com unreachable | `fetchWorldGold` returns `[]`, API returns `[]`, chart renders `null` |
| CSV format changed | Parser returns empty map, `fetchWorldGold` returns `[]` |
| Date mismatch (holiday) | That date skipped in join |
| Client network error | `worldGold` stays `[]`, chart renders `null` — SJC sections unaffected |

---

## Tests

### `__tests__/lib/world-gold-fetcher.test.ts`

Tests for `parseStooqCsv`:
- Parses header + 2 data rows correctly
- Returns correct `open` and `close` values
- Skips rows with non-numeric values
- Empty CSV returns empty map

Tests for `convertToVnd`:
- `convertToVnd(3000, 3100, 25000)` → `asia_vnd = 3000 × 1.20563 × 25000`, `world_vnd = 3100 × 1.20563 × 25000`
- Values are `Math.round()`ed integers

### `__tests__/components/GoldComparisonChart.test.tsx`

Setup: mock `chart.js` and `react-chartjs-2` (same pattern as `ApartmentChart.test.tsx`).

Tests:
- Renders `null` when `worldGold` is empty
- SJC line uses `borderColor: "#a78bfa"`
- Asia line uses `borderColor: "#60a5fa"`
- World line uses `borderColor: "#fb923c"`
- Tooltip `backgroundColor` is `"#141414"`
- Grid `color` is `"rgba(255, 255, 255, 0.04)"`
