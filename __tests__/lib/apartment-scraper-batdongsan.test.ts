import { describe, it, expect } from "vitest";
import { parseBatdongsanHtml } from "@/lib/apartment-scraper-batdongsan";
import { readFileSync } from "fs";
import path from "path";

const fixtureHtml = readFileSync(
  path.join(__dirname, "fixtures/batdongsan-listing.html"),
  "utf-8"
);

describe("parseBatdongsanHtml", () => {
  it("extracts listings with price and area", () => {
    const result = parseBatdongsanHtml(fixtureHtml);
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0]).toHaveProperty("price");
    expect(result[0]).toHaveProperty("areaM2");
    expect(result[0]).toHaveProperty("rooms");
    expect(result[0].source).toBe("batdongsan");
  });

  it("parses Vietnamese price format (tỷ)", () => {
    const result = parseBatdongsanHtml(fixtureHtml);
    const first = result[0];
    expect(first.price).toBe(3500000000); // 3.5 tỷ
    expect(first.areaM2).toBe(69);
    expect(first.rooms).toBe(2);
  });

  it("handles empty HTML", () => {
    const result = parseBatdongsanHtml("<html><body></body></html>");
    expect(result).toEqual([]);
  });
});
