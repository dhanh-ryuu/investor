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
      sql: "SELECT date, area, bedroom_type, avg_price_per_m2, min_price_per_m2, max_price_per_m2, listing_count, sample_listings FROM apartment_prices WHERE date >= ? AND area = ? ORDER BY date ASC",
      args: [startDateStr, area],
    });
    return NextResponse.json(result.rows);
  }

  const result = await db.execute({
    sql: "SELECT date, area, bedroom_type, avg_price_per_m2, min_price_per_m2, max_price_per_m2, listing_count, sample_listings FROM apartment_prices WHERE date >= ? ORDER BY date ASC",
    args: [startDateStr],
  });
  return NextResponse.json(result.rows);
}
