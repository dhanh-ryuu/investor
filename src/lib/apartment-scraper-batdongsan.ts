import * as cheerio from "cheerio";
import { type RawListing } from "./apartment-indicators";

const SCRAPINGBEE_API = "https://app.scrapingbee.com/api/v1/";

const AREA_URLS: Record<string, string> = {
  ocean_park_1:
    "https://batdongsan.com.vn/ban-can-ho-chung-cu-vinhomes-ocean-park-prj",
  ocean_park_2:
    "https://batdongsan.com.vn/ban-can-ho-chung-cu-vinhomes-ocean-park-2-prj",
  ocean_park_3:
    "https://batdongsan.com.vn/ban-can-ho-chung-cu-vinhomes-ocean-park-3-prj",
};

function parseVietnamesePrice(text: string): number {
  const cleaned = text.trim().toLowerCase();

  // "3,5 tỷ" → 3500000000
  const tyMatch = cleaned.match(/([\d,.]+)\s*tỷ/);
  if (tyMatch) {
    const num = parseFloat(tyMatch[1].replace(",", "."));
    return Math.round(num * 1_000_000_000);
  }

  // "350 triệu" → 350000000
  const trieuMatch = cleaned.match(/([\d,.]+)\s*triệu/);
  if (trieuMatch) {
    const num = parseFloat(trieuMatch[1].replace(",", "."));
    return Math.round(num * 1_000_000);
  }

  return 0;
}

function parseArea(text: string): number {
  const match = text.match(/([\d,.]+)\s*m/);
  if (!match) return 0;
  return parseFloat(match[1].replace(",", "."));
}

function parseBedrooms(text: string): number {
  const match = text.match(/(\d+)\s*PN/i);
  if (!match) return 0;
  return parseInt(match[1], 10);
}

export function parseBatdongsanHtml(html: string): RawListing[] {
  const $ = cheerio.load(html);
  const listings: RawListing[] = [];

  $(".js__card").each((_, card) => {
    const priceText = $(card).find(".re__card-config-price").text();
    const areaText = $(card).find(".re__card-config-area").text();
    const bedroomText = $(card).find(".re__card-config-bedroom").text();

    const price = parseVietnamesePrice(priceText);
    const areaM2 = parseArea(areaText);
    const rooms = parseBedrooms(bedroomText);

    if (price > 0 && areaM2 > 0 && rooms > 0) {
      listings.push({ price, areaM2, rooms, source: "batdongsan" });
    }
  });

  return listings;
}

export async function fetchBatdongsanListings(
  area: string,
  rooms: number
): Promise<RawListing[]> {
  const apiKey = process.env.SCRAPINGBEE_API_KEY;
  if (!apiKey) {
    console.error("SCRAPINGBEE_API_KEY not set");
    return [];
  }

  const baseUrl = AREA_URLS[area];
  if (!baseUrl) return [];

  const targetUrl = `${baseUrl}/p${rooms}`;
  const allListings: RawListing[] = [];

  // Fetch 2 pages
  for (let page = 1; page <= 2; page++) {
    const url = new URL(SCRAPINGBEE_API);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set(
      "url",
      page === 1 ? targetUrl : `${targetUrl}/p${page}`
    );
    url.searchParams.set("render_js", "false");

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        console.error(`ScrapingBee error for ${area}: ${response.status}`);
        break;
      }

      const html = await response.text();
      const listings = parseBatdongsanHtml(html);
      if (listings.length === 0) break;

      allListings.push(...listings.filter((l) => l.rooms === rooms));
    } catch (err) {
      console.error(`ScrapingBee fetch error for ${area}:`, err);
      break;
    }
  }

  return allListings;
}
