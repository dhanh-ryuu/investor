import { describe, it, expect } from "vitest";
import {
  removeOutliers,
  aggregateListings,
  type RawListing,
} from "@/lib/apartment-indicators";

describe("removeOutliers", () => {
  it("removes prices more than 2x the median", () => {
    const prices = [50, 52, 48, 51, 49, 200];
    const result = removeOutliers(prices);
    expect(result).not.toContain(200);
    expect(result).toHaveLength(5);
  });

  it("removes prices less than 0.5x the median", () => {
    const prices = [50, 52, 48, 51, 49, 5];
    const result = removeOutliers(prices);
    expect(result).not.toContain(5);
    expect(result).toHaveLength(5);
  });

  it("returns empty array for empty input", () => {
    expect(removeOutliers([])).toEqual([]);
  });

  it("returns single element as-is", () => {
    expect(removeOutliers([50])).toEqual([50]);
  });
});

describe("aggregateListings", () => {
  it("calculates avg, min, max from listings", () => {
    const listings: RawListing[] = [
      { price: 5000000000, areaM2: 80, rooms: 2, source: "nhatot" },
      { price: 4800000000, areaM2: 75, rooms: 2, source: "nhatot" },
      { price: 5200000000, areaM2: 85, rooms: 2, source: "batdongsan" },
    ];
    const result = aggregateListings(listings);
    expect(result).not.toBeNull();
    expect(result!.avg_price_per_m2).toBeGreaterThan(0);
    expect(result!.min_price_per_m2).toBeLessThanOrEqual(result!.avg_price_per_m2);
    expect(result!.max_price_per_m2).toBeGreaterThanOrEqual(result!.avg_price_per_m2);
    expect(result!.listing_count).toBe(3);
  });

  it("removes outliers before calculating", () => {
    const listings: RawListing[] = [
      { price: 5000000000, areaM2: 80, rooms: 2, source: "nhatot" },
      { price: 4800000000, areaM2: 75, rooms: 2, source: "nhatot" },
      { price: 4900000000, areaM2: 78, rooms: 2, source: "nhatot" },
      { price: 50000000000, areaM2: 80, rooms: 2, source: "nhatot" },
    ];
    const result = aggregateListings(listings);
    expect(result!.listing_count).toBe(3);
  });

  it("returns null for empty listings", () => {
    expect(aggregateListings([])).toBeNull();
  });
});
