import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const db = createClient({
  url: process.env.TURSO_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function seed() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS gold_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      buy_price INTEGER NOT NULL,
      sell_price INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const basePrice = 15000000;
  const spread = 500000;
  const today = new Date();

  for (let i = 180; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const trend = (180 - i) * 5000;
    const noise = Math.round((Math.random() - 0.5) * 400000);
    const buyPrice = basePrice + trend + noise;
    const sellPrice = buyPrice + spread;

    await db.execute({
      sql: `INSERT OR IGNORE INTO gold_prices (date, buy_price, sell_price) VALUES (?, ?, ?)`,
      args: [dateStr, buyPrice, sellPrice],
    });
  }

  console.log("Seeded 181 days of price data.");
}

seed().catch(console.error);
