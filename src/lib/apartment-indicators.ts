export interface RawListing {
  price: number;
  areaM2: number;
  rooms: number;
  source: "nhatot" | "batdongsan";
}

export interface AggregatedPrice {
  avg_price_per_m2: number;
  min_price_per_m2: number;
  max_price_per_m2: number;
  listing_count: number;
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
  return { avg_price_per_m2: avg, min_price_per_m2: min, max_price_per_m2: max, listing_count: cleaned.length };
}
