import { describe, it, expect } from "vitest";
import { parseGoldPrice } from "@/lib/scraper";
import { readFileSync } from "fs";
import path from "path";

const fixtureHtml = readFileSync(
  path.join(__dirname, "fixtures/gold-page.html"),
  "utf-8"
);

describe("parseGoldPrice", () => {
  it("extracts 9999 gold buy and sell prices", () => {
    const result = parseGoldPrice(fixtureHtml);
    expect(result).toEqual({
      buyPrice: 15200000,
      sellPrice: 15700000,
    });
  });

  it("returns null when 9999 row is not found", () => {
    const html = "<html><body><table><tbody></tbody></table></body></html>";
    const result = parseGoldPrice(html);
    expect(result).toBeNull();
  });

  it("handles prices without dots", () => {
    const html = `<table><tbody><tr><td>Vàng Quý Tùng 9999</td><td>15200000</td><td>15700000</td></tr></tbody></table>`;
    const result = parseGoldPrice(html);
    expect(result).toEqual({ buyPrice: 15200000, sellPrice: 15700000 });
  });
});
