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
