import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const db = createClient({
  url: process.env.TURSO_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const CHOTOT_API = "https://gateway.chotot.com/v1/public/ad-listing";

interface NhatotAd {
  price: number;
  size: number;
  rooms: number;
  subject: string;
  pty_project_name: string;
  list_time: number;
  list_id?: number;
}

interface ListingWithDate {
  date: string;
  price: number;
  areaM2: number;
  pricePerM2: number;
  rooms: number;
  area: string;
  url: string;
  title: string;
}

const AREA_CONFIGS = [
  { key: "ocean_park_1", search: "vinhomes ocean park gia lam" },
  { key: "ocean_park_2", search: "vinhomes ocean park 2" },
  { key: "ocean_park_3", search: "vinhomes ocean park 3" },
];

const ROOM_TYPES = [1, 2, 3];

function matchesArea(ad: NhatotAd, area: string): boolean {
  const projectName = (ad.pty_project_name || "").toLowerCase();
  if (area === "ocean_park_1") {
    if (projectName.includes("ocean park 2") || projectName.includes("ocean park 3")) return false;
    return projectName.includes("ocean park");
  }
  if (area === "ocean_park_2") return projectName.includes("ocean park 2");
  if (area === "ocean_park_3") return projectName.includes("ocean park 3");
  return false;
}

function removeOutliers(prices: number[]): number[] {
  if (prices.length <= 1) return prices;
  const sorted = [...prices].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return prices.filter((p) => p >= median * 0.5 && p <= median * 2);
}

async function fetchListings(search: string, rooms: number, pages: number): Promise<NhatotAd[]> {
  const allAds: NhatotAd[] = [];

  for (let page = 0; page < pages; page++) {
    const url = new URL(CHOTOT_API);
    url.searchParams.set("cg", "1010");
    url.searchParams.set("region_v2", "12000");
    url.searchParams.set("key", search);
    url.searchParams.set("rooms", String(rooms));
    url.searchParams.set("st", "s");
    url.searchParams.set("limit", "50");
    url.searchParams.set("o", String(page * 50));

    try {
      const response = await fetch(url.toString(), {
        headers: { "User-Agent": "ApartmentTracker/1.0" },
      });

      if (!response.ok) {
        console.error(`API error page ${page}: ${response.status}`);
        break;
      }

      const data = await response.json();
      const ads: NhatotAd[] = data.ads || [];
      if (ads.length === 0) break;
      allAds.push(...ads);
      console.log(`  Page ${page + 1}: ${ads.length} ads`);
    } catch (err) {
      console.error(`Fetch error page ${page}:`, err);
      break;
    }

    // Small delay to be polite
    await new Promise((r) => setTimeout(r, 500));
  }

  return allAds;
}

async function main() {
  // Init table
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
      sample_listings TEXT DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(date, area, bedroom_type)
    )
  `);
  await db.execute(`ALTER TABLE apartment_prices ADD COLUMN sample_listings TEXT DEFAULT '[]'`).catch(() => {});

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);
  const cutoffStr = cutoffDate.toISOString().split("T")[0];

  let totalSaved = 0;

  for (const areaConfig of AREA_CONFIGS) {
    for (const rooms of ROOM_TYPES) {
      const bedroomType = `${rooms}pn`;
      console.log(`\nFetching ${areaConfig.key} / ${bedroomType}...`);

      // Fetch more pages for backfill (10 pages = 500 listings)
      const allAds = await fetchListings(areaConfig.search, rooms, 10);
      console.log(`  Total ads fetched: ${allAds.length}`);

      // Filter by area and convert
      const matched: ListingWithDate[] = allAds
        .filter((ad) => {
          if (ad.price <= 0 || ad.size <= 0) return false;
          if (ad.rooms !== rooms) return false;
          return matchesArea(ad, areaConfig.key);
        })
        .map((ad) => {
          const dateObj = new Date(ad.list_time);
          return {
            date: dateObj.toISOString().split("T")[0],
            price: ad.price,
            areaM2: ad.size,
            pricePerM2: Math.round(ad.price / ad.size),
            rooms: ad.rooms,
            area: areaConfig.key,
            url: ad.list_id ? `https://www.nhatot.com/${ad.list_id}.htm` : "",
            title: ad.subject,
          };
        })
        .filter((l) => l.date >= cutoffStr);

      console.log(`  Matched listings (last 30 days): ${matched.length}`);

      // Sanity check: remove listings with unreasonable price/m²
      const sane = matched.filter((l) => l.pricePerM2 >= 20_000_000 && l.pricePerM2 <= 200_000_000);
      console.log(`  After sanity check: ${sane.length} listings`);

      // Group by date
      const byDate = new Map<string, ListingWithDate[]>();
      for (const l of sane) {
        const existing = byDate.get(l.date) || [];
        existing.push(l);
        byDate.set(l.date, existing);
      }

      // Aggregate and store each date
      for (const [date, listings] of byDate.entries()) {
        const pricesPerM2 = listings.map((l) => l.pricePerM2);
        const cleaned = removeOutliers(pricesPerM2);
        if (cleaned.length === 0) continue;

        const sum = cleaned.reduce((a, b) => a + b, 0);
        const avg = Math.round(sum / cleaned.length);
        const min = Math.min(...cleaned);
        const max = Math.max(...cleaned);

        // Build sample listings (only non-outlier ones)
        const cleanedSet = new Set(cleaned);
        const samples = listings
          .filter((l) => cleanedSet.has(l.pricePerM2) && l.url)
          .map((l) => ({
            url: l.url,
            title: l.title,
            price: l.price,
            areaM2: l.areaM2,
            pricePerM2: l.pricePerM2,
            source: "nhatot" as const,
          }))
          .slice(0, 10);

        await db.execute({
          sql: `INSERT INTO apartment_prices (date, area, bedroom_type, avg_price_per_m2, min_price_per_m2, max_price_per_m2, listing_count, sample_listings)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(date, area, bedroom_type) DO UPDATE SET
                  avg_price_per_m2 = excluded.avg_price_per_m2,
                  min_price_per_m2 = excluded.min_price_per_m2,
                  max_price_per_m2 = excluded.max_price_per_m2,
                  listing_count = excluded.listing_count,
                  sample_listings = excluded.sample_listings,
                  created_at = datetime('now')`,
          args: [date, areaConfig.key, bedroomType, avg, min, max, cleaned.length, JSON.stringify(samples)],
        });

        console.log(`  Saved ${date} ${areaConfig.key}/${bedroomType}: avg=${(avg / 1_000_000).toFixed(1)}M/m², ${cleaned.length} listings`);
        totalSaved++;
      }
    }
  }

  console.log(`\nDone! Total records saved: ${totalSaved}`);
}

main().catch(console.error);
