import { createClient } from "@libsql/client";
import * as cheerio from "cheerio";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const db = createClient({
  url: process.env.TURSO_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

function parsePrice(text: string): number {
  const cleaned = text.replace(/[.\s,]/g, "");
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

async function main() {
  // Clear fake data
  await db.execute("DELETE FROM gold_prices");
  console.log("Cleared fake data.");

  // Fetch real price from vangquytung.com
  const response = await fetch("https://vangquytung.com/", {
    headers: { "User-Agent": "GoldPriceTracker/1.0" },
  });

  if (!response.ok) {
    console.error("Failed to fetch:", response.status);
    process.exit(1);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  let buyPrice = 0;
  let sellPrice = 0;

  $("table tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 3) return;
    const product = $(cells[0]).text().trim();
    if (!product.includes("9999")) return;
    buyPrice = parsePrice($(cells[1]).text().trim());
    sellPrice = parsePrice($(cells[2]).text().trim());
    return false;
  });

  if (buyPrice === 0 || sellPrice === 0) {
    console.error("Could not find 9999 gold price on the page.");
    process.exit(1);
  }

  const today = new Date().toISOString().split("T")[0];

  await db.execute({
    sql: `INSERT INTO gold_prices (date, buy_price, sell_price)
          VALUES (?, ?, ?)
          ON CONFLICT(date) DO UPDATE SET
            buy_price = excluded.buy_price,
            sell_price = excluded.sell_price,
            created_at = datetime('now')`,
    args: [today, buyPrice, sellPrice],
  });

  console.log(`Saved real price for ${today}:`);
  console.log(`  Buy:  ${buyPrice.toLocaleString("vi-VN")} đ`);
  console.log(`  Sell: ${sellPrice.toLocaleString("vi-VN")} đ`);
}

main().catch(console.error);
