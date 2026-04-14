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
