# Apartment Price Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add apartment price tracking for Vinhomes Ocean Park 1/2/3 to the existing gold price tracker app, with daily crawling from nhatot.com (Chotot API) and batdongsan.com.vn (via ScrapingBee), displaying avg price/m² by bedroom type.

**Architecture:** Extends the existing Next.js + Turso app. Two new scrapers (Chotot public JSON API + ScrapingBee for batdongsan HTML), one new cron job, one new API route, top-level navigation to switch between Gold and Apartment views.

**Tech Stack:** Existing stack (Next.js, Turso, Chart.js) + ScrapingBee API for batdongsan.com.vn, Chotot gateway API for nhatot.com

---

## File Structure

```
src/
  lib/
    db.ts                              # Modified — add initDb for apartment_prices table
    apartment-scraper-nhatot.ts        # Chotot gateway API client
    apartment-scraper-batdongsan.ts    # ScrapingBee + cheerio HTML parser
    apartment-scraper.ts               # Orchestrator: call both sources, merge, aggregate
    apartment-indicators.ts            # Outlier removal, avg/min/max calculation
  app/
    page.tsx                           # Modified — add top nav, Gold/Apartment views
    api/
      apartment-prices/
        route.ts                       # GET /api/apartment-prices
      cron/
        scrape-apartments/
          route.ts                     # POST /api/cron/scrape-apartments
  components/
    NavBar.tsx                         # GOLD | APARTMENT top navigation
    GoldView.tsx                       # Extract current gold content from page.tsx
    ApartmentView.tsx                  # Container for apartment section
    AreaSelector.tsx                   # All/OP1/OP2/OP3 pills
    ApartmentChart.tsx                 # Line chart for apartment prices
    ApartmentStatsBar.tsx              # Stats: current price, change %, listing count
    ApartmentPriceTable.tsx            # Daily price history table
__tests__/
  lib/
    apartment-scraper-nhatot.test.ts
    apartment-scraper-batdongsan.test.ts
    apartment-indicators.test.ts
  api/
    apartment-prices.test.ts
    scrape-apartments.test.ts
vercel.json                            # Modified — add second cron
```

---

### Task 1: DB Schema + Apartment Indicators

**Files:**
- Modify: `src/lib/db.ts`
- Create: `src/lib/apartment-indicators.ts`, `__tests__/lib/apartment-indicators.test.ts`

- [ ] **Step 1: Update `src/lib/db.ts` — add apartment_prices table**

Add to the `initDb` function after the existing `gold_prices` CREATE TABLE:

```typescript
await db.execute(`
  CREATE TABLE IF NOT EXISTS apartment_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    area TEXT NOT NULL,
    bedroom_type TEXT NOT NULL,
    avg_price_per_m2 INTEGER NOT NULL,
    min_price_per_m2 INTEGER NOT NULL,
    max_price_per_m2 INTEGER NOT NULL,
    listing_count INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(date, area, bedroom_type)
  )
`);
```

- [ ] **Step 2: Write failing tests — `__tests__/lib/apartment-indicators.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import {
  removeOutliers,
  aggregateListings,
  type RawListing,
} from "@/lib/apartment-indicators";

describe("removeOutliers", () => {
  it("removes prices more than 2x the median", () => {
    const prices = [50, 52, 48, 51, 49, 200]; // 200 is outlier
    const result = removeOutliers(prices);
    expect(result).not.toContain(200);
    expect(result).toHaveLength(5);
  });

  it("removes prices less than 0.5x the median", () => {
    const prices = [50, 52, 48, 51, 49, 5]; // 5 is outlier
    const result = removeOutliers(prices);
    expect(result).not.toContain(5);
    expect(result).toHaveLength(5);
  });

  it("returns empty array for empty input", () => {
    expect(removeOutliers([])).toEqual([]);
  });

  it("returns single element as-is", () => {
    expect(removeOutliers([50])).toEqual([50]);
  });
});

describe("aggregateListings", () => {
  it("calculates avg, min, max from listings", () => {
    const listings: RawListing[] = [
      { price: 5000000000, areaM2: 80, rooms: 2, source: "nhatot" },
      { price: 4800000000, areaM2: 75, rooms: 2, source: "nhatot" },
      { price: 5200000000, areaM2: 85, rooms: 2, source: "batdongsan" },
    ];

    const result = aggregateListings(listings);
    // price/m2: 62500000, 64000000, 61176471
    expect(result.avg_price_per_m2).toBeGreaterThan(0);
    expect(result.min_price_per_m2).toBeLessThanOrEqual(result.avg_price_per_m2);
    expect(result.max_price_per_m2).toBeGreaterThanOrEqual(result.avg_price_per_m2);
    expect(result.listing_count).toBe(3);
  });

  it("removes outliers before calculating", () => {
    const listings: RawListing[] = [
      { price: 5000000000, areaM2: 80, rooms: 2, source: "nhatot" },
      { price: 4800000000, areaM2: 75, rooms: 2, source: "nhatot" },
      { price: 4900000000, areaM2: 78, rooms: 2, source: "nhatot" },
      { price: 50000000000, areaM2: 80, rooms: 2, source: "nhatot" }, // outlier: 10x
    ];

    const result = aggregateListings(listings);
    expect(result.listing_count).toBe(3); // outlier removed
  });

  it("returns null for empty listings", () => {
    expect(aggregateListings([])).toBeNull();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run __tests__/lib/apartment-indicators.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 4: Implement `src/lib/apartment-indicators.ts`**

```typescript
export interface RawListing {
  price: number;       // total price in VND
  areaM2: number;      // area in m²
  rooms: number;       // number of bedrooms
  source: "nhatot" | "batdongsan";
}

export interface AggregatedPrice {
  avg_price_per_m2: number;
  min_price_per_m2: number;
  max_price_per_m2: number;
  listing_count: number;
}

export function removeOutliers(prices: number[]): number[] {
  if (prices.length <= 1) return prices;

  const sorted = [...prices].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  return prices.filter((p) => p >= median * 0.5 && p <= median * 2);
}

export function aggregateListings(
  listings: RawListing[]
): AggregatedPrice | null {
  if (listings.length === 0) return null;

  const pricesPerM2 = listings.map((l) => Math.round(l.price / l.areaM2));
  const cleaned = removeOutliers(pricesPerM2);

  if (cleaned.length === 0) return null;

  const sum = cleaned.reduce((a, b) => a + b, 0);
  const avg = Math.round(sum / cleaned.length);
  const min = Math.min(...cleaned);
  const max = Math.max(...cleaned);

  return {
    avg_price_per_m2: avg,
    min_price_per_m2: min,
    max_price_per_m2: max,
    listing_count: cleaned.length,
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run __tests__/lib/apartment-indicators.test.ts
```

Expected: All 6 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/db.ts src/lib/apartment-indicators.ts __tests__/lib/apartment-indicators.test.ts
git commit -m "feat: add apartment_prices schema and price aggregation logic"
```

---

### Task 2: Nhatot (Chotot) Scraper

**Files:**
- Create: `src/lib/apartment-scraper-nhatot.ts`, `__tests__/lib/apartment-scraper-nhatot.test.ts`

- [ ] **Step 1: Write failing tests — `__tests__/lib/apartment-scraper-nhatot.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseNhatotResponse, type NhatotAd } from "@/lib/apartment-scraper-nhatot";

describe("parseNhatotResponse", () => {
  it("extracts listings matching ocean park 1 with correct rooms", () => {
    const mockAds: NhatotAd[] = [
      {
        price: 3500000000,
        area: 69,
        rooms: 2,
        subject: "Bán căn hộ 2PN Vinhomes Ocean Park S1.02",
        pty_project_name: "Vinhomes Ocean Park Gia Lâm",
        price_million_per_m2: 50.7,
      },
      {
        price: 2800000000,
        area: 46,
        rooms: 1,
        subject: "Bán studio Ocean Park",
        pty_project_name: "Vinhomes Ocean Park Gia Lâm",
        price_million_per_m2: 60.9,
      },
      {
        price: 5000000000,
        area: 90,
        rooms: 3,
        subject: "Bán chung cư Hoàng Mai",
        pty_project_name: "Some Other Project",
        price_million_per_m2: 55.6,
      },
    ];

    const result = parseNhatotResponse(mockAds, "ocean_park_1", 2);
    expect(result).toHaveLength(1);
    expect(result[0].price).toBe(3500000000);
    expect(result[0].rooms).toBe(2);
    expect(result[0].source).toBe("nhatot");
  });

  it("matches ocean park 2 keywords", () => {
    const mockAds: NhatotAd[] = [
      {
        price: 3000000000,
        area: 65,
        rooms: 2,
        subject: "Bán căn hộ Ocean Park 2 tòa N1",
        pty_project_name: "",
        price_million_per_m2: 46.2,
      },
    ];

    const result = parseNhatotResponse(mockAds, "ocean_park_2", 2);
    expect(result).toHaveLength(1);
  });

  it("matches ocean park 3 keywords", () => {
    const mockAds: NhatotAd[] = [
      {
        price: 2500000000,
        area: 55,
        rooms: 1,
        subject: "Studio Ocean Park 3 giá tốt",
        pty_project_name: "",
        price_million_per_m2: 45.5,
      },
    ];

    const result = parseNhatotResponse(mockAds, "ocean_park_3", 1);
    expect(result).toHaveLength(1);
  });

  it("excludes listings with zero price or area", () => {
    const mockAds: NhatotAd[] = [
      {
        price: 0,
        area: 69,
        rooms: 2,
        subject: "Ocean Park apartment",
        pty_project_name: "",
        price_million_per_m2: 0,
      },
    ];

    const result = parseNhatotResponse(mockAds, "ocean_park_1", 2);
    expect(result).toHaveLength(0);
  });

  it("returns empty array when no matches", () => {
    const result = parseNhatotResponse([], "ocean_park_1", 2);
    expect(result).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run __tests__/lib/apartment-scraper-nhatot.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/apartment-scraper-nhatot.ts`**

```typescript
import { type RawListing } from "./apartment-indicators";

const CHOTOT_API = "https://gateway.chotot.com/v1/public/ad-listing";

export interface NhatotAd {
  price: number;
  area: number;
  rooms: number;
  subject: string;
  pty_project_name: string;
  price_million_per_m2: number;
}

const AREA_KEYWORDS: Record<string, string[]> = {
  ocean_park_1: ["ocean park gia lâm", "ocean park 1", "ocean park s"],
  ocean_park_2: ["ocean park 2"],
  ocean_park_3: ["ocean park 3"],
};

function matchesArea(ad: NhatotAd, area: string): boolean {
  const keywords = AREA_KEYWORDS[area];
  if (!keywords) return false;

  const text = `${ad.subject} ${ad.pty_project_name}`.toLowerCase();

  // For ocean_park_1: match "ocean park" but NOT "ocean park 2" or "ocean park 3"
  if (area === "ocean_park_1") {
    if (text.includes("ocean park 2") || text.includes("ocean park 3")) {
      return false;
    }
    return keywords.some((kw) => text.includes(kw));
  }

  return keywords.some((kw) => text.includes(kw));
}

export function parseNhatotResponse(
  ads: NhatotAd[],
  area: string,
  rooms: number
): RawListing[] {
  return ads
    .filter((ad) => {
      if (ad.price <= 0 || ad.area <= 0) return false;
      if (ad.rooms !== rooms) return false;
      return matchesArea(ad, area);
    })
    .map((ad) => ({
      price: ad.price,
      areaM2: ad.area,
      rooms: ad.rooms,
      source: "nhatot" as const,
    }));
}

export async function fetchNhatotListings(
  area: string,
  rooms: number
): Promise<RawListing[]> {
  const areaKeywords = area === "ocean_park_1"
    ? "vinhomes ocean park"
    : area === "ocean_park_2"
      ? "ocean park 2"
      : "ocean park 3";

  const allListings: NhatotAd[] = [];

  // Fetch 2 pages of 50 results each
  for (let page = 0; page < 2; page++) {
    const url = new URL(CHOTOT_API);
    url.searchParams.set("cg", "1010"); // apartment category
    url.searchParams.set("region_v2", "12000"); // Hanoi
    url.searchParams.set("key", areaKeywords);
    url.searchParams.set("rooms", String(rooms));
    url.searchParams.set("st", "s"); // for sale
    url.searchParams.set("limit", "50");
    url.searchParams.set("o", String(page * 50));

    try {
      const response = await fetch(url.toString(), {
        headers: { "User-Agent": "GoldPriceTracker/1.0" },
      });

      if (!response.ok) {
        console.error(`Nhatot API error: ${response.status}`);
        break;
      }

      const data = await response.json();
      const ads: NhatotAd[] = data.ads || [];
      if (ads.length === 0) break;

      allListings.push(...ads);
    } catch (err) {
      console.error("Nhatot fetch error:", err);
      break;
    }
  }

  return parseNhatotResponse(allListings, area, rooms);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run __tests__/lib/apartment-scraper-nhatot.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/apartment-scraper-nhatot.ts __tests__/lib/apartment-scraper-nhatot.test.ts
git commit -m "feat: add nhatot/chotot apartment scraper via public API"
```

---

### Task 3: Batdongsan Scraper (via ScrapingBee)

**Files:**
- Create: `src/lib/apartment-scraper-batdongsan.ts`, `__tests__/lib/apartment-scraper-batdongsan.test.ts`, `__tests__/lib/fixtures/batdongsan-listing.html`

- [ ] **Step 1: Create HTML fixture `__tests__/lib/fixtures/batdongsan-listing.html`**

Fetch a sample from batdongsan.com.vn search results page and save it. The fixture should contain at least 3 listing items with price, area, and bedroom count. Create a minimal realistic HTML structure:

```html
<html>
<body>
<div class="js__card">
  <div class="re__card-title">Bán căn hộ 2 phòng ngủ Vinhomes Ocean Park S1.02</div>
  <div class="re__card-config">
    <span class="re__card-config-price">3,5 tỷ</span>
    <span class="re__card-config-area">69 m²</span>
    <span class="re__card-config-bedroom">2 PN</span>
  </div>
</div>
<div class="js__card">
  <div class="re__card-title">Bán căn hộ 2PN Ocean Park tòa S2.05</div>
  <div class="re__card-config">
    <span class="re__card-config-price">4,2 tỷ</span>
    <span class="re__card-config-area">83 m²</span>
    <span class="re__card-config-bedroom">2 PN</span>
  </div>
</div>
<div class="js__card">
  <div class="re__card-title">Bán nhà riêng quận Hoàng Mai</div>
  <div class="re__card-config">
    <span class="re__card-config-price">8,5 tỷ</span>
    <span class="re__card-config-area">120 m²</span>
    <span class="re__card-config-bedroom">4 PN</span>
  </div>
</div>
</body>
</html>
```

Note: The actual HTML class names on batdongsan.com.vn may differ. After deploying, verify by inspecting a ScrapingBee response and update the selectors if needed.

- [ ] **Step 2: Write failing tests — `__tests__/lib/apartment-scraper-batdongsan.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { parseBatdongsanHtml } from "@/lib/apartment-scraper-batdongsan";
import { readFileSync } from "fs";
import path from "path";

const fixtureHtml = readFileSync(
  path.join(__dirname, "fixtures/batdongsan-listing.html"),
  "utf-8"
);

describe("parseBatdongsanHtml", () => {
  it("extracts listings with price and area", () => {
    const result = parseBatdongsanHtml(fixtureHtml);
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0]).toHaveProperty("price");
    expect(result[0]).toHaveProperty("areaM2");
    expect(result[0]).toHaveProperty("rooms");
    expect(result[0].source).toBe("batdongsan");
  });

  it("parses Vietnamese price format (tỷ)", () => {
    const result = parseBatdongsanHtml(fixtureHtml);
    const first = result[0];
    expect(first.price).toBe(3500000000); // 3.5 tỷ
    expect(first.areaM2).toBe(69);
    expect(first.rooms).toBe(2);
  });

  it("handles empty HTML", () => {
    const result = parseBatdongsanHtml("<html><body></body></html>");
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run __tests__/lib/apartment-scraper-batdongsan.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 4: Implement `src/lib/apartment-scraper-batdongsan.ts`**

```typescript
import * as cheerio from "cheerio";
import { type RawListing } from "./apartment-indicators";

const SCRAPINGBEE_API = "https://app.scrapingbee.com/api/v1/";

const AREA_URLS: Record<string, string> = {
  ocean_park_1: "https://batdongsan.com.vn/ban-can-ho-chung-cu-vinhomes-ocean-park-prj",
  ocean_park_2: "https://batdongsan.com.vn/ban-can-ho-chung-cu-vinhomes-ocean-park-2-prj",
  ocean_park_3: "https://batdongsan.com.vn/ban-can-ho-chung-cu-vinhomes-ocean-park-3-prj",
};

function parseVietnamesePrice(text: string): number {
  const cleaned = text.trim().toLowerCase();

  // "3,5 tỷ" → 3500000000
  const tyMatch = cleaned.match(/([\d,.]+)\s*tỷ/);
  if (tyMatch) {
    const num = parseFloat(tyMatch[1].replace(",", "."));
    return Math.round(num * 1_000_000_000);
  }

  // "350 triệu" → 350000000
  const trieuMatch = cleaned.match(/([\d,.]+)\s*triệu/);
  if (trieuMatch) {
    const num = parseFloat(trieuMatch[1].replace(",", "."));
    return Math.round(num * 1_000_000);
  }

  return 0;
}

function parseArea(text: string): number {
  const match = text.match(/([\d,.]+)\s*m/);
  if (!match) return 0;
  return parseFloat(match[1].replace(",", "."));
}

function parseBedrooms(text: string): number {
  const match = text.match(/(\d+)\s*PN/i);
  if (!match) return 0;
  return parseInt(match[1], 10);
}

export function parseBatdongsanHtml(html: string): RawListing[] {
  const $ = cheerio.load(html);
  const listings: RawListing[] = [];

  $(".js__card").each((_, card) => {
    const priceText = $(card).find(".re__card-config-price").text();
    const areaText = $(card).find(".re__card-config-area").text();
    const bedroomText = $(card).find(".re__card-config-bedroom").text();

    const price = parseVietnamesePrice(priceText);
    const areaM2 = parseArea(areaText);
    const rooms = parseBedrooms(bedroomText);

    if (price > 0 && areaM2 > 0 && rooms > 0) {
      listings.push({ price, areaM2, rooms, source: "batdongsan" });
    }
  });

  return listings;
}

export async function fetchBatdongsanListings(
  area: string,
  rooms: number
): Promise<RawListing[]> {
  const apiKey = process.env.SCRAPINGBEE_API_KEY;
  if (!apiKey) {
    console.error("SCRAPINGBEE_API_KEY not set");
    return [];
  }

  const baseUrl = AREA_URLS[area];
  if (!baseUrl) return [];

  const targetUrl = `${baseUrl}/p${rooms}`;
  const allListings: RawListing[] = [];

  // Fetch 2 pages
  for (let page = 1; page <= 2; page++) {
    const url = new URL(SCRAPINGBEE_API);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("url", page === 1 ? targetUrl : `${targetUrl}/p${page}`);
    url.searchParams.set("render_js", "false");

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        console.error(`ScrapingBee error for ${area}: ${response.status}`);
        break;
      }

      const html = await response.text();
      const listings = parseBatdongsanHtml(html);
      if (listings.length === 0) break;

      allListings.push(...listings.filter((l) => l.rooms === rooms));
    } catch (err) {
      console.error(`ScrapingBee fetch error for ${area}:`, err);
      break;
    }
  }

  return allListings;
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run __tests__/lib/apartment-scraper-batdongsan.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/apartment-scraper-batdongsan.ts __tests__/lib/apartment-scraper-batdongsan.test.ts __tests__/lib/fixtures/batdongsan-listing.html
git commit -m "feat: add batdongsan apartment scraper via ScrapingBee"
```

---

### Task 4: Scraper Orchestrator

**Files:**
- Create: `src/lib/apartment-scraper.ts`

- [ ] **Step 1: Implement `src/lib/apartment-scraper.ts`**

```typescript
import { fetchNhatotListings } from "./apartment-scraper-nhatot";
import { fetchBatdongsanListings } from "./apartment-scraper-batdongsan";
import { aggregateListings, type RawListing, type AggregatedPrice } from "./apartment-indicators";

const AREAS = ["ocean_park_1", "ocean_park_2", "ocean_park_3"] as const;
const BEDROOM_TYPES = [1, 2, 3] as const;

export type AreaKey = (typeof AREAS)[number];
export type BedroomType = (typeof BEDROOM_TYPES)[number];

export interface ScrapeResult {
  area: AreaKey;
  bedroom_type: string;
  data: AggregatedPrice | null;
}

export async function scrapeAllApartments(): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];

  for (const area of AREAS) {
    for (const rooms of BEDROOM_TYPES) {
      const bedroomType = `${rooms}pn`;

      // Fetch from both sources in parallel
      const [nhatotListings, batdongsanListings] = await Promise.allSettled([
        fetchNhatotListings(area, rooms),
        fetchBatdongsanListings(area, rooms),
      ]);

      const allListings: RawListing[] = [];

      if (nhatotListings.status === "fulfilled") {
        allListings.push(...nhatotListings.value);
      } else {
        console.error(`Nhatot failed for ${area}/${bedroomType}:`, nhatotListings.reason);
      }

      if (batdongsanListings.status === "fulfilled") {
        allListings.push(...batdongsanListings.value);
      } else {
        console.error(`Batdongsan failed for ${area}/${bedroomType}:`, batdongsanListings.reason);
      }

      const aggregated = aggregateListings(allListings);
      results.push({ area, bedroom_type: bedroomType, data: aggregated });
    }
  }

  return results;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/apartment-scraper.ts
git commit -m "feat: add apartment scraper orchestrator"
```

---

### Task 5: Scrape Apartments Cron API Route

**Files:**
- Create: `src/app/api/cron/scrape-apartments/route.ts`, `__tests__/api/scrape-apartments.test.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Write failing test — `__tests__/api/scrape-apartments.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/apartment-scraper", () => ({
  scrapeAllApartments: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: { execute: vi.fn() },
  initDb: vi.fn(),
}));

import { scrapeAllApartments } from "@/lib/apartment-scraper";
import { db, initDb } from "@/lib/db";
import { POST } from "@/app/api/cron/scrape-apartments/route";

describe("POST /api/cron/scrape-apartments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-secret";
    vi.mocked(initDb).mockResolvedValue(undefined);
  });

  it("rejects requests without valid authorization", async () => {
    const req = new Request("http://localhost/api/cron/scrape-apartments", {
      method: "POST",
      headers: { Authorization: "wrong" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("scrapes and stores apartment prices", async () => {
    vi.mocked(scrapeAllApartments).mockResolvedValue([
      {
        area: "ocean_park_1",
        bedroom_type: "2pn",
        data: {
          avg_price_per_m2: 55000000,
          min_price_per_m2: 50000000,
          max_price_per_m2: 60000000,
          listing_count: 15,
        },
      },
      {
        area: "ocean_park_1",
        bedroom_type: "1pn",
        data: null, // no listings found
      },
    ]);
    vi.mocked(db.execute).mockResolvedValue({ rows: [], columns: [], rowsAffected: 1, lastInsertRowid: BigInt(1) } as any);

    const req = new Request("http://localhost/api/cron/scrape-apartments", {
      method: "POST",
      headers: { Authorization: "Bearer test-secret" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.records_saved).toBe(1); // only 1 had data
    expect(db.execute).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/api/scrape-apartments.test.ts
```

Expected: FAIL — route module not found.

- [ ] **Step 3: Implement `src/app/api/cron/scrape-apartments/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { scrapeAllApartments } from "@/lib/apartment-scraper";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await initDb();

  const results = await scrapeAllApartments();
  const today = new Date().toISOString().split("T")[0];
  let recordsSaved = 0;

  for (const result of results) {
    if (!result.data) continue;

    await db.execute({
      sql: `INSERT INTO apartment_prices (date, area, bedroom_type, avg_price_per_m2, min_price_per_m2, max_price_per_m2, listing_count)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(date, area, bedroom_type) DO UPDATE SET
              avg_price_per_m2 = excluded.avg_price_per_m2,
              min_price_per_m2 = excluded.min_price_per_m2,
              max_price_per_m2 = excluded.max_price_per_m2,
              listing_count = excluded.listing_count,
              created_at = datetime('now')`,
      args: [
        today,
        result.area,
        result.bedroom_type,
        result.data.avg_price_per_m2,
        result.data.min_price_per_m2,
        result.data.max_price_per_m2,
        result.data.listing_count,
      ],
    });
    recordsSaved++;
  }

  return NextResponse.json({ success: true, records_saved: recordsSaved });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run __tests__/api/scrape-apartments.test.ts
```

Expected: All 2 tests PASS.

- [ ] **Step 5: Update `vercel.json` — add apartment cron**

```json
{
  "crons": [
    {
      "path": "/api/cron/scrape",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/scrape-apartments",
      "schedule": "0 3 * * *"
    }
  ]
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/cron/scrape-apartments/route.ts __tests__/api/scrape-apartments.test.ts vercel.json
git commit -m "feat: add apartment scrape cron API route"
```

---

### Task 6: Apartment Prices API Route

**Files:**
- Create: `src/app/api/apartment-prices/route.ts`, `__tests__/api/apartment-prices.test.ts`

- [ ] **Step 1: Write failing test — `__tests__/api/apartment-prices.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: { execute: vi.fn() },
  initDb: vi.fn(),
}));

import { db, initDb } from "@/lib/db";
import { GET } from "@/app/api/apartment-prices/route";

describe("GET /api/apartment-prices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(initDb).mockResolvedValue(undefined);
  });

  it("returns prices for default 1m range", async () => {
    vi.mocked(db.execute).mockResolvedValue({
      rows: [
        { date: "2026-04-01", area: "ocean_park_1", bedroom_type: "2pn", avg_price_per_m2: 55000000, min_price_per_m2: 50000000, max_price_per_m2: 60000000, listing_count: 15 },
      ],
      columns: [], rowsAffected: 0, lastInsertRowid: undefined,
    } as any);

    const req = new Request("http://localhost/api/apartment-prices");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].area).toBe("ocean_park_1");
  });

  it("filters by area when provided", async () => {
    vi.mocked(db.execute).mockResolvedValue({ rows: [], columns: [], rowsAffected: 0, lastInsertRowid: undefined } as any);

    const req = new Request("http://localhost/api/apartment-prices?area=ocean_park_2");
    const res = await GET(req);

    expect(db.execute).toHaveBeenCalledWith(
      expect.objectContaining({ sql: expect.stringContaining("area = ?") })
    );
  });

  it("returns all areas when area param is omitted", async () => {
    vi.mocked(db.execute).mockResolvedValue({ rows: [], columns: [], rowsAffected: 0, lastInsertRowid: undefined } as any);

    const req = new Request("http://localhost/api/apartment-prices");
    const res = await GET(req);

    expect(db.execute).toHaveBeenCalledWith(
      expect.objectContaining({ sql: expect.not.stringContaining("area = ?") })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/api/apartment-prices.test.ts
```

Expected: FAIL — route module not found.

- [ ] **Step 3: Implement `src/app/api/apartment-prices/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";

const RANGE_DAYS: Record<string, number> = {
  "1m": 30,
  "3m": 90,
  "6m": 180,
};

const VALID_AREAS = ["ocean_park_1", "ocean_park_2", "ocean_park_3"];

export async function GET(request: Request) {
  await initDb();

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "1m";
  const area = searchParams.get("area");
  const days = RANGE_DAYS[range] || RANGE_DAYS["1m"];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split("T")[0];

  if (area && VALID_AREAS.includes(area)) {
    const result = await db.execute({
      sql: "SELECT date, area, bedroom_type, avg_price_per_m2, min_price_per_m2, max_price_per_m2, listing_count FROM apartment_prices WHERE date >= ? AND area = ? ORDER BY date ASC",
      args: [startDateStr, area],
    });
    return NextResponse.json(result.rows);
  }

  const result = await db.execute({
    sql: "SELECT date, area, bedroom_type, avg_price_per_m2, min_price_per_m2, max_price_per_m2, listing_count FROM apartment_prices WHERE date >= ? ORDER BY date ASC",
    args: [startDateStr],
  });
  return NextResponse.json(result.rows);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run __tests__/api/apartment-prices.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/apartment-prices/route.ts __tests__/api/apartment-prices.test.ts
git commit -m "feat: add apartment prices API route with area and range filters"
```

---

### Task 7: NavBar + GoldView Components

**Files:**
- Create: `src/components/NavBar.tsx`, `src/components/GoldView.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create `src/components/NavBar.tsx`**

```tsx
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
```

- [ ] **Step 2: Create `src/components/GoldView.tsx`**

Extract the current gold-related logic from `page.tsx` into its own component:

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
    allPrices.length > RANGE_DAYS[range]
      ? allPrices.length - RANGE_DAYS[range]
      : 0;

  const visiblePrices = allPrices.slice(visibleStartIndex);

  return (
    <>
      <Header prices={visiblePrices} />
      <TimeRangeSelector selected={range} onChange={setRange} />
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
    </>
  );
}
```

- [ ] **Step 3: Update `src/app/page.tsx`**

Replace the entire file:

```tsx
"use client";

import { useState } from "react";
import NavBar from "@/components/NavBar";
import GoldView from "@/components/GoldView";

export default function Home() {
  const [view, setView] = useState<"gold" | "apartment">("gold");

  return (
    <main>
      <NavBar active={view} onChange={setView} />
      {view === "gold" && <GoldView />}
      {view === "apartment" && (
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "var(--text-muted)" }}>Apartment view coming soon...</p>
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 4: Verify build and Gold view still works**

```bash
npm run build
```

Expected: Build succeeds. Opening the app shows GOLD | APARTMENT nav, Gold view works as before.

- [ ] **Step 5: Commit**

```bash
git add src/components/NavBar.tsx src/components/GoldView.tsx src/app/page.tsx
git commit -m "feat: add top-level navigation and extract GoldView component"
```

---

### Task 8: Apartment UI Components

**Files:**
- Create: `src/components/AreaSelector.tsx`, `src/components/ApartmentChart.tsx`, `src/components/ApartmentStatsBar.tsx`, `src/components/ApartmentPriceTable.tsx`

- [ ] **Step 1: Create `src/components/AreaSelector.tsx`**

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
```

- [ ] **Step 2: Create `src/components/ApartmentChart.tsx`**

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

export interface ApartmentPriceRow {
  date: string;
  area: string;
  bedroom_type: string;
  avg_price_per_m2: number;
  min_price_per_m2: number;
  max_price_per_m2: number;
  listing_count: number;
}

interface ApartmentChartProps {
  prices: ApartmentPriceRow[];
  selectedArea: string;
  selectedBedroom: string;
}

const BEDROOM_COLORS: Record<string, string> = {
  "1pn": "#60a5fa",
  "2pn": "#fb923c",
  "3pn": "#4ade80",
};

const AREA_COLORS: Record<string, string> = {
  ocean_park_1: "#60a5fa",
  ocean_park_2: "#fb923c",
  ocean_park_3: "#4ade80",
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
    // Single area: show 3 bedroom type lines
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
    // All areas: show 3 area lines for selected bedroom type
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
        labels: { color: "#a3a3a3", font: { size: 11 }, boxWidth: 12, padding: 12 },
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
            return `${ctx.dataset.label}: ${formatMillions(ctx.raw as number)}/m²`;
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
      <Line data={{ labels, datasets }} options={options} />
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/ApartmentStatsBar.tsx`**

```tsx
import { type ApartmentPriceRow } from "@/components/ApartmentChart";

interface ApartmentStatsBarProps {
  prices: ApartmentPriceRow[];
  selectedArea: string;
}

function formatVND(value: number): string {
  return (value / 1_000_000).toFixed(1) + "M";
}

export default function ApartmentStatsBar({ prices, selectedArea }: ApartmentStatsBarProps) {
  if (prices.length === 0) return null;

  const bedroomTypes = ["1pn", "2pn", "3pn"];
  const areas = selectedArea === "all"
    ? ["ocean_park_1", "ocean_park_2", "ocean_park_3"]
    : [selectedArea];

  // Get latest date's data
  const latestDate = prices.reduce((max, p) => (p.date > max ? p.date : max), "");
  const latestPrices = prices.filter((p) => p.date === latestDate && areas.includes(p.area));

  // Get data from ~7 days ago for change calculation
  const weekAgo = new Date(latestDate);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split("T")[0];
  const oldPrices = prices.filter((p) => p.date <= weekAgoStr && areas.includes(p.area));
  const oldestRelevant = oldPrices.reduce((max, p) => (p.date > max ? p.date : max), "");
  const oldPricesByType = new Map(
    oldPrices.filter((p) => p.date === oldestRelevant).map((p) => [`${p.area}:${p.bedroom_type}`, p])
  );

  return (
    <div className="stat-grid" style={{ marginBottom: "12px" }}>
      {bedroomTypes.map((bt) => {
        const current = latestPrices.filter((p) => p.bedroom_type === bt);
        if (current.length === 0) return null;

        const avgPrice = Math.round(
          current.reduce((sum, p) => sum + p.avg_price_per_m2, 0) / current.length
        );
        const totalListings = current.reduce((sum, p) => sum + p.listing_count, 0);

        // Calculate change
        let changeText = "";
        const oldEntries = current.map((c) => oldPricesByType.get(`${c.area}:${c.bedroom_type}`)).filter(Boolean);
        if (oldEntries.length > 0) {
          const oldAvg = Math.round(
            oldEntries.reduce((sum, p) => sum + p!.avg_price_per_m2, 0) / oldEntries.length
          );
          const changePct = ((avgPrice - oldAvg) / oldAvg) * 100;
          changeText = `${changePct > 0 ? "+" : ""}${changePct.toFixed(1)}%`;
        }

        return (
          <div className="stat-item" key={bt}>
            <div className="stat-label">{bt.toUpperCase()}</div>
            <div className="stat-value">{formatVND(avgPrice)}/m²</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {totalListings} listings
              {changeText && (
                <span className={changeText.startsWith("+") ? "price-up" : "price-down"} style={{ marginLeft: "6px" }}>
                  {changeText}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/ApartmentPriceTable.tsx`**

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

  const areas = selectedArea === "all"
    ? ["ocean_park_1", "ocean_park_2", "ocean_park_3"]
    : [selectedArea];

  const filtered = prices.filter((p) => areas.includes(p.area));
  const dates = [...new Set(filtered.map((p) => p.date))].sort().reverse();

  return (
    <div className="table-scroll">
      <table className="price-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>1PN</th>
            <th>2PN</th>
            <th>3PN</th>
          </tr>
        </thead>
        <tbody>
          {dates.map((date) => {
            const dayPrices = filtered.filter((p) => p.date === date);
            const getAvg = (bt: string) => {
              const entries = dayPrices.filter((p) => p.bedroom_type === bt);
              if (entries.length === 0) return "—";
              const avg = Math.round(entries.reduce((s, p) => s + p.avg_price_per_m2, 0) / entries.length);
              return formatM(avg);
            };

            return (
              <tr key={date}>
                <td>{date.slice(5)}</td>
                <td>{getAvg("1pn")}</td>
                <td>{getAvg("2pn")}</td>
                <td>{getAvg("3pn")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/AreaSelector.tsx src/components/ApartmentChart.tsx src/components/ApartmentStatsBar.tsx src/components/ApartmentPriceTable.tsx
git commit -m "feat: add apartment UI components — AreaSelector, Chart, StatsBar, PriceTable"
```

---

### Task 9: ApartmentView + Wire Into Page

**Files:**
- Create: `src/components/ApartmentView.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create `src/components/ApartmentView.tsx`**

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import TimeRangeSelector from "@/components/TimeRangeSelector";
import AreaSelector from "@/components/AreaSelector";
import ApartmentChart, { type ApartmentPriceRow } from "@/components/ApartmentChart";
import ApartmentStatsBar from "@/components/ApartmentStatsBar";
import ApartmentPriceTable from "@/components/ApartmentPriceTable";

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
      <div className="card">
        <h1 style={{ fontSize: "18px", color: "var(--text-muted)", marginBottom: "4px" }}>
          Apartment Price Tracker
        </h1>
        <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          Vinhomes Ocean Park — Avg price per m²
        </p>
      </div>

      <AreaSelector selected={area} onChange={setArea} />
      <TimeRangeSelector selected={range} onChange={setRange} />

      {area === "all" && (
        <div className="pill-group" style={{ marginTop: "-8px" }}>
          {BEDROOM_TYPES.map((bt) => (
            <button
              key={bt}
              className={`pill ${bedroomFilter === bt ? "active" : ""}`}
              onClick={() => setBedroomFilter(bt)}
              style={{ fontSize: "12px", padding: "4px 14px" }}
            >
              {bt.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "var(--text-muted)" }}>Loading...</p>
        </div>
      ) : prices.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "var(--text-muted)" }}>No apartment data yet. Data will appear after the first daily crawl.</p>
        </div>
      ) : (
        <>
          <ApartmentChart prices={prices} selectedArea={area} selectedBedroom={bedroomFilter} />
          <ApartmentStatsBar prices={prices} selectedArea={area} />
          <ApartmentPriceTable prices={prices} selectedArea={area} />
        </>
      )}
    </>
  );
}
```

- [ ] **Step 2: Update `src/app/page.tsx` — replace placeholder with ApartmentView**

```tsx
"use client";

import { useState } from "react";
import NavBar from "@/components/NavBar";
import GoldView from "@/components/GoldView";
import ApartmentView from "@/components/ApartmentView";

export default function Home() {
  const [view, setView] = useState<"gold" | "apartment">("gold");

  return (
    <main>
      <NavBar active={view} onChange={setView} />
      {view === "gold" && <GoldView />}
      {view === "apartment" && <ApartmentView />}
    </main>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/ApartmentView.tsx src/app/page.tsx
git commit -m "feat: add ApartmentView and wire into main page with navigation"
```

---

### Task 10: Full Test Suite + Build Verification

**Files:** No new files.

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 2: Verify production build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Add `SCRAPINGBEE_API_KEY` to `.env.local` placeholder**

Add to `.env.local`:

```
SCRAPINGBEE_API_KEY=your-scrapingbee-api-key
```

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "chore: final test and build verification for apartment tracker"
```
