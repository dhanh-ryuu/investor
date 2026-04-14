import * as cheerio from "cheerio";

const TARGET_URL = "https://vangquytung.com/";

export interface GoldPrice {
  buyPrice: number;
  sellPrice: number;
}

export function parseGoldPrice(html: string): GoldPrice | null {
  const $ = cheerio.load(html);
  let result: GoldPrice | null = null;

  $("table tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 3) return;

    const product = $(cells[0]).text().trim();
    if (!product.includes("9999")) return;

    const buyText = $(cells[1]).text().trim();
    const sellText = $(cells[2]).text().trim();

    const buyPrice = parsePrice(buyText);
    const sellPrice = parsePrice(sellText);

    if (buyPrice > 0 && sellPrice > 0) {
      result = { buyPrice, sellPrice };
      return false; // break
    }
  });

  return result;
}

function parsePrice(text: string): number {
  const cleaned = text.replace(/[.\s,]/g, "");
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

export async function fetchGoldPrice(): Promise<GoldPrice | null> {
  const response = await fetch(TARGET_URL, {
    headers: {
      "User-Agent": "GoldPriceTracker/1.0",
    },
  });

  if (!response.ok) {
    console.error(`Failed to fetch ${TARGET_URL}: ${response.status}`);
    return null;
  }

  const html = await response.text();
  return parseGoldPrice(html);
}
