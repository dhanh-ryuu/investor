import { createClient } from "@libsql/client";

export const db = createClient({
  url: process.env.TURSO_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export async function initDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS gold_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      buy_price INTEGER NOT NULL,
      sell_price INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
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
}
