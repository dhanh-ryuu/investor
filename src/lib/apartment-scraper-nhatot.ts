import { type RawListing } from "./apartment-indicators";

const CHOTOT_API = "https://gateway.chotot.com/v1/public/ad-listing";

export interface NhatotAd {
  price: number;
  area: number;
  rooms: number;
  subject: string;
  pty_project_name: string;
  price_million_per_m2: number;
}

const AREA_KEYWORDS: Record<string, string[]> = {
  ocean_park_1: ["ocean park gia lâm", "ocean park 1", "ocean park s"],
  ocean_park_2: ["ocean park 2"],
  ocean_park_3: ["ocean park 3"],
};

function matchesArea(ad: NhatotAd, area: string): boolean {
  const keywords = AREA_KEYWORDS[area];
  if (!keywords) return false;

  const text = `${ad.subject} ${ad.pty_project_name}`.toLowerCase();

  // For ocean_park_1: match "ocean park" but NOT "ocean park 2" or "ocean park 3"
  if (area === "ocean_park_1") {
    if (text.includes("ocean park 2") || text.includes("ocean park 3")) {
      return false;
    }
    return keywords.some((kw) => text.includes(kw));
  }

  return keywords.some((kw) => text.includes(kw));
}

export function parseNhatotResponse(
  ads: NhatotAd[],
  area: string,
  rooms: number
): RawListing[] {
  return ads
    .filter((ad) => {
      if (ad.price <= 0 || ad.area <= 0) return false;
      if (ad.rooms !== rooms) return false;
      return matchesArea(ad, area);
    })
    .map((ad) => ({
      price: ad.price,
      areaM2: ad.area,
      rooms: ad.rooms,
      source: "nhatot" as const,
    }));
}

export async function fetchNhatotListings(
  area: string,
  rooms: number
): Promise<RawListing[]> {
  const areaKeywords =
    area === "ocean_park_1"
      ? "vinhomes ocean park"
      : area === "ocean_park_2"
        ? "ocean park 2"
        : "ocean park 3";

  const allListings: NhatotAd[] = [];

  // Fetch 2 pages of 50 results each
  for (let page = 0; page < 2; page++) {
    const url = new URL(CHOTOT_API);
    url.searchParams.set("cg", "1010"); // apartment category
    url.searchParams.set("region_v2", "12000"); // Hanoi
    url.searchParams.set("key", areaKeywords);
    url.searchParams.set("rooms", String(rooms));
    url.searchParams.set("st", "s"); // for sale
    url.searchParams.set("limit", "50");
    url.searchParams.set("o", String(page * 50));

    try {
      const response = await fetch(url.toString(), {
        headers: { "User-Agent": "GoldPriceTracker/1.0" },
      });

      if (!response.ok) {
        console.error(`Nhatot API error: ${response.status}`);
        break;
      }

      const data = await response.json();
      const ads: NhatotAd[] = data.ads || [];
      if (ads.length === 0) break;

      allListings.push(...ads);
    } catch (err) {
      console.error("Nhatot fetch error:", err);
      break;
    }
  }

  return parseNhatotResponse(allListings, area, rooms);
}
