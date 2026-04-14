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
      rows: [], columns: [], rowsAffected: 0, lastInsertRowid: undefined,
    } as any);

    const req = new Request("http://localhost/api/prices?range=1m");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it("defaults to 3m for invalid range", async () => {
    vi.mocked(db.execute).mockResolvedValue({
      rows: [], columns: [], rowsAffected: 0, lastInsertRowid: undefined,
    } as any);

    const req = new Request("http://localhost/api/prices?range=invalid");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});
