import { describe, it, expect } from "vitest";
import { parseNhatotResponse, type NhatotAd } from "@/lib/apartment-scraper-nhatot";

describe("parseNhatotResponse", () => {
  it("extracts listings matching ocean park 1 with correct rooms", () => {
    const mockAds: NhatotAd[] = [
      { price: 3500000000, size: 69, rooms: 2, subject: "Bán căn hộ 2PN Vinhomes Ocean Park S1.02", pty_project_name: "Vinhomes Ocean Park Gia Lâm", price_million_per_m2: 50.7 },
      { price: 2800000000, size: 46, rooms: 1, subject: "Bán studio Ocean Park", pty_project_name: "Vinhomes Ocean Park Gia Lâm", price_million_per_m2: 60.9 },
      { price: 5000000000, size: 90, rooms: 3, subject: "Bán chung cư Hoàng Mai", pty_project_name: "Some Other Project", price_million_per_m2: 55.6 },
    ];
    const result = parseNhatotResponse(mockAds, "ocean_park_1", 2);
    expect(result).toHaveLength(1);
    expect(result[0].price).toBe(3500000000);
    expect(result[0].areaM2).toBe(69);
    expect(result[0].rooms).toBe(2);
    expect(result[0].source).toBe("nhatot");
  });

  it("excludes non-ocean park listings even if subject mentions ocean park", () => {
    const mockAds: NhatotAd[] = [
      { price: 1500000000, size: 33, rooms: 1, subject: "Bán CCMN gần Ocean Park", pty_project_name: "", price_million_per_m2: 45.5 },
    ];
    const result = parseNhatotResponse(mockAds, "ocean_park_1", 1);
    expect(result).toHaveLength(0);
  });

  it("matches ocean park 2 by project name", () => {
    const mockAds: NhatotAd[] = [
      { price: 3000000000, size: 65, rooms: 2, subject: "Bán căn hộ tòa N1", pty_project_name: "Vinhomes Ocean Park 2", price_million_per_m2: 46.2 },
    ];
    const result = parseNhatotResponse(mockAds, "ocean_park_2", 2);
    expect(result).toHaveLength(1);
  });

  it("matches ocean park 3 by project name", () => {
    const mockAds: NhatotAd[] = [
      { price: 2500000000, size: 55, rooms: 1, subject: "Studio giá tốt", pty_project_name: "Vinhomes Ocean Park 3", price_million_per_m2: 45.5 },
    ];
    const result = parseNhatotResponse(mockAds, "ocean_park_3", 1);
    expect(result).toHaveLength(1);
  });

  it("excludes ocean park 2 from ocean park 1 results", () => {
    const mockAds: NhatotAd[] = [
      { price: 3000000000, size: 65, rooms: 2, subject: "Căn hộ đẹp", pty_project_name: "Vinhomes Ocean Park 2", price_million_per_m2: 46.2 },
    ];
    const result = parseNhatotResponse(mockAds, "ocean_park_1", 2);
    expect(result).toHaveLength(0);
  });

  it("excludes listings with zero price or size", () => {
    const mockAds: NhatotAd[] = [
      { price: 0, size: 69, rooms: 2, subject: "Ocean Park apartment", pty_project_name: "Vinhomes Ocean Park Gia Lâm", price_million_per_m2: 0 },
    ];
    const result = parseNhatotResponse(mockAds, "ocean_park_1", 2);
    expect(result).toHaveLength(0);
  });

  it("returns empty array when no matches", () => {
    const result = parseNhatotResponse([], "ocean_park_1", 2);
    expect(result).toHaveLength(0);
  });
});
