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
import { GET } from "@/app/api/cron/scrape-apartments/route";

describe("GET /api/cron/scrape-apartments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-secret";
    vi.mocked(initDb).mockResolvedValue(undefined);
  });

  it("rejects requests without valid authorization", async () => {
    const req = new Request("http://localhost/api/cron/scrape-apartments", {
      method: "GET",
      headers: { Authorization: "wrong" },
    });
    const res = await GET(req);
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
          sample_listings: [{ url: "https://nhatot.com/123.htm", title: "Test", price: 3500000000, areaM2: 69, pricePerM2: 50724638, source: "nhatot" }],
        },
      },
      {
        area: "ocean_park_1",
        bedroom_type: "1pn",
        data: null, // no listings found
      },
    ]);
    vi.mocked(db.execute).mockResolvedValue({
      rows: [],
      columns: [],
      rowsAffected: 1,
      lastInsertRowid: BigInt(1),
    } as never);

    const req = new Request("http://localhost/api/cron/scrape-apartments", {
      method: "GET",
      headers: { Authorization: "Bearer test-secret" },
    });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.records_saved).toBe(1); // only 1 had data
    expect(db.execute).toHaveBeenCalledTimes(1);
  });
});
