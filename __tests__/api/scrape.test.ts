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
