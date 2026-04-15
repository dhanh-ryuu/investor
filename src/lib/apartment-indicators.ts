export interface RawListing {
  price: number;
  areaM2: number;
  rooms: number;
  source: "nhatot" | "batdongsan";
  url?: string;
  title?: string;
}

export interface ListingSample {
  url: string;
  title: string;
  price: number;
  areaM2: number;
  pricePerM2: number;
  source: "nhatot" | "batdongsan";
}

export interface AggregatedPrice {
  avg_price_per_m2: number;
  min_price_per_m2: number;
  max_price_per_m2: number;
  listing_count: number;
  sample_listings: ListingSample[];
}

export function removeOutliers(prices: number[]): number[] {
  if (prices.length <= 1) return prices;
  const sorted = [...prices].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return prices.filter((p) => p >= median * 0.5 && p <= median * 2);
}

export function aggregateListings(listings: RawListing[]): AggregatedPrice | null {
  if (listings.length === 0) return null;
  const pricesPerM2 = listings.map((l) => Math.round(l.price / l.areaM2));
  const cleaned = removeOutliers(pricesPerM2);
  if (cleaned.length === 0) return null;
  const sum = cleaned.reduce((a, b) => a + b, 0);
  const avg = Math.round(sum / cleaned.length);
  const min = Math.min(...cleaned);
  const max = Math.max(...cleaned);
  // Build sample listings from non-outlier entries
  const cleanedSet = new Set(cleaned);
  const samples: ListingSample[] = listings
    .filter((l) => {
      const ppm2 = Math.round(l.price / l.areaM2);
      return cleanedSet.has(ppm2) && l.url;
    })
    .map((l) => ({
      url: l.url!,
      title: l.title || "",
      price: l.price,
      areaM2: l.areaM2,
      pricePerM2: Math.round(l.price / l.areaM2),
      source: l.source,
    }))
    .slice(0, 10);

  return { avg_price_per_m2: avg, min_price_per_m2: min, max_price_per_m2: max, listing_count: cleaned.length, sample_listings: samples };
}
