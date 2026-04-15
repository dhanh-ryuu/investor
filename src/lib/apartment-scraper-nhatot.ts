import { type RawListing } from "./apartment-indicators";

const CHOTOT_API = "https://gateway.chotot.com/v1/public/ad-listing";

export interface NhatotAd {
  price: number;
  size: number;
  rooms: number;
  subject: string;
  pty_project_name: string;
  price_million_per_m2: number;
  list_id?: number;
}

const PROJECT_KEYWORDS: Record<string, string[]> = {
  ocean_park_1: ["ocean park gia lâm", "vinhomes ocean park gia"],
  ocean_park_2: ["ocean park 2"],
  ocean_park_3: ["ocean park 3"],
};

function matchesArea(ad: NhatotAd, area: string): boolean {
  const keywords = PROJECT_KEYWORDS[area];
  if (!keywords) return false;

  // Require pty_project_name to contain keywords (much more reliable than subject)
  const projectName = ad.pty_project_name.toLowerCase();

  if (area === "ocean_park_1") {
    // Match "ocean park" in project name but NOT "ocean park 2" or "ocean park 3"
    if (projectName.includes("ocean park 2") || projectName.includes("ocean park 3")) {
      return false;
    }
    return projectName.includes("ocean park");
  }

  return keywords.some((kw) => projectName.includes(kw));
}

export function parseNhatotResponse(
  ads: NhatotAd[],
  area: string,
  rooms: number
): RawListing[] {
  return ads
    .filter((ad) => {
      if (ad.price <= 0 || ad.size <= 0) return false;
      if (ad.rooms !== rooms) return false;
      return matchesArea(ad, area);
    })
    .map((ad) => ({
      price: ad.price,
      areaM2: ad.size,
      rooms: ad.rooms,
      source: "nhatot" as const,
      url: ad.list_id ? `https://www.nhatot.com/${ad.list_id}.htm` : undefined,
      title: ad.subject,
    }));
}

export async function fetchNhatotListings(
  area: string,
  rooms: number
): Promise<RawListing[]> {
  const areaKeywords =
    area === "ocean_park_1"
      ? "vinhomes ocean park gia lam"
      : area === "ocean_park_2"
        ? "vinhomes ocean park 2"
        : "vinhomes ocean park 3";

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
        headers: { "User-Agent": "ApartmentTracker/1.0" },
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
