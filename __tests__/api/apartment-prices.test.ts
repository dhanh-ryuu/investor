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
        {
          date: "2026-04-01",
          area: "ocean_park_1",
          bedroom_type: "2pn",
          avg_price_per_m2: 55000000,
          min_price_per_m2: 50000000,
          max_price_per_m2: 60000000,
          listing_count: 15,
        },
      ],
      columns: [],
      rowsAffected: 0,
      lastInsertRowid: undefined,
    } as never);

    const req = new Request("http://localhost/api/apartment-prices");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].area).toBe("ocean_park_1");
  });

  it("filters by area when provided", async () => {
    vi.mocked(db.execute).mockResolvedValue({
      rows: [],
      columns: [],
      rowsAffected: 0,
      lastInsertRowid: undefined,
    } as never);

    const req = new Request(
      "http://localhost/api/apartment-prices?area=ocean_park_2"
    );
    const res = await GET(req);

    expect(db.execute).toHaveBeenCalledWith(
      expect.objectContaining({ sql: expect.stringContaining("area = ?") })
    );
  });

  it("returns all areas when area param is omitted", async () => {
    vi.mocked(db.execute).mockResolvedValue({
      rows: [],
      columns: [],
      rowsAffected: 0,
      lastInsertRowid: undefined,
    } as never);

    const req = new Request("http://localhost/api/apartment-prices");
    const res = await GET(req);

    expect(db.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        sql: expect.not.stringContaining("area = ?"),
      })
    );
  });
});
