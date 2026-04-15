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
