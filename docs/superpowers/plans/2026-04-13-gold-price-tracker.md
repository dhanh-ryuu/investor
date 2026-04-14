# Gold Price Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first web app that scrapes daily 9999 gold prices from vangquytung.com and displays them as an interactive chart with moving averages and basic indicators.

**Architecture:** Next.js App Router with two API routes (price query + cron scraper), Turso SQLite for storage, Chart.js for visualization. Single repo deployed on Vercel free tier with daily cron.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Turso (`@libsql/client`), cheerio, Chart.js (via `react-chartjs-2`), Vercel (hosting + cron)

---

## File Structure

```
investor/
  src/
    app/
      page.tsx              # Main page — assembles all components, fetches data server-side
      layout.tsx            # Root layout, metadata, dark theme, PWA manifest link
      globals.css           # Dark theme CSS variables and base styles
      api/
        prices/
          route.ts          # GET /api/prices?range=3m — query price history from Turso
        cron/
          scrape/
            route.ts        # POST /api/cron/scrape — scrape + store daily prices
    lib/
      db.ts                 # Turso client singleton
      scraper.ts            # Fetch HTML from vangquytung.com, parse with cheerio
      indicators.ts         # MA7, MA30, change %, high/low calculations
    components/
      PriceChart.tsx        # Chart.js line chart (client component)
      StatsBar.tsx          # Period high/low, change %, spread
      PriceTable.tsx        # Scrollable daily price list
      TimeRangeSelector.tsx # 1M/3M/6M pill buttons
      Header.tsx            # Current price + daily change display
  public/
    manifest.json           # PWA manifest
  vercel.json               # Cron schedule config
  package.json
  tsconfig.json
  .env.local                # Local dev env vars (gitignored)
  __tests__/
    lib/
      scraper.test.ts       # Scraper unit tests with HTML fixtures
      indicators.test.ts    # Indicator calculation tests
    api/
      prices.test.ts        # Price API route tests
      scrape.test.ts        # Scrape API route tests
```

---

### Task 1: Project Scaffolding + Turso Setup

**Files:**
- Create: `package.json`, `tsconfig.json`, `vercel.json`, `.env.local`, `.gitignore`, `src/lib/db.ts`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd /Users/hanhnd/go/src/github.com/investor
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Select defaults when prompted. This creates the Next.js project with App Router and TypeScript.

- [ ] **Step 2: Install dependencies**

```bash
npm install @libsql/client cheerio chart.js react-chartjs-2
npm install -D @types/node vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Configure Vitest**

Create `vitest.config.ts` at the project root:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Add test script to `package.json` — open the file and add to the `"scripts"` section:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Create `.env.local`**

```
TURSO_URL=libsql://your-db-name-your-org.turso.io
TURSO_AUTH_TOKEN=your-token-here
CRON_SECRET=dev-secret-change-in-prod
```

Add `.env.local` to `.gitignore` (create-next-app usually includes it, verify).

- [ ] **Step 5: Create Turso client — `src/lib/db.ts`**

```typescript
import { createClient } from "@libsql/client";

export const db = createClient({
  url: process.env.TURSO_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export async function initDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS gold_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      buy_price INTEGER NOT NULL,
      sell_price INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}
```

- [ ] **Step 6: Create `vercel.json` for cron config**

```json
{
  "crons": [
    {
      "path": "/api/cron/scrape",
      "schedule": "0 2 * * *"
    }
  ]
}
```

This runs daily at 02:00 UTC = 09:00 Vietnam time (UTC+7).

- [ ] **Step 7: Verify project builds**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 8: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Next.js project with Turso client and cron config"
```

---

### Task 2: Gold Price Scraper

**Files:**
- Create: `src/lib/scraper.ts`, `__tests__/lib/scraper.test.ts`

- [ ] **Step 1: Create HTML fixture for tests**

Create `__tests__/lib/fixtures/gold-page.html`:

```html
<html>
<body>
<table>
  <thead>
    <tr><th>Sản Phẩm</th><th>Mua (đ)</th><th>Bán(đ)</th></tr>
  </thead>
  <tbody>
    <tr><td>Vàng Quý Tùng 9999</td><td>15.200.000</td><td>15.700.000</td></tr>
    <tr><td>Vàng Nữ Trang Quý Tùng 98</td><td>7.050.000</td><td>7.500.000</td></tr>
    <tr><td>Vàng 98% QTung</td><td>7.000.000</td><td>7.450.000</td></tr>
  </tbody>
</table>
</body>
</html>
```

- [ ] **Step 2: Write failing tests — `__tests__/lib/scraper.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { parseGoldPrice } from "@/lib/scraper";
import { readFileSync } from "fs";
import path from "path";

const fixtureHtml = readFileSync(
  path.join(__dirname, "fixtures/gold-page.html"),
  "utf-8"
);

describe("parseGoldPrice", () => {
  it("extracts 9999 gold buy and sell prices", () => {
    const result = parseGoldPrice(fixtureHtml);
    expect(result).toEqual({
      buyPrice: 15200000,
      sellPrice: 15700000,
    });
  });

  it("returns null when 9999 row is not found", () => {
    const html = "<html><body><table><tbody></tbody></table></body></html>";
    const result = parseGoldPrice(html);
    expect(result).toBeNull();
  });

  it("handles prices without dots", () => {
    const html = `<table><tbody><tr><td>Vàng Quý Tùng 9999</td><td>15200000</td><td>15700000</td></tr></tbody></table>`;
    const result = parseGoldPrice(html);
    expect(result).toEqual({ buyPrice: 15200000, sellPrice: 15700000 });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run __tests__/lib/scraper.test.ts
```

Expected: FAIL — `parseGoldPrice` is not defined.

- [ ] **Step 4: Implement scraper — `src/lib/scraper.ts`**

```typescript
import * as cheerio from "cheerio";

const TARGET_URL = "https://vangquytung.com/";
const TARGET_PRODUCT = "Vàng Quý Tùng 9999";

export interface GoldPrice {
  buyPrice: number;
  sellPrice: number;
}

export function parseGoldPrice(html: string): GoldPrice | null {
  const $ = cheerio.load(html);
  let result: GoldPrice | null = null;

  $("table tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 3) return;

    const product = $(cells[0]).text().trim();
    if (!product.includes("9999")) return;

    const buyText = $(cells[1]).text().trim();
    const sellText = $(cells[2]).text().trim();

    const buyPrice = parsePrice(buyText);
    const sellPrice = parsePrice(sellText);

    if (buyPrice > 0 && sellPrice > 0) {
      result = { buyPrice, sellPrice };
      return false; // break
    }
  });

  return result;
}

function parsePrice(text: string): number {
  const cleaned = text.replace(/[.\s,]/g, "");
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

export async function fetchGoldPrice(): Promise<GoldPrice | null> {
  const response = await fetch(TARGET_URL, {
    headers: {
      "User-Agent": "GoldPriceTracker/1.0",
    },
  });

  if (!response.ok) {
    console.error(`Failed to fetch ${TARGET_URL}: ${response.status}`);
    return null;
  }

  const html = await response.text();
  return parseGoldPrice(html);
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run __tests__/lib/scraper.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/scraper.ts __tests__/lib/scraper.test.ts __tests__/lib/fixtures/
git commit -m "feat: add gold price scraper with cheerio HTML parsing"
```

---

### Task 3: Scrape API Route (Cron Endpoint)

**Files:**
- Create: `src/app/api/cron/scrape/route.ts`, `__tests__/api/scrape.test.ts`

- [ ] **Step 1: Write failing test — `__tests__/api/scrape.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/scraper", () => ({
  fetchGoldPrice: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    execute: vi.fn(),
  },
  initDb: vi.fn(),
}));

import { fetchGoldPrice } from "@/lib/scraper";
import { db, initDb } from "@/lib/db";

// We test the handler logic directly
import { POST } from "@/app/api/cron/scrape/route";

describe("POST /api/cron/scrape", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-secret";
  });

  it("rejects requests without valid authorization", async () => {
    const req = new Request("http://localhost/api/cron/scrape", {
      method: "POST",
      headers: { Authorization: "wrong-secret" },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("scrapes and stores price on valid request", async () => {
    vi.mocked(fetchGoldPrice).mockResolvedValue({
      buyPrice: 15200000,
      sellPrice: 15700000,
    });
    vi.mocked(db.execute).mockResolvedValue({ rows: [], columns: [], rowsAffected: 1, lastInsertRowid: BigInt(1) } as any);
    vi.mocked(initDb).mockResolvedValue(undefined);

    const req = new Request("http://localhost/api/cron/scrape", {
      method: "POST",
      headers: { Authorization: "Bearer test-secret" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.buy_price).toBe(15200000);
    expect(body.sell_price).toBe(15700000);
    expect(db.execute).toHaveBeenCalled();
  });

  it("returns error when scraping fails", async () => {
    vi.mocked(fetchGoldPrice).mockResolvedValue(null);
    vi.mocked(initDb).mockResolvedValue(undefined);

    const req = new Request("http://localhost/api/cron/scrape", {
      method: "POST",
      headers: { Authorization: "Bearer test-secret" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/api/scrape.test.ts
```

Expected: FAIL — route module does not exist.

- [ ] **Step 3: Implement scrape route — `src/app/api/cron/scrape/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { fetchGoldPrice } from "@/lib/scraper";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await initDb();

  const price = await fetchGoldPrice();
  if (!price) {
    return NextResponse.json({
      success: false,
      error: "Failed to scrape gold price",
    });
  }

  const today = new Date().toISOString().split("T")[0];

  await db.execute({
    sql: `INSERT INTO gold_prices (date, buy_price, sell_price)
          VALUES (?, ?, ?)
          ON CONFLICT(date) DO UPDATE SET
            buy_price = excluded.buy_price,
            sell_price = excluded.sell_price,
            created_at = datetime('now')`,
    args: [today, price.buyPrice, price.sellPrice],
  });

  return NextResponse.json({
    success: true,
    date: today,
    buy_price: price.buyPrice,
    sell_price: price.sellPrice,
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run __tests__/api/scrape.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/cron/scrape/route.ts __tests__/api/scrape.test.ts
git commit -m "feat: add cron scrape API route with auth and upsert"
```

---

### Task 4: Prices API Route

**Files:**
- Create: `src/app/api/prices/route.ts`, `__tests__/api/prices.test.ts`

- [ ] **Step 1: Write failing test — `__tests__/api/prices.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    execute: vi.fn(),
  },
  initDb: vi.fn(),
}));

import { db, initDb } from "@/lib/db";
import { GET } from "@/app/api/prices/route";

describe("GET /api/prices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(initDb).mockResolvedValue(undefined);
  });

  it("returns prices for default 3m range", async () => {
    vi.mocked(db.execute).mockResolvedValue({
      rows: [
        { date: "2026-03-01", buy_price: 15000000, sell_price: 15500000 },
        { date: "2026-03-02", buy_price: 15100000, sell_price: 15600000 },
      ],
      columns: [],
      rowsAffected: 0,
      lastInsertRowid: undefined,
    } as any);

    const req = new Request("http://localhost/api/prices");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(2);
    expect(body[0].date).toBe("2026-03-01");
    expect(db.execute).toHaveBeenCalledWith(
      expect.objectContaining({ sql: expect.stringContaining("WHERE date >=") })
    );
  });

  it("accepts range query param", async () => {
    vi.mocked(db.execute).mockResolvedValue({
      rows: [],
      columns: [],
      rowsAffected: 0,
      lastInsertRowid: undefined,
    } as any);

    const req = new Request("http://localhost/api/prices?range=1m");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(db.execute).toHaveBeenCalled();
  });

  it("defaults to 3m for invalid range", async () => {
    vi.mocked(db.execute).mockResolvedValue({
      rows: [],
      columns: [],
      rowsAffected: 0,
      lastInsertRowid: undefined,
    } as any);

    const req = new Request("http://localhost/api/prices?range=invalid");
    const res = await GET(req);

    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/api/prices.test.ts
```

Expected: FAIL — route module does not exist.

- [ ] **Step 3: Implement prices route — `src/app/api/prices/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";

const RANGE_DAYS: Record<string, number> = {
  "1m": 30,
  "3m": 90,
  "6m": 180,
};

const MA_BUFFER_DAYS = 30;

export async function GET(request: Request) {
  await initDb();

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "3m";
  const days = RANGE_DAYS[range] || RANGE_DAYS["3m"];

  const totalDays = days + MA_BUFFER_DAYS;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - totalDays);
  const startDateStr = startDate.toISOString().split("T")[0];

  const result = await db.execute({
    sql: "SELECT date, buy_price, sell_price FROM gold_prices WHERE date >= ? ORDER BY date ASC",
    args: [startDateStr],
  });

  return NextResponse.json(result.rows);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run __tests__/api/prices.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/prices/route.ts __tests__/api/prices.test.ts
git commit -m "feat: add prices API route with range query and MA buffer"
```

---

### Task 5: Indicator Calculations

**Files:**
- Create: `src/lib/indicators.ts`, `__tests__/lib/indicators.test.ts`

- [ ] **Step 1: Write failing tests — `__tests__/lib/indicators.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import {
  calculateMA,
  calculateChange,
  findHighLow,
} from "@/lib/indicators";

const samplePrices = [
  { date: "2026-01-01", buy_price: 15000000, sell_price: 15500000 },
  { date: "2026-01-02", buy_price: 15100000, sell_price: 15600000 },
  { date: "2026-01-03", buy_price: 15200000, sell_price: 15700000 },
  { date: "2026-01-04", buy_price: 15050000, sell_price: 15550000 },
  { date: "2026-01-05", buy_price: 14900000, sell_price: 15400000 },
  { date: "2026-01-06", buy_price: 15300000, sell_price: 15800000 },
  { date: "2026-01-07", buy_price: 15250000, sell_price: 15750000 },
  { date: "2026-01-08", buy_price: 15400000, sell_price: 15900000 },
];

describe("calculateMA", () => {
  it("calculates 3-day moving average for buy_price", () => {
    const ma = calculateMA(samplePrices, 3, "buy_price");
    // First 2 entries are null (not enough data)
    expect(ma[0]).toBeNull();
    expect(ma[1]).toBeNull();
    // 3rd entry: avg of 15000000, 15100000, 15200000
    expect(ma[2]).toBe(15100000);
    // 4th entry: avg of 15100000, 15200000, 15050000
    expect(ma[3]).toBeCloseTo(15116667, -1);
  });

  it("returns all nulls when period exceeds data length", () => {
    const ma = calculateMA(samplePrices.slice(0, 2), 7, "buy_price");
    expect(ma.every((v) => v === null)).toBe(true);
  });
});

describe("calculateChange", () => {
  it("calculates absolute and percentage change", () => {
    const change = calculateChange(15000000, 15300000);
    expect(change.absolute).toBe(300000);
    expect(change.percentage).toBeCloseTo(2.0, 1);
  });

  it("handles negative change", () => {
    const change = calculateChange(15300000, 15000000);
    expect(change.absolute).toBe(-300000);
    expect(change.percentage).toBeCloseTo(-1.96, 1);
  });

  it("handles zero base", () => {
    const change = calculateChange(0, 15000000);
    expect(change.absolute).toBe(15000000);
    expect(change.percentage).toBe(0);
  });
});

describe("findHighLow", () => {
  it("finds highest and lowest buy prices with dates", () => {
    const { high, low } = findHighLow(samplePrices, "buy_price");
    expect(high.value).toBe(15400000);
    expect(high.date).toBe("2026-01-08");
    expect(low.value).toBe(14900000);
    expect(low.date).toBe("2026-01-05");
  });

  it("works with sell_price", () => {
    const { high, low } = findHighLow(samplePrices, "sell_price");
    expect(high.value).toBe(15900000);
    expect(low.value).toBe(15400000);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run __tests__/lib/indicators.test.ts
```

Expected: FAIL — functions not defined.

- [ ] **Step 3: Implement indicators — `src/lib/indicators.ts`**

```typescript
export interface PriceRow {
  date: string;
  buy_price: number;
  sell_price: number;
}

export interface Change {
  absolute: number;
  percentage: number;
}

export interface HighLowPoint {
  value: number;
  date: string;
}

export function calculateMA(
  prices: PriceRow[],
  period: number,
  field: "buy_price" | "sell_price"
): (number | null)[] {
  return prices.map((_, i) => {
    if (i < period - 1) return null;
    const slice = prices.slice(i - period + 1, i + 1);
    const sum = slice.reduce((acc, row) => acc + row[field], 0);
    return Math.round(sum / period);
  });
}

export function calculateChange(
  oldValue: number,
  newValue: number
): Change {
  const absolute = newValue - oldValue;
  const percentage = oldValue === 0 ? 0 : (absolute / oldValue) * 100;
  return { absolute, percentage };
}

export function findHighLow(
  prices: PriceRow[],
  field: "buy_price" | "sell_price"
): { high: HighLowPoint; low: HighLowPoint } {
  let high: HighLowPoint = { value: -Infinity, date: "" };
  let low: HighLowPoint = { value: Infinity, date: "" };

  for (const row of prices) {
    if (row[field] > high.value) {
      high = { value: row[field], date: row.date };
    }
    if (row[field] < low.value) {
      low = { value: row[field], date: row.date };
    }
  }

  return { high, low };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run __tests__/lib/indicators.test.ts
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/indicators.ts __tests__/lib/indicators.test.ts
git commit -m "feat: add indicator calculations — MA, change %, high/low"
```

---

### Task 6: Dark Theme + Global Styles

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Create: `public/manifest.json`

- [ ] **Step 1: Replace `src/app/globals.css` with dark theme**

Replace the entire contents of `src/app/globals.css` with:

```css
:root {
  --bg-primary: #0f0f0f;
  --bg-secondary: #1a1a1a;
  --bg-card: #242424;
  --text-primary: #e5e5e5;
  --text-secondary: #a3a3a3;
  --text-muted: #737373;
  --accent-blue: #60a5fa;
  --accent-orange: #fb923c;
  --color-green: #4ade80;
  --color-red: #f87171;
  --border: #333333;
  --radius: 12px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  max-width: 480px;
  margin: 0 auto;
  padding: 16px;
  min-height: 100vh;
}

.pill-group {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin: 16px 0;
}

.pill {
  padding: 8px 20px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.pill.active {
  background: var(--accent-blue);
  color: #000;
  border-color: var(--accent-blue);
}

.card {
  background: var(--bg-card);
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 12px;
}

.price-up {
  color: var(--color-red);
}

.price-down {
  color: var(--color-green);
}

.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-item {
  background: var(--bg-card);
  border-radius: var(--radius);
  padding: 12px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  margin-top: 4px;
}

.price-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.price-table th {
  text-align: left;
  padding: 8px 6px;
  color: var(--text-muted);
  font-weight: 500;
  font-size: 11px;
  text-transform: uppercase;
  border-bottom: 1px solid var(--border);
}

.price-table td {
  padding: 10px 6px;
  border-bottom: 1px solid var(--border);
  color: var(--text-secondary);
}

.table-scroll {
  max-height: 300px;
  overflow-y: auto;
  border-radius: var(--radius);
  background: var(--bg-card);
  padding: 0 8px;
}
```

- [ ] **Step 2: Update `src/app/layout.tsx`**

Replace the entire contents of `src/app/layout.tsx` with:

```tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gold Price Tracker",
  description: "Track daily 9999 gold prices from Vàng Quý Tùng",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f0f0f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Create PWA manifest — `public/manifest.json`**

```json
{
  "name": "Gold Price Tracker",
  "short_name": "Gold Tracker",
  "description": "Track daily 9999 gold prices",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f0f0f",
  "theme_color": "#0f0f0f",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

Note: PWA icons (`icon-192.png`, `icon-512.png`) can be generated later. The manifest works without them.

- [ ] **Step 4: Verify the dev server starts and shows the dark background**

```bash
npm run dev
```

Open `http://localhost:3000` — should show a dark background page. Stop the dev server after verifying.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx public/manifest.json
git commit -m "feat: add dark theme, PWA manifest, and mobile-first layout"
```

---

### Task 7: Header Component

**Files:**
- Create: `src/components/Header.tsx`

- [ ] **Step 1: Create `src/components/Header.tsx`**

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
      <div className="card" style={{ textAlign: "center", padding: "24px" }}>
        <h1 style={{ fontSize: "20px", marginBottom: "8px" }}>Gold Price Tracker</h1>
        <p style={{ color: "var(--text-muted)" }}>No price data available yet</p>
      </div>
    );
  }

  const latest = prices[prices.length - 1];
  const previous = prices.length > 1 ? prices[prices.length - 2] : null;

  const buyChange = previous
    ? calculateChange(previous.buy_price, latest.buy_price)
    : null;

  return (
    <div className="card">
      <h1 style={{ fontSize: "18px", color: "var(--text-muted)", marginBottom: "12px" }}>
        Gold Price Tracker
      </h1>
      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
        Vàng 9999 — {latest.date}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>MUA</div>
          <div style={{ fontSize: "24px", fontWeight: 700 }}>
            {formatVND(latest.buy_price)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>BÁN</div>
          <div style={{ fontSize: "24px", fontWeight: 700 }}>
            {formatVND(latest.sell_price)}
          </div>
        </div>
      </div>
      {buyChange && (
        <div
          style={{ marginTop: "8px", fontSize: "14px", fontWeight: 500 }}
          className={buyChange.absolute > 0 ? "price-up" : buyChange.absolute < 0 ? "price-down" : ""}
        >
          {buyChange.absolute > 0 ? "+" : ""}
          {formatVND(buyChange.absolute)} ({buyChange.percentage > 0 ? "+" : ""}
          {buyChange.percentage.toFixed(2)}%)
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Header.tsx
git commit -m "feat: add Header component with current price and daily change"
```

---

### Task 8: TimeRangeSelector Component

**Files:**
- Create: `src/components/TimeRangeSelector.tsx`

- [ ] **Step 1: Create `src/components/TimeRangeSelector.tsx`**

```tsx
"use client";

interface TimeRangeSelectorProps {
  selected: string;
  onChange: (range: string) => void;
}

const RANGES = ["1m", "3m", "6m"];

export default function TimeRangeSelector({
  selected,
  onChange,
}: TimeRangeSelectorProps) {
  return (
    <div className="pill-group">
      {RANGES.map((range) => (
        <button
          key={range}
          className={`pill ${selected === range ? "active" : ""}`}
          onClick={() => onChange(range)}
        >
          {range.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TimeRangeSelector.tsx
git commit -m "feat: add TimeRangeSelector pill button component"
```

---

### Task 9: PriceChart Component

**Files:**
- Create: `src/components/PriceChart.tsx`

- [ ] **Step 1: Create `src/components/PriceChart.tsx`**

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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

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

  // Only show data from visibleStartIndex onward on the chart,
  // but MA is computed on the full dataset for accuracy
  const visiblePrices = prices.slice(visibleStartIndex);
  const visibleMA7 = ma7Buy.slice(visibleStartIndex);
  const visibleMA30 = ma30Buy.slice(visibleStartIndex);
  const labels = visiblePrices.map((p) => p.date.slice(5)); // "MM-DD"

  // Find high/low for markers
  const { high, low } = findHighLow(visiblePrices, "buy_price");

  const buyPointRadius = visiblePrices.map((p) =>
    p.date === high.date || p.date === low.date ? 6 : 0
  );
  const buyPointBgColor = visiblePrices.map((p) =>
    p.date === high.date
      ? "#f87171"
      : p.date === low.date
        ? "#4ade80"
        : "transparent"
  );

  const data = {
    labels,
    datasets: [
      {
        label: "Mua (Buy)",
        data: visiblePrices.map((p) => p.buy_price),
        borderColor: "#60a5fa",
        backgroundColor: "rgba(96, 165, 250, 0.1)",
        borderWidth: 2,
        pointRadius: buyPointRadius,
        pointBackgroundColor: buyPointBgColor,
        pointBorderColor: buyPointBgColor,
        tension: 0.3,
        fill: false,
      },
      {
        label: "Bán (Sell)",
        data: visiblePrices.map((p) => p.sell_price),
        borderColor: "#fb923c",
        backgroundColor: "rgba(251, 146, 60, 0.1)",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
        fill: false,
      },
      {
        label: "MA7",
        data: visibleMA7,
        borderColor: "rgba(96, 165, 250, 0.5)",
        borderWidth: 1,
        pointRadius: 0,
        tension: 0.3,
        borderDash: [],
        fill: false,
      },
      {
        label: "MA30",
        data: visibleMA30,
        borderColor: "rgba(251, 146, 60, 0.5)",
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
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          color: "#a3a3a3",
          font: { size: 11 },
          boxWidth: 12,
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: "#242424",
        titleColor: "#e5e5e5",
        bodyColor: "#a3a3a3",
        borderColor: "#333",
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
        ticks: { color: "#737373", font: { size: 10 }, maxRotation: 45 },
        grid: { color: "rgba(51, 51, 51, 0.5)" },
      },
      y: {
        ticks: {
          color: "#737373",
          font: { size: 10 },
          callback: (value) => formatMillions(value as number),
        },
        grid: { color: "rgba(51, 51, 51, 0.5)" },
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

- [ ] **Step 2: Commit**

```bash
git add src/components/PriceChart.tsx
git commit -m "feat: add PriceChart with buy/sell lines, MA7/MA30, and high/low markers"
```

---

### Task 10: StatsBar Component

**Files:**
- Create: `src/components/StatsBar.tsx`

- [ ] **Step 1: Create `src/components/StatsBar.tsx`**

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

  return (
    <div className="stat-grid" style={{ marginBottom: "12px" }}>
      <div className="stat-item">
        <div className="stat-label">Period High</div>
        <div className="stat-value" style={{ color: "var(--color-red)" }}>
          {formatVND(high.value)}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{high.date}</div>
      </div>
      <div className="stat-item">
        <div className="stat-label">Period Low</div>
        <div className="stat-value" style={{ color: "var(--color-green)" }}>
          {formatVND(low.value)}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{low.date}</div>
      </div>
      <div className="stat-item">
        <div className="stat-label">Period Change</div>
        <div
          className={`stat-value ${periodChange.absolute > 0 ? "price-up" : periodChange.absolute < 0 ? "price-down" : ""}`}
        >
          {periodChange.percentage > 0 ? "+" : ""}
          {periodChange.percentage.toFixed(2)}%
        </div>
      </div>
      <div className="stat-item">
        <div className="stat-label">Spread</div>
        <div className="stat-value">{formatVND(spread)}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/StatsBar.tsx
git commit -m "feat: add StatsBar with high/low, period change, and spread"
```

---

### Task 11: PriceTable Component

**Files:**
- Create: `src/components/PriceTable.tsx`

- [ ] **Step 1: Create `src/components/PriceTable.tsx`**

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

  // Show most recent first
  const reversed = [...prices].reverse();

  return (
    <div className="table-scroll">
      <table className="price-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Buy</th>
            <th>Sell</th>
            <th>Change</th>
          </tr>
        </thead>
        <tbody>
          {reversed.map((row, i) => {
            const prevRow = reversed[i + 1]; // previous day (older)
            const change = prevRow ? row.buy_price - prevRow.buy_price : 0;
            const changeClass =
              change > 0 ? "price-up" : change < 0 ? "price-down" : "";

            return (
              <tr key={row.date}>
                <td>{row.date.slice(5)}</td>
                <td>{formatVND(row.buy_price)}</td>
                <td>{formatVND(row.sell_price)}</td>
                <td className={changeClass}>
                  {change !== 0 && (
                    <>
                      {change > 0 ? "+" : ""}
                      {formatVND(change)}
                    </>
                  )}
                  {change === 0 && "—"}
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

- [ ] **Step 2: Commit**

```bash
git add src/components/PriceTable.tsx
git commit -m "feat: add PriceTable with daily change column"
```

---

### Task 12: Main Page — Assemble Everything

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create the main page — `src/app/page.tsx`**

Replace the entire contents of `src/app/page.tsx` with:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import TimeRangeSelector from "@/components/TimeRangeSelector";
import PriceChart from "@/components/PriceChart";
import StatsBar from "@/components/StatsBar";
import PriceTable from "@/components/PriceTable";
import { PriceRow } from "@/lib/indicators";

const RANGE_DAYS: Record<string, number> = {
  "1m": 30,
  "3m": 90,
  "6m": 180,
};

const MA_BUFFER_DAYS = 30;

export default function Home() {
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

  // allPrices includes MA_BUFFER_DAYS extra data before the visible range.
  // Calculate the index where the visible range starts.
  const totalExpected = RANGE_DAYS[range] + MA_BUFFER_DAYS;
  const visibleStartIndex =
    allPrices.length > RANGE_DAYS[range]
      ? allPrices.length - RANGE_DAYS[range]
      : 0;

  const visiblePrices = allPrices.slice(visibleStartIndex);

  const handleRangeChange = (newRange: string) => {
    setRange(newRange);
  };

  return (
    <main>
      <Header prices={visiblePrices} />
      <TimeRangeSelector selected={range} onChange={handleRangeChange} />
      {loading ? (
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "var(--text-muted)" }}>Loading...</p>
        </div>
      ) : (
        <>
          <PriceChart prices={allPrices} visibleStartIndex={visibleStartIndex} />
          <StatsBar prices={visiblePrices} />
          <PriceTable prices={visiblePrices} />
        </>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Run dev server and verify the page loads**

```bash
npm run dev
```

Open `http://localhost:3000` on your phone or use Chrome DevTools mobile view. Verify:
- Dark background
- Header shows "No price data available yet" (no data in DB yet)
- Time range pills are visible and clickable
- No console errors

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: assemble main page with all components"
```

---

### Task 13: Seed Data + End-to-End Verification

**Files:**
- Create: `scripts/seed.ts`

- [ ] **Step 1: Create seed script — `scripts/seed.ts`**

This script inserts fake historical data so you can verify the chart looks correct locally.

```typescript
import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const db = createClient({
  url: process.env.TURSO_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function seed() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS gold_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      buy_price INTEGER NOT NULL,
      sell_price INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const basePrice = 15000000;
  const spread = 500000;
  const today = new Date();

  for (let i = 180; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // Simulate price fluctuation with a slow upward trend + noise
    const trend = (180 - i) * 5000;
    const noise = Math.round((Math.random() - 0.5) * 400000);
    const buyPrice = basePrice + trend + noise;
    const sellPrice = buyPrice + spread;

    await db.execute({
      sql: `INSERT OR IGNORE INTO gold_prices (date, buy_price, sell_price) VALUES (?, ?, ?)`,
      args: [dateStr, buyPrice, sellPrice],
    });
  }

  console.log("Seeded 181 days of price data.");
}

seed().catch(console.error);
```

- [ ] **Step 2: Install dotenv and run the seed script**

```bash
npm install -D dotenv tsx
```

Before running, make sure `.env.local` has valid Turso credentials. Then:

```bash
npx tsx scripts/seed.ts
```

Expected: `Seeded 181 days of price data.`

- [ ] **Step 3: Start dev server and verify the full UI**

```bash
npm run dev
```

Open `http://localhost:3000`. Verify:
- Header shows latest price with daily change
- Chart displays buy (blue) and sell (orange) lines
- MA7 and MA30 overlay lines are visible
- High/low dots appear on the chart
- Stats bar shows period high, low, change %, spread
- Price table lists daily prices with change column
- Switching between 1M / 3M / 6M updates the chart
- Mobile layout looks good (use Chrome DevTools mobile view)

- [ ] **Step 4: Commit**

```bash
git add scripts/seed.ts
git commit -m "feat: add seed script for local development testing"
```

---

### Task 14: Run Full Test Suite + Build Verification

**Files:** No new files.

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: All tests pass (scraper, indicators, prices API, scrape API).

- [ ] **Step 2: Fix any failing tests**

If any tests fail, fix them. Common issues:
- Import paths may need adjusting
- Mock shapes may not match actual implementation

- [ ] **Step 3: Verify production build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit any test fixes**

```bash
git add -A
git commit -m "fix: resolve test/build issues"
```

(Skip this step if no fixes were needed.)

---

### Task 15: Deployment Prep

**Files:** No new files.

- [ ] **Step 1: Verify `vercel.json` is correct**

Read `vercel.json` and confirm it contains:

```json
{
  "crons": [
    {
      "path": "/api/cron/scrape",
      "schedule": "0 2 * * *"
    }
  ]
}
```

- [ ] **Step 2: Verify `.gitignore` includes sensitive files**

Ensure `.gitignore` includes:
- `.env.local`
- `.superpowers/`
- `node_modules/`

- [ ] **Step 3: Document environment variables needed for deployment**

The following environment variables must be set in the Vercel dashboard:
- `TURSO_URL` — Turso database URL (e.g., `libsql://gold-tracker-yourorg.turso.io`)
- `TURSO_AUTH_TOKEN` — Turso auth token
- `CRON_SECRET` — any random string for cron auth (Vercel sends this automatically for its cron jobs)

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: deployment prep — verify config and gitignore"
```
