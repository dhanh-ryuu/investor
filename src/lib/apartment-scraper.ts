import { fetchNhatotListings } from "./apartment-scraper-nhatot";
import { fetchBatdongsanListings } from "./apartment-scraper-batdongsan";
import {
  aggregateListings,
  type RawListing,
  type AggregatedPrice,
} from "./apartment-indicators";

const AREAS = ["ocean_park_1", "ocean_park_2", "ocean_park_3"] as const;
const BEDROOM_TYPES = [1, 2, 3] as const;

export type AreaKey = (typeof AREAS)[number];
export type BedroomType = (typeof BEDROOM_TYPES)[number];

export interface ScrapeResult {
  area: AreaKey;
  bedroom_type: string;
  data: AggregatedPrice | null;
}

export async function scrapeAllApartments(): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];

  for (const area of AREAS) {
    for (const rooms of BEDROOM_TYPES) {
      const bedroomType = `${rooms}pn`;

      // Fetch from both sources in parallel
      const [nhatotListings, batdongsanListings] = await Promise.allSettled([
        fetchNhatotListings(area, rooms),
        fetchBatdongsanListings(area, rooms),
      ]);

      const allListings: RawListing[] = [];

      if (nhatotListings.status === "fulfilled") {
        allListings.push(...nhatotListings.value);
      } else {
        console.error(
          `Nhatot failed for ${area}/${bedroomType}:`,
          nhatotListings.reason
        );
      }

      if (batdongsanListings.status === "fulfilled") {
        allListings.push(...batdongsanListings.value);
      } else {
        console.error(
          `Batdongsan failed for ${area}/${bedroomType}:`,
          batdongsanListings.reason
        );
      }

      const aggregated = aggregateListings(allListings);
      results.push({ area, bedroom_type: bedroomType, data: aggregated });
    }
  }

  return results;
}
